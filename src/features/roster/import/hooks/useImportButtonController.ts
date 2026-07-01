import { useMemo, useState } from 'react';
import { DuplicateImportOptions } from '../../services/class.service';
import { extractDuplicateConflict } from '../utils/duplicate';
import { parseExcelFile, parseGoogleSheetFromUrl } from '../utils/parsers';
import { ImportButtonProps, ImportStateSnapshot, MappingMode, SourceType, ImportPreviewData } from '../types';
import { ImportClassResult } from '../../services/class.types';
import { mapImportErrorMessage } from '../utils/errorMessages';
import { submitImportRequest } from '../services/import.service';
import { importApi } from '../services/import.api';

interface ControllerActions {
  setSelectedSource: (source: SourceType) => void;
  setGoogleSheetUrl: (value: string) => void;
  setManualMssvColumn: (value: string) => void;
  setManualNameColumn: (value: string) => void;
  setManualSemesterColumn: (value: string) => void;
  setManualDepartmentColumn: (value: string) => void;
  setManualClassCodeColumn: (value: string) => void;
  setManualCourseCodeColumn: (value: string) => void;
  setManualCourseNameColumn: (value: string) => void;
  setManualClassNameColumn: (value: string) => void;
  setManualClassExamCodeColumn: (value: string) => void;
  setManualExamDateColumn: (value: string) => void;
  setManualExamRoomColumn: (value: string) => void;
  setManualExamTimeColumn: (value: string) => void;
  setManualExamShiftColumn: (value: string) => void;
  setManualInstructorColumn: (value: string) => void;
  setManualDobColumn: (value: string) => void;
  setManualGenderColumn: (value: string) => void;
  setManualEmailColumn: (value: string) => void;
  setStartRow: (value: number) => void;
  setStepThreeManual: () => void;
  setStep: (step: 1 | 2 | 3 | 4 | 5) => void;
  setDuplicateStepModeChoose: () => void;
  openModal: (resetFileInput: () => void) => void;
  closeModal: (resetFileInput: () => void) => void;
  parseAndMoveToConfirmStep: (file: File) => Promise<void>;
  moveSheetToConfirmStep: () => Promise<void>;
  submitAuto: () => Promise<void>;
  submitManual: () => Promise<void>;
  submitFinalImport: () => Promise<void>;
  handleDuplicateCreateNew: () => Promise<void>;
  handleDuplicatePrepareUpdate: () => void;
  handleDuplicateConfirmUpdate: () => Promise<void>;
  setDragOver: (value: boolean) => void;
}

export const useImportButtonController = ({ onImportSuccess }: ImportButtonProps): [ImportStateSnapshot, ControllerActions] => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [stepThreeMode, setStepThreeMode] = useState<'manual' | 'success'>('manual');
  const [selectedSource, setSelectedSource] = useState<SourceType>('excel');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [columns, setColumns] = useState<string[]>([]);

  // Auto-detected columns
  const [autoMssvColumn, setAutoMssvColumn] = useState('');
  const [autoNameColumn, setAutoNameColumn] = useState('');
  const [autoSemesterColumn, setAutoSemesterColumn] = useState('');
  const [autoDepartmentColumn, setAutoDepartmentColumn] = useState('');
  const [autoClassCodeColumn, setAutoClassCodeColumn] = useState('');
  const [autoCourseCodeColumn, setAutoCourseCodeColumn] = useState('');
  const [autoCourseNameColumn, setAutoCourseNameColumn] = useState('');
  const [autoClassNameColumn, setAutoClassNameColumn] = useState('');
  const [autoClassExamCodeColumn, setAutoClassExamCodeColumn] = useState('');
  const [autoExamDateColumn, setAutoExamDateColumn] = useState('');
  const [autoExamRoomColumn, setAutoExamRoomColumn] = useState('');
  const [autoExamTimeColumn, setAutoExamTimeColumn] = useState('');
  const [autoExamShiftColumn, setAutoExamShiftColumn] = useState('');
  const [autoInstructorColumn, setAutoInstructorColumn] = useState('');
  const [autoDobColumn, setAutoDobColumn] = useState('');
  const [autoGenderColumn, setAutoGenderColumn] = useState('');
  const [autoEmailColumn, setAutoEmailColumn] = useState('');

  // Manual override columns
  const [manualMssvColumn, setManualMssvColumn] = useState('');
  const [manualNameColumn, setManualNameColumn] = useState('');
  const [manualSemesterColumn, setManualSemesterColumn] = useState('');
  const [manualDepartmentColumn, setManualDepartmentColumn] = useState('');
  const [manualClassCodeColumn, setManualClassCodeColumn] = useState('');
  const [manualCourseCodeColumn, setManualCourseCodeColumn] = useState('');
  const [manualCourseNameColumn, setManualCourseNameColumn] = useState('');
  const [manualClassNameColumn, setManualClassNameColumn] = useState('');
  const [manualClassExamCodeColumn, setManualClassExamCodeColumn] = useState('');
  const [manualExamDateColumn, setManualExamDateColumn] = useState('');
  const [manualExamRoomColumn, setManualExamRoomColumn] = useState('');
  const [manualExamTimeColumn, setManualExamTimeColumn] = useState('');
  const [manualExamShiftColumn, setManualExamShiftColumn] = useState('');
  const [manualInstructorColumn, setManualInstructorColumn] = useState('');
  const [manualDobColumn, setManualDobColumn] = useState('');
  const [manualGenderColumn, setManualGenderColumn] = useState('');
  const [manualEmailColumn, setManualEmailColumn] = useState('');

  const [startRow, setStartRow] = useState(2);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDragOver, setDragOver] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pendingMappingMode, setPendingMappingMode] = useState<MappingMode | null>(null);
  const [duplicateStepMode, setDuplicateStepMode] = useState<'choose' | 'confirm-update'>('choose');
  const [duplicateConflict, setDuplicateConflict] = useState<ImportStateSnapshot['duplicateConflict']>(null);
  const [previewData, setPreviewData] = useState<ImportPreviewData | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [lastImportedClassIds, setLastImportedClassIds] = useState<string[]>([]);

  const isAutoDetected = useMemo(() => Boolean(autoMssvColumn && autoNameColumn), [autoMssvColumn, autoNameColumn]);

  const setAllAutoColumns = (parsed: ReturnType<typeof parseExcelFile> extends Promise<infer T> ? T : never) => {
    setAutoMssvColumn(parsed.mssvColumn || '');
    setAutoNameColumn(parsed.nameColumn || '');
    setAutoSemesterColumn(parsed.semesterColumn || '');
    setAutoDepartmentColumn(parsed.departmentColumn || '');
    setAutoClassCodeColumn(parsed.classCodeColumn || '');
    setAutoCourseCodeColumn(parsed.courseCodeColumn || '');
    setAutoCourseNameColumn(parsed.courseNameColumn || '');
    setAutoClassNameColumn(parsed.classNameColumn || '');
    setAutoClassExamCodeColumn(parsed.classExamCodeColumn || '');
    setAutoExamDateColumn(parsed.examDateColumn || '');
    setAutoExamRoomColumn(parsed.examRoomColumn || '');
    setAutoExamTimeColumn(parsed.examTimeColumn || '');
    setAutoExamShiftColumn(parsed.examShiftColumn || '');
    setAutoInstructorColumn(parsed.instructorColumn || '');
    setAutoDobColumn(parsed.dobColumn || '');
    setAutoGenderColumn(parsed.genderColumn || '');
    setAutoEmailColumn(parsed.emailColumn || '');
  };

  const setAllManualColumns = (parsed: ReturnType<typeof parseExcelFile> extends Promise<infer T> ? T : never) => {
    setManualMssvColumn(parsed.mssvColumn || parsed.columns[0] || '');
    setManualNameColumn(parsed.nameColumn || parsed.columns[1] || parsed.columns[0] || '');
    setManualSemesterColumn(parsed.semesterColumn || '');
    setManualDepartmentColumn(parsed.departmentColumn || '');
    setManualClassCodeColumn(parsed.classCodeColumn || '');
    setManualCourseCodeColumn(parsed.courseCodeColumn || '');
    setManualCourseNameColumn(parsed.courseNameColumn || '');
    setManualClassNameColumn(parsed.classNameColumn || '');
    setManualClassExamCodeColumn(parsed.classExamCodeColumn || '');
    setManualExamDateColumn(parsed.examDateColumn || '');
    setManualExamRoomColumn(parsed.examRoomColumn || '');
    setManualExamTimeColumn(parsed.examTimeColumn || '');
    setManualExamShiftColumn(parsed.examShiftColumn || '');
    setManualInstructorColumn(parsed.instructorColumn || '');
    setManualDobColumn(parsed.dobColumn || '');
    setManualGenderColumn(parsed.genderColumn || '');
    setManualEmailColumn(parsed.emailColumn || '');
  };

  const resetWizardState = () => {
    setStep(1);
    setStepThreeMode('manual');
    setSelectedSource('excel');
    setSelectedFile(null);
    setGoogleSheetUrl('');
    setColumns([]);
    setAutoMssvColumn(''); setAutoNameColumn('');
    setAutoSemesterColumn(''); setAutoDepartmentColumn(''); setAutoClassCodeColumn('');
    setAutoCourseCodeColumn(''); setAutoCourseNameColumn(''); setAutoClassNameColumn('');
    setAutoClassExamCodeColumn(''); setAutoExamDateColumn(''); setAutoExamRoomColumn('');
    setAutoExamTimeColumn(''); setAutoExamShiftColumn(''); setAutoInstructorColumn('');
    setAutoDobColumn(''); setAutoGenderColumn(''); setAutoEmailColumn('');
    setManualMssvColumn(''); setManualNameColumn('');
    setManualSemesterColumn(''); setManualDepartmentColumn(''); setManualClassCodeColumn('');
    setManualCourseCodeColumn(''); setManualCourseNameColumn(''); setManualClassNameColumn('');
    setManualClassExamCodeColumn(''); setManualExamDateColumn(''); setManualExamRoomColumn('');
    setManualExamTimeColumn(''); setManualExamShiftColumn(''); setManualInstructorColumn('');
    setManualDobColumn(''); setManualGenderColumn(''); setManualEmailColumn('');
    setStartRow(2);
    setIsParsing(false);
    setIsImporting(false);
    setDragOver(false);
    setMessage(null);
    setPendingMappingMode(null);
    setDuplicateStepMode('choose');
    setDuplicateConflict(null);
    setPreviewData(null);
    setIsPreviewLoading(false);
    setLastImportedClassIds([]);
  };

  const validateGoogleSheetUrl = (): string | null => {
    const trimmedUrl = googleSheetUrl.trim();
    if (!trimmedUrl) return 'Vui lòng nhập URL Google Sheet.';
    if (!/docs\.google\.com\/spreadsheets\//i.test(trimmedUrl)) {
      return 'Link Google Sheet không hợp lệ. Vui lòng kiểm tra lại URL.';
    }
    return null;
  };

  const onImportSucceeded = async (classId: string, successMessage?: string, importResult?: ImportClassResult) => {
    setMessage({ type: 'success', text: successMessage || 'Import thành công!' });
    // Lưu classIds để xuất PDF
    if (importResult?.classIds && importResult.classIds.length > 0) {
      setLastImportedClassIds(importResult.classIds);
    } else if (classId) {
      setLastImportedClassIds([classId]);
    }
    if (onImportSuccess) {
      await onImportSuccess(classId);
    }
    setStepThreeMode('success');
    setStep(3);
  };

  // Build extra column options for API calls
  const buildExtraColumnOptions = (mappingMode: MappingMode) => {
    if (mappingMode !== 'manual') return {};
    return {
      semesterColumn: manualSemesterColumn || undefined,
      departmentColumn: manualDepartmentColumn || undefined,
      classCodeColumn: manualClassCodeColumn || undefined,
      courseCodeColumn: manualCourseCodeColumn || undefined,
      courseNameColumn: manualCourseNameColumn || undefined,
      classNameColumn: manualClassNameColumn || undefined,
      classExamCodeColumn: manualClassExamCodeColumn || undefined,
      examDateColumn: manualExamDateColumn || undefined,
      examRoomColumn: manualExamRoomColumn || undefined,
      examTimeColumn: manualExamTimeColumn || undefined,
      examShiftColumn: manualExamShiftColumn || undefined,
      instructorColumn: manualInstructorColumn || undefined,
      dobColumn: manualDobColumn || undefined,
      genderColumn: manualGenderColumn || undefined,
      emailColumn: manualEmailColumn || undefined,
    };
  };

  // Gọi preview API và chuyển sang Step 4
  const runPreview = async (mappingMode: MappingMode) => {
    const usingSheet = selectedSource === 'gsheet';
    const mssvColumn = mappingMode === 'manual' ? manualMssvColumn.trim() : autoMssvColumn;
    const nameColumn = mappingMode === 'manual' ? manualNameColumn.trim() : autoNameColumn;

    if (!mssvColumn || !nameColumn) {
      setMessage({ type: 'error', text: 'Cần chọn đầy đủ cột MSSV và cột Họ và tên.' });
      return;
    }

    setIsPreviewLoading(true);
    setMessage(null);

    try {
      let data: ImportPreviewData;
      const extraCols = buildExtraColumnOptions(mappingMode);
      if (usingSheet) {
        const validationError = validateGoogleSheetUrl();
        if (validationError) {
          setMessage({ type: 'error', text: validationError });
          return;
        }
        data = await importApi.previewImportFromSheet({
          googleSheetUrl: googleSheetUrl.trim(),
          mappingMode,
          mssvColumn,
          nameColumn,
          startRow,
          ...extraCols,
        });
      } else {
        if (!selectedFile) {
          setMessage({ type: 'error', text: 'Vui lòng chọn file để import.' });
          return;
        }
        data = await importApi.previewImport(selectedFile, { mappingMode, mssvColumn, nameColumn, startRow, ...extraCols });
      }

      setPendingMappingMode(mappingMode);
      setPreviewData(data);
      setStep(4);
    } catch (error: any) {
      setMessage({ type: 'error', text: mapImportErrorMessage(error) });
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Thực hiện import thực sự (gọi từ bước Preview)
  const submitImport = async (mappingMode: MappingMode, duplicateOptions?: DuplicateImportOptions) => {
    const usingSheet = selectedSource === 'gsheet';
    if (!usingSheet && !selectedFile) {
      setMessage({ type: 'error', text: 'Vui lòng chọn file để import.' });
      return;
    }

    const mssvColumn = mappingMode === 'manual' ? manualMssvColumn.trim() : autoMssvColumn;
    const nameColumn = mappingMode === 'manual' ? manualNameColumn.trim() : autoNameColumn;

    if (!mssvColumn || !nameColumn) {
      setMessage({ type: 'error', text: 'Cần chọn đầy đủ cột MSSV và cột Họ và tên.' });
      return;
    }

    setIsImporting(true);
    setMessage(null);

    try {
      const extraCols = buildExtraColumnOptions(mappingMode);
      const result = await submitImportRequest({
        source: selectedSource,
        selectedFile,
        googleSheetUrl,
        startRow,
        mappingMode,
        mssvColumn,
        nameColumn,
        duplicateOptions,
        extraCols,
      });

      await onImportSucceeded(result.classId, result.message, result as any);
    } catch (error: any) {
      const conflict = extractDuplicateConflict(error);
      if (conflict) {
        setPendingMappingMode(mappingMode);
        setDuplicateConflict(conflict);
        setDuplicateStepMode('choose');
        setStep(5);
        setMessage(null);
      } else {
        setMessage({ type: 'error', text: mapImportErrorMessage(error) });
      }
    } finally {
      setIsImporting(false);
    }
  };

  const snapshot: ImportStateSnapshot = {
    isOpen, step, stepThreeMode, selectedSource, selectedFile, googleSheetUrl, columns,
    autoMssvColumn, autoNameColumn,
    autoSemesterColumn, autoDepartmentColumn, autoClassCodeColumn, autoCourseCodeColumn,
    autoCourseNameColumn, autoClassNameColumn, autoClassExamCodeColumn, autoExamDateColumn,
    autoExamRoomColumn, autoExamTimeColumn, autoExamShiftColumn, autoInstructorColumn,
    autoDobColumn, autoGenderColumn, autoEmailColumn,
    manualMssvColumn, manualNameColumn,
    manualSemesterColumn, manualDepartmentColumn, manualClassCodeColumn, manualCourseCodeColumn,
    manualCourseNameColumn, manualClassNameColumn, manualClassExamCodeColumn, manualExamDateColumn,
    manualExamRoomColumn, manualExamTimeColumn, manualExamShiftColumn, manualInstructorColumn,
    manualDobColumn, manualGenderColumn, manualEmailColumn,
    startRow,
    isParsing, isImporting, isDragOver, message, isAutoDetected, pendingMappingMode,
    duplicateStepMode, duplicateConflict, previewData, isPreviewLoading,
    lastImportedClassIds,
  };

  const actions: ControllerActions = {
    setSelectedSource,
    setGoogleSheetUrl,
    setManualMssvColumn,
    setManualNameColumn,
    setManualSemesterColumn,
    setManualDepartmentColumn,
    setManualClassCodeColumn,
    setManualCourseCodeColumn,
    setManualCourseNameColumn,
    setManualClassNameColumn,
    setManualClassExamCodeColumn,
    setManualExamDateColumn,
    setManualExamRoomColumn,
    setManualExamTimeColumn,
    setManualExamShiftColumn,
    setManualInstructorColumn,
    setManualDobColumn,
    setManualGenderColumn,
    setManualEmailColumn,
    setStartRow,
    setStepThreeManual: () => setStepThreeMode('manual'),
    setStep,
    setDuplicateStepModeChoose: () => setDuplicateStepMode('choose'),
    openModal: (resetFileInput) => { setIsOpen(true); resetFileInput(); resetWizardState(); },
    closeModal: (resetFileInput) => { setIsOpen(false); resetFileInput(); resetWizardState(); },
    parseAndMoveToConfirmStep: async (file) => {
      const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (!['.xlsx', '.xls'].includes(extension)) {
        setMessage({ type: 'error', text: 'Định dạng file chưa hỗ trợ. Vui lòng chọn file .xlsx hoặc .xls.' });
        return;
      }
      setIsParsing(true);
      setMessage(null);
      try {
        const parsed = await parseExcelFile(file);
        setSelectedFile(file);
        setColumns(parsed.columns);
        setAllAutoColumns(parsed as any);
        setAllManualColumns(parsed as any);
        setStepThreeMode('manual');
        setStep(2);
      } catch (error: any) {
        setMessage({ type: 'error', text: error?.message || 'Không thể đọc file Excel. Vui lòng thử lại.' });
      } finally {
        setIsParsing(false);
      }
    },
    moveSheetToConfirmStep: async () => {
      const validationError = validateGoogleSheetUrl();
      if (validationError) {
        setMessage({ type: 'error', text: validationError });
        return;
      }
      setIsParsing(true);
      setMessage(null);
      try {
        const parsed = await parseGoogleSheetFromUrl(googleSheetUrl.trim());
        setColumns(parsed.columns);
        setAllAutoColumns(parsed as any);
        setAllManualColumns(parsed as any);
        setStepThreeMode('manual');
        setStep(2);
      } catch (error: any) {
        setMessage({ type: 'error', text: mapImportErrorMessage(error) });
      } finally {
        setIsParsing(false);
      }
    },
    // Bước 2 → Preview (step 4)
    submitAuto: async () => runPreview('auto'),
    // Bước 3 → Preview (step 4)
    submitManual: async () => runPreview('manual'),
    // Bước 4 (Preview) → Thực hiện import thật
    submitFinalImport: async () => {
      if (!pendingMappingMode) return;
      await submitImport(pendingMappingMode);
    },
    handleDuplicateCreateNew: async () => {
      if (!pendingMappingMode) return;
      await submitImport(pendingMappingMode, { duplicateAction: 'create_new' });
    },
    handleDuplicatePrepareUpdate: () => setDuplicateStepMode('confirm-update'),
    handleDuplicateConfirmUpdate: async () => {
      if (!pendingMappingMode || !duplicateConflict?.duplicates || duplicateConflict.duplicates.length === 0) {
        setMessage({ type: 'error', text: 'Không tìm thấy lớp mục tiêu để cập nhật.' });
        return;
      }
      await submitImport(pendingMappingMode, {
        duplicateAction: 'update_existing',
        targetClassId: duplicateConflict.duplicates[0].existingClassId,
        confirmUpdate: true,
      });
    },
    setDragOver,
  };

  return [snapshot, actions];
};
