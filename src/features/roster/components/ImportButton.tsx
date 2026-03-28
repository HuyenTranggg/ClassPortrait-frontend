import React, { useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { classService, type DuplicateImportOptions } from '../services/classService';

interface ImportButtonProps {
  onImportSuccess: (importedClassId?: string) => Promise<void> | void;
}

type ImportStep = 1 | 2 | 3 | 4;

interface ParsedExcelInfo {
  columns: string[];
  mssvColumn?: string;
  nameColumn?: string;
}

type SourceType = 'excel' | 'gsheet' | 'onedrive';

interface DuplicateConflictState {
  existingClassId: string;
  existingClassLabel: string;
  message: string;
  classFieldChanges: Array<{ field: string; oldValue: string; newValue: string }>;
  studentChanges: Array<{ label: string; value: string }>;
  fallbackDiffLines: string[];
}

type DuplicateStepMode = 'choose' | 'confirm-update';

const SOURCE_OPTIONS = [
  {
    key: 'excel',
    title: 'File Excel',
    subtitle: '.xlsx, .xls',
    icon: 'X',
    isEnabled: true,
  },
  {
    key: 'gsheet',
    title: 'Google Sheet',
    subtitle: 'Nhập link',
    icon: 'G',
    isEnabled: true,
  },
  {
    key: 'onedrive',
    title: 'OneDrive',
    subtitle: 'Nhập link',
    icon: 'O',
    isEnabled: false,
  },
] as const;

const normalizeText = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

const CLASS_FIELD_LABELS: Record<string, string> = {
  classCode: 'Mã lớp',
  semester: 'Học kỳ',
  courseCode: 'Mã học phần',
  courseName: 'Tên học phần',
  instructor: 'Giảng viên',
  department: 'Đơn vị',
  examDate: 'Ngày thi',
  examRoom: 'Phòng thi',
  examTime: 'Giờ thi',
  shift: 'Kíp thi',
  proctor: 'Giám thị',
};

const STUDENT_CHANGE_LABELS: Record<string, string> = {
  added: 'Sinh viên thêm mới',
  removed: 'Sinh viên bị xóa',
  renamed: 'Sinh viên đổi tên',
  updated: 'Sinh viên cập nhật',
  unchanged: 'Sinh viên giữ nguyên',
};

const findColumnByKeywords = (columns: string[], keywords: string[]): string | undefined => {
  const normalizedColumns = columns.map((column) => ({
    original: column,
    normalized: normalizeText(column),
  }));

  for (const keyword of keywords) {
    const normalizedKeyword = normalizeText(keyword);
    const exactMatch = normalizedColumns.find((column) => column.normalized === normalizedKeyword);

    if (exactMatch) {
      return exactMatch.original;
    }

    const fuzzyMatch = normalizedColumns.find((column) => column.normalized.includes(normalizedKeyword));
    if (fuzzyMatch) {
      return fuzzyMatch.original;
    }
  }

  return undefined;
};

const detectHeaderRow = (rows: unknown[][]): number => {
  const limit = Math.min(rows.length, 10);

  for (let index = 0; index < limit; index += 1) {
    const row = rows[index] || [];
    const nonEmptyCount = row.filter((cell) => String(cell ?? '').trim()).length;

    if (nonEmptyCount >= 2) {
      return index;
    }
  }

  return 0;
};

const parseExcelFile = async (file: File): Promise<ParsedExcelInfo> => {
  const fileBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error('File Excel không có sheet dữ liệu.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    blankrows: false,
    defval: '',
  });

  if (!rows.length) {
    throw new Error('File Excel đang trống, vui lòng chọn file khác.');
  }

  const headerIndex = detectHeaderRow(rows);
  const rawColumns = rows[headerIndex] || [];
  const columns = rawColumns
    .map((column) => String(column ?? '').trim())
    .map((column, index) => column || `Cột ${index + 1}`);

  const mssvColumn = findColumnByKeywords(columns, [
    'mssv',
    'ma so sinh vien',
    'ma sinh vien',
    'student id',
  ]);

  const nameColumn = findColumnByKeywords(columns, [
    'ho va ten',
    'ho ten',
    'ten sinh vien',
    'full name',
    'name',
  ]);

  return {
    columns,
    mssvColumn,
    nameColumn,
  };
};

const extractSheetMetaFromUrl = (url: string): { spreadsheetId: string; gid: string } => {
  const spreadsheetIdMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/i);

  if (!spreadsheetIdMatch?.[1]) {
    throw new Error('Link Google Sheet không hợp lệ. Vui lòng kiểm tra lại URL.');
  }

  let gid = '0';

  try {
    const parsedUrl = new URL(url);
    gid = parsedUrl.searchParams.get('gid') || '0';
  } catch {
    gid = '0';
  }

  return {
    spreadsheetId: spreadsheetIdMatch[1],
    gid,
  };
};

const parseGoogleSheetFromUrl = async (url: string): Promise<ParsedExcelInfo> => {
  const { spreadsheetId, gid } = extractSheetMetaFromUrl(url);
  const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${encodeURIComponent(gid)}`;

  let response: Response;

  try {
    response = await fetch(csvUrl);
  } catch {
    throw new Error('Không thể truy cập Google Sheet. Vui lòng kiểm tra link, quyền chia sẻ (public) hoặc kết nối mạng.');
  }

  if (response.status === 403 || response.status === 401) {
    throw new Error('Không thể truy cập Google Sheet. Hãy kiểm tra quyền chia sẻ (public hoặc cấp quyền phù hợp).');
  }

  if (!response.ok) {
    throw new Error('Không thể truy cập Google Sheet. Vui lòng kiểm tra lại link và quyền truy cập.');
  }

  const csvContent = await response.text();

  if (!csvContent.trim()) {
    throw new Error('Google Sheet đang trống hoặc không có dữ liệu hợp lệ để import.');
  }

  const workbook = XLSX.read(csvContent, { type: 'string' });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error('Google Sheet không có sheet dữ liệu.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    blankrows: false,
    defval: '',
  });

  if (!rows.length) {
    throw new Error('Google Sheet đang trống hoặc không có dữ liệu hợp lệ để import.');
  }

  const headerIndex = detectHeaderRow(rows);
  const rawColumns = rows[headerIndex] || [];
  const columns = rawColumns
    .map((column) => String(column ?? '').trim())
    .map((column, index) => column || `Cột ${index + 1}`);

  const mssvColumn = findColumnByKeywords(columns, [
    'mssv',
    'ma so sinh vien',
    'ma sinh vien',
    'student id',
  ]);

  const nameColumn = findColumnByKeywords(columns, [
    'ho va ten',
    'ho ten',
    'ten sinh vien',
    'full name',
    'name',
  ]);

  return {
    columns,
    mssvColumn,
    nameColumn,
  };
};

/**
 * Component nút Import file sinh viên
 * Hỗ trợ file Excel (.xlsx, .xls), CSV (.csv) và JSON (.json)
 */
function ImportButton({ onImportSuccess }: ImportButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<ImportStep>(1);
  const [stepThreeMode, setStepThreeMode] = useState<'manual' | 'success'>('manual');
  const [selectedSource, setSelectedSource] = useState<SourceType>('excel');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [columns, setColumns] = useState<string[]>([]);
  const [autoMssvColumn, setAutoMssvColumn] = useState<string>('');
  const [autoNameColumn, setAutoNameColumn] = useState<string>('');
  const [manualMssvColumn, setManualMssvColumn] = useState<string>('');
  const [manualNameColumn, setManualNameColumn] = useState<string>('');
  const [startRow, setStartRow] = useState<number>(2);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pendingMappingMode, setPendingMappingMode] = useState<'auto' | 'manual' | null>(null);
  const [duplicateStepMode, setDuplicateStepMode] = useState<DuplicateStepMode>('choose');
  const [duplicateConflict, setDuplicateConflict] = useState<DuplicateConflictState | null>(null);

  const isAutoDetected = useMemo(
    () => Boolean(autoMssvColumn && autoNameColumn),
    [autoMssvColumn, autoNameColumn]
  );

  const isLikelyGoogleSheetUrl = (url: string): boolean => {
    return /docs\.google\.com\/spreadsheets\//i.test(url);
  };

  const mapImportErrorMessage = (error: any): string => {
    const backendMessage = String(error?.response?.data?.message || error?.message || '').trim();
    const normalized = normalizeText(backendMessage);

    if (
      normalized.includes('failedtofetch') ||
      normalized.includes('networkerror') ||
      normalized.includes('loadfailed') ||
      normalized.includes('khongthetruycap')
    ) {
      return 'Không thể truy cập Google Sheet. Vui lòng kiểm tra link, quyền chia sẻ (public) hoặc kết nối mạng.';
    }

    if (
      normalized.includes('google') &&
      (normalized.includes('url') || normalized.includes('link') || normalized.includes('invalid') || normalized.includes('khonghople'))
    ) {
      return 'Link Google Sheet không hợp lệ. Vui lòng kiểm tra lại URL.';
    }

    if (
      normalized.includes('permission') ||
      normalized.includes('forbidden') ||
      normalized.includes('unauthorized') ||
      normalized.includes('khongcoquyen') ||
      normalized.includes('khongpublic') ||
      normalized.includes('public')
    ) {
      return 'Không thể truy cập Google Sheet. Hãy kiểm tra quyền chia sẻ (public hoặc cấp quyền phù hợp).';
    }

    if (
      normalized.includes('empty') ||
      normalized.includes('nodata') ||
      normalized.includes('khongcodulieu') ||
      normalized.includes('sheetrong')
    ) {
      return 'Google Sheet đang trống hoặc không có dữ liệu hợp lệ để import.';
    }

    return backendMessage || 'Import thất bại!';
  };

  const getDiffLines = (diff: any): string[] => {
    if (!diff) {
      return [];
    }

    if (Array.isArray(diff)) {
      return diff.map((item) => String(item));
    }

    if (typeof diff === 'object') {
      return Object.entries(diff).map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: ${value.map((entry) => String(entry)).join(', ')}`;
        }

        if (value && typeof value === 'object') {
          return `${key}: ${JSON.stringify(value)}`;
        }

        return `${key}: ${String(value)}`;
      });
    }

    return [String(diff)];
  };

  const parseClassFieldChanges = (diff: any): Array<{ field: string; oldValue: string; newValue: string }> => {
    const rawChanges = Array.isArray(diff?.classFieldChanges) ? diff.classFieldChanges : [];

    return rawChanges.map((item: any) => {
      const rawField = String(item?.field || item?.key || item?.name || '').trim();
      const field = CLASS_FIELD_LABELS[rawField] || rawField || 'Trường dữ liệu';
      const oldValue = String(item?.oldValue ?? item?.from ?? '').trim() || '(trống)';
      const newValue = String(item?.newValue ?? item?.to ?? '').trim() || '(trống)';

      return { field, oldValue, newValue };
    });
  };

  const parseStudentChanges = (diff: any): Array<{ label: string; value: string }> => {
    const raw = diff?.studentChanges;

    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return [];
    }

    return Object.entries(raw)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => ({
        label: STUDENT_CHANGE_LABELS[key] || key,
        value: String(value),
      }));
  };

  const extractDuplicateConflict = (error: any): DuplicateConflictState | null => {
    const status = error?.response?.status;
    const payload = error?.response?.data || {};
    const code = normalizeText(String(payload?.code || ''));
    const payloadMessage = String(payload?.message || '').trim();
    const normalizedMessage = normalizeText(payloadMessage);

    const isDuplicateClassError =
      status === 409 &&
      (code.includes('classalreadyexists') ||
        code.includes('duplicateclass') ||
        normalizedMessage.includes('classalreadyexists') ||
        normalizedMessage.includes('loptontai'));

    if (!isDuplicateClassError) {
      return null;
    }

    const existingClass = payload?.existingClass || payload?.class || payload?.targetClass || payload?.duplicateClass || {};
    const existingClassId = String(existingClass?.id || payload?.targetClassId || '').trim();

    if (!existingClassId) {
      return null;
    }

    const classCode = String(existingClass?.classCode || '').trim();
    const semester = String(existingClass?.semester || '').trim();
    const courseCode = String(existingClass?.courseCode || '').trim();
    const courseName = String(existingClass?.courseName || '').trim();

    const existingClassLabel =
      [classCode, semester && `HK ${semester}`, courseCode, courseName].filter(Boolean).join(' - ') || existingClassId;

    const rawDiff = payload?.diff || payload?.changes || payload?.differences || {};

    return {
      existingClassId,
      existingClassLabel,
      message: payloadMessage || 'Lớp đã tồn tại theo bộ nhận diện (mã lớp, học kỳ, mã học phần).',
      classFieldChanges: parseClassFieldChanges(rawDiff),
      studentChanges: parseStudentChanges(rawDiff),
      fallbackDiffLines: getDiffLines(rawDiff),
    };
  };

  const resetWizardState = () => {
    setStep(1);
    setStepThreeMode('manual');
    setSelectedSource('excel');
    setSelectedFile(null);
    setGoogleSheetUrl('');
    setColumns([]);
    setAutoMssvColumn('');
    setAutoNameColumn('');
    setManualMssvColumn('');
    setManualNameColumn('');
    setStartRow(2);
    setIsParsing(false);
    setIsImporting(false);
    setIsDragOver(false);
    setMessage(null);
    setPendingMappingMode(null);
    setDuplicateStepMode('choose');
    setDuplicateConflict(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    resetWizardState();
  };

  const openModal = () => {
    setIsOpen(true);
    resetWizardState();
  };

  const parseAndMoveToConfirmStep = async (file: File) => {
    const validExtensions = ['.xlsx', '.xls'];
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    if (!validExtensions.includes(extension)) {
      setMessage({
        type: 'error',
        text: 'Định dạng file chưa hỗ trợ. Vui lòng chọn file .xlsx hoặc .xls.',
      });
      return;
    }

    setIsParsing(true);
    setMessage(null);

    try {
      const parsedInfo = await parseExcelFile(file);

      setSelectedFile(file);
      setColumns(parsedInfo.columns);
      setAutoMssvColumn(parsedInfo.mssvColumn || '');
      setAutoNameColumn(parsedInfo.nameColumn || '');
      setManualMssvColumn(parsedInfo.mssvColumn || parsedInfo.columns[0] || '');
      setManualNameColumn(parsedInfo.nameColumn || parsedInfo.columns[1] || parsedInfo.columns[0] || '');
      setStepThreeMode('manual');
      setStep(2);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error?.message || 'Không thể đọc file Excel. Vui lòng thử lại.',
      });
    } finally {
      setIsParsing(false);
    }
  };

  const validateGoogleSheetUrl = (): string | null => {
    const trimmedUrl = googleSheetUrl.trim();

    if (!trimmedUrl) {
      return 'Vui lòng nhập URL Google Sheet.';
    }

    if (!isLikelyGoogleSheetUrl(trimmedUrl)) {
      return 'Link Google Sheet không hợp lệ. Vui lòng kiểm tra lại URL.';
    }

    return null;
  };

  const moveSheetToConfirmStep = async () => {
    const validationError = validateGoogleSheetUrl();

    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      return;
    }

    setIsParsing(true);
    setMessage(null);

    try {
      const parsedInfo = await parseGoogleSheetFromUrl(googleSheetUrl.trim());

      setColumns(parsedInfo.columns);
      setAutoMssvColumn(parsedInfo.mssvColumn || '');
      setAutoNameColumn(parsedInfo.nameColumn || '');
      setManualMssvColumn(parsedInfo.mssvColumn || parsedInfo.columns[0] || '');
      setManualNameColumn(parsedInfo.nameColumn || parsedInfo.columns[1] || parsedInfo.columns[0] || '');
      setStepThreeMode('manual');
      setStep(2);
    } catch (error: any) {
      setMessage({ type: 'error', text: mapImportErrorMessage(error) });
    } finally {
      setIsParsing(false);
    }
  };

  const performImport = async (
    mappingMode: 'auto' | 'manual',
    duplicateOptions?: DuplicateImportOptions
  ) => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Vui lòng chọn file để import.' });
      return;
    }

    const mssvColumn = mappingMode === 'manual' ? manualMssvColumn : autoMssvColumn;
    const nameColumn = mappingMode === 'manual' ? manualNameColumn : autoNameColumn;

    if (!mssvColumn || !nameColumn) {
      setMessage({ type: 'error', text: 'Cần chọn đầy đủ cột MSSV và cột Họ và tên.' });
      return;
    }

    setIsImporting(true);
    setMessage(null);

    try {
      const result = await classService.importClass(selectedFile, {
        mssvColumn,
        nameColumn,
        startRow,
        mappingMode,
        duplicateAction: duplicateOptions?.duplicateAction || 'ask',
        confirmUpdate: duplicateOptions?.confirmUpdate,
        targetClassId: duplicateOptions?.targetClassId,
      });

      setMessage({
        type: 'success',
        text: result.message || 'Import thành công!',
      });

      await onImportSuccess(result.classId);
      setStepThreeMode('success');
      setStep(3);
    } catch (error: any) {
      const conflict = extractDuplicateConflict(error);

      if (conflict) {
        setPendingMappingMode(mappingMode);
        setDuplicateConflict(conflict);
        setDuplicateStepMode('choose');
        setStep(4);
        setMessage(null);
        return;
      }

      setMessage({
        type: 'error',
        text: mapImportErrorMessage(error),
      });
    } finally {
      setIsImporting(false);
    }
  };

  const performImportFromSheet = async (
    mappingMode: 'auto' | 'manual',
    duplicateOptions?: DuplicateImportOptions
  ) => {
    const validationError = validateGoogleSheetUrl();

    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      return;
    }

    if (mappingMode === 'manual' && (!manualMssvColumn.trim() || !manualNameColumn.trim())) {
      setMessage({ type: 'error', text: 'Cần nhập đầy đủ tên cột MSSV và cột Họ và tên.' });
      return;
    }

    setIsImporting(true);
    setMessage(null);

    try {
      const result = await classService.importClassFromSheet({
        googleSheetUrl: googleSheetUrl.trim(),
        mappingMode,
        startRow,
        mssvColumn: mappingMode === 'manual' ? manualMssvColumn.trim() || undefined : undefined,
        nameColumn: mappingMode === 'manual' ? manualNameColumn.trim() || undefined : undefined,
        duplicateAction: duplicateOptions?.duplicateAction || 'ask',
        confirmUpdate: duplicateOptions?.confirmUpdate,
        targetClassId: duplicateOptions?.targetClassId,
      });

      setMessage({
        type: 'success',
        text: result.message || 'Import thành công!',
      });

      await onImportSuccess(result.classId);
      setStepThreeMode('success');
      setStep(3);
    } catch (error: any) {
      const conflict = extractDuplicateConflict(error);

      if (conflict) {
        setPendingMappingMode(mappingMode);
        setDuplicateConflict(conflict);
        setDuplicateStepMode('choose');
        setStep(4);
        setMessage(null);
        return;
      }

      setMessage({
        type: 'error',
        text: mapImportErrorMessage(error),
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleDuplicateCreateNew = async () => {
    if (!pendingMappingMode) {
      return;
    }

    if (selectedSource === 'gsheet') {
      await performImportFromSheet(pendingMappingMode, { duplicateAction: 'create_new' });
      return;
    }

    await performImport(pendingMappingMode, { duplicateAction: 'create_new' });
  };

  const handleDuplicatePrepareUpdate = () => {
    setDuplicateStepMode('confirm-update');
  };

  const handleDuplicateConfirmUpdate = async () => {
    if (!pendingMappingMode || !duplicateConflict?.existingClassId) {
      setMessage({ type: 'error', text: 'Không tìm thấy lớp mục tiêu để cập nhật.' });
      return;
    }

    if (selectedSource === 'gsheet') {
      await performImportFromSheet(pendingMappingMode, {
        duplicateAction: 'update_existing',
        targetClassId: duplicateConflict.existingClassId,
        confirmUpdate: true,
      });
      return;
    }

    await performImport(pendingMappingMode, {
      duplicateAction: 'update_existing',
      targetClassId: duplicateConflict.existingClassId,
      confirmUpdate: true,
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    await parseAndMoveToConfirmStep(file);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (!isParsing) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);

    if (isParsing) {
      return;
    }

    const file = event.dataTransfer.files?.[0];

    if (!file) {
      return;
    }

    await parseAndMoveToConfirmStep(file);
  };

  const renderProgress = () => (
    <div className="import-stepper">
      <div className={`import-step ${step >= 1 ? 'is-active' : ''}`}>
        <span className="step-dot">{step > 1 ? '✓' : '1'}</span>
        <span>Chọn nguồn</span>
      </div>
      <div className="step-line" />
      <div className={`import-step ${step >= 2 ? 'is-active' : ''}`}>
        <span className="step-dot">2</span>
        <span>Xác nhận cột</span>
      </div>
      <div className="step-line" />
      <div className={`import-step ${step >= 3 ? 'is-active' : ''}`}>
        <span className="step-dot">3</span>
        <span>Hoàn tất</span>
      </div>
    </div>
  );

  const renderStepOne = () => (
    <>
      <p className="import-modal-subtitle">Chọn nguồn dữ liệu</p>
      {renderProgress()}

      <div className="import-source-grid">
        {SOURCE_OPTIONS.map((source) => (
          <button
            key={source.key}
            type="button"
            className={`import-source-card ${selectedSource === source.key ? 'is-selected' : ''}`}
            onClick={() => source.isEnabled && setSelectedSource(source.key as SourceType)}
            disabled={!source.isEnabled}
          >
            <span className="source-icon">{source.icon}</span>
            <strong>{source.title}</strong>
            <small>{source.subtitle}</small>
          </button>
        ))}
      </div>

      {selectedSource === 'excel' && (
        <div
          className={`import-drop-zone ${isDragOver ? 'is-drag-over' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <h4>Kéo thả file vào đây</h4>
          <button type="button" className="import-link-button" onClick={openFilePicker} disabled={isParsing}>
            hoặc click để chọn file
          </button>
          <span className="drop-hint">.xlsx, .xls - tối đa 10MB</span>
        </div>
      )}

      {selectedSource === 'gsheet' && (
        <>
          <h5 className="import-section-title">GOOGLE SHEET URL</h5>

          <div className="manual-field-group">
            <label htmlFor="google-sheet-url-input">Link Google Sheet *</label>
            <input
              id="google-sheet-url-input"
              type="url"
              className="form-control"
              value={googleSheetUrl}
              onChange={(event) => setGoogleSheetUrl(event.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              disabled={isImporting}
            />
          </div>

          <div className="import-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={moveSheetToConfirmStep}
              disabled={isImporting || isParsing}
            >
              {isParsing ? 'Đang kiểm tra...' : 'Tiếp tục'}
            </button>
          </div>
        </>
      )}
    </>
  );

  const renderStepTwo = () => (
    <>
      <p className="import-modal-subtitle">Xác nhận cấu hình cột - nhận diện tự động</p>
      {renderProgress()}

      <div className={`import-detection-box ${isAutoDetected ? 'is-success' : 'is-warning'}`}>
        <div>
          <strong>
            {isAutoDetected
              ? 'Nhận diện tự động thành công'
              : 'Chưa nhận diện đầy đủ cột, vui lòng chỉnh thủ công'}
          </strong>
          <p>
            {isAutoDetected
              ? `Cột MSSV: ${autoMssvColumn} - Cột Họ và tên: ${autoNameColumn}`
              : 'Hệ thống chưa xác định chính xác cột MSSV hoặc Họ và tên.'}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => {
            setStepThreeMode('manual');
            setStep(3);
          }}
        >
          Chỉnh lại thủ công
        </button>
      </div>

      <h5 className="import-section-title">CỘT ĐÃ NHẬN DIỆN</h5>
      <div className="detected-mapping-card">
        <div className="detected-mapping-row">
          <span>Mã số sinh viên (MSSV)</span>
          <strong>{autoMssvColumn || 'Chưa nhận diện'}</strong>
        </div>
        <div className="detected-mapping-row">
          <span>Họ và tên</span>
          <strong>{autoNameColumn || 'Chưa nhận diện'}</strong>
        </div>
      </div>

      <div className="import-actions">
        <button type="button" className="btn btn-outline-secondary" onClick={() => setStep(1)} disabled={isImporting}>
          Quay lại
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => (selectedSource === 'gsheet' ? performImportFromSheet('auto') : performImport('auto'))}
          disabled={selectedSource === 'excel' ? !isAutoDetected || isImporting : isImporting}
        >
          {isImporting ? 'Đang import...' : 'Xác nhận và Import'}
        </button>
      </div>
    </>
  );

  const renderStepThree = () => {
    if (stepThreeMode === 'success') {
      return (
        <>
          <p className="import-modal-subtitle">Hoàn tất import</p>
          {renderProgress()}

          <div className="import-detection-box is-success">
            <div>
              <strong>Import thành công</strong>
              <p>{message?.text || 'Dữ liệu đã được import thành công.'}</p>
            </div>
          </div>

          <div className="import-actions import-actions-center">
            <button type="button" className="btn btn-primary" onClick={closeModal}>
              Đóng
            </button>
          </div>
        </>
      );
    }

    return (
      <>
        <p className="import-modal-subtitle">Cấu hình cột thủ công</p>
        {renderProgress()}

        <h5 className="import-section-title">CHỈ ĐỊNH CỘT</h5>

        <div className="manual-field-group">
          <label htmlFor="mssv-column-select">Cột mã số sinh viên (MSSV) *</label>
          <select
            id="mssv-column-select"
            className="form-select"
            value={manualMssvColumn}
            onChange={(event) => setManualMssvColumn(event.target.value)}
          >
            <option value="">-- Chọn cột --</option>
            {columns.map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>
        </div>

        <div className="manual-field-group">
          <label htmlFor="name-column-select">Cột họ và tên</label>
          <select
            id="name-column-select"
            className="form-select"
            value={manualNameColumn}
            onChange={(event) => setManualNameColumn(event.target.value)}
          >
            <option value="">-- Chọn cột --</option>
            {columns.map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>
        </div>

        <div className="manual-field-group">
          <label htmlFor="start-row-select">Dữ liệu bắt đầu từ hàng</label>
          <select
            id="start-row-select"
            className="form-select"
            value={startRow}
            onChange={(event) => setStartRow(Number(event.target.value))}
          >
            {Array.from({ length: 10 }, (_, index) => index + 1).map((rowNumber) => (
              <option key={rowNumber} value={rowNumber}>
                Hàng {rowNumber}
              </option>
            ))}
          </select>
        </div>

        <div className="import-actions">
          <button type="button" className="btn btn-outline-secondary" onClick={() => setStep(2)} disabled={isImporting}>
            Quay lại
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => (selectedSource === 'gsheet' ? performImportFromSheet('manual') : performImport('manual'))}
            disabled={!manualMssvColumn || !manualNameColumn || isImporting}
          >
            {isImporting ? 'Đang import...' : 'Xác nhận và Import'}
          </button>
        </div>
      </>
    );
  };

  const renderStepFour = () => {
    if (!duplicateConflict) {
      return null;
    }

    return (
      <>
        <p className="import-modal-subtitle">Lớp đã tồn tại trong hệ thống</p>
        {renderProgress()}

        <div className="import-detection-box is-warning">
          <div>
            <strong>{duplicateConflict.message}</strong>
            <p>Lớp trùng: {duplicateConflict.existingClassLabel}</p>
          </div>
        </div>

        {duplicateStepMode === 'choose' && (
          <div className="import-actions mt-3">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handleDuplicateCreateNew}
              disabled={isImporting}
            >
              {isImporting ? 'Đang xử lý...' : 'Vẫn tạo lớp mới'}
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleDuplicatePrepareUpdate}
              disabled={isImporting}
            >
              Cập nhật lớp đã có
            </button>
          </div>
        )}

        {duplicateStepMode === 'confirm-update' && (
          <>
            <h5 className="import-section-title">THAY ĐỔI PHÁT HIỆN</h5>

            {duplicateConflict.classFieldChanges.length > 0 && (
              <div className="detected-mapping-card mb-3">
                {duplicateConflict.classFieldChanges.map((change) => (
                  <div className="detected-mapping-row" key={`${change.field}-${change.oldValue}-${change.newValue}`}>
                    <span>{change.field}</span>
                    <strong>{change.oldValue}{' -> '}{change.newValue}</strong>
                  </div>
                ))}
              </div>
            )}

            {duplicateConflict.studentChanges.length > 0 && (
              <div className="detected-mapping-card mb-3">
                {duplicateConflict.studentChanges.map((change) => (
                  <div className="detected-mapping-row" key={`${change.label}-${change.value}`}>
                    <span>{change.label}</span>
                    <strong>{change.value}</strong>
                  </div>
                ))}
              </div>
            )}

            {duplicateConflict.classFieldChanges.length === 0 && duplicateConflict.studentChanges.length === 0 && (
              duplicateConflict.fallbackDiffLines.length > 0 ? (
                <ul className="mb-0">
                  {duplicateConflict.fallbackDiffLines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : (
                <p className="mb-0 text-muted">Backend không trả về diff chi tiết, hệ thống sẽ cập nhật metadata và danh sách sinh viên của lớp hiện có.</p>
              )
            )}

            <div className="import-actions mt-3">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setDuplicateStepMode('choose')}
                disabled={isImporting}
              >
                Quay lại
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleDuplicateConfirmUpdate}
                disabled={isImporting}
              >
                {isImporting ? 'Đang cập nhật...' : 'Xác nhận cập nhật lớp'}
              </button>
            </div>
          </>
        )}
      </>
    );
  };

  return (
    <div className="import-container">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      <button
        className="btn btn-success btn-sm"
        onClick={openModal}
        disabled={isParsing || isImporting}
      >
        {isImporting ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Đang import...
          </>
        ) : (
          <>
            <i className="bi bi-upload me-1"></i>
            Import File
          </>
        )}
      </button>

      {isOpen && (
        <div className="import-modal-backdrop" role="presentation" onClick={isImporting ? undefined : closeModal}>
          <div className="import-modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="modal-close"
              onClick={closeModal}
              disabled={isImporting}
              aria-label="Đóng"
            >
              ×
            </button>

            <h2>Import danh sách thí sinh</h2>

            {step === 1 && renderStepOne()}
            {step === 2 && renderStepTwo()}
            {step === 3 && renderStepThree()}
            {step === 4 && renderStepFour()}

            {message && !(step === 3 && stepThreeMode === 'success') && (
              <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} mt-3 mb-0`} role="alert">
                {message.text}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ImportButton;
