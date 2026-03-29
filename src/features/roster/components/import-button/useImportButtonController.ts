import { useMemo, useState } from 'react';
import { DuplicateImportOptions } from '../../services/classService';
import { extractDuplicateConflict } from './duplicate';
import { parseExcelFile, parseGoogleSheetFromUrl } from './parsers';
import { ImportButtonProps, ImportStateSnapshot, MappingMode, SourceType } from './types';
import { mapImportErrorMessage } from './errorMessages';
import { submitImportRequest } from './submitImportRequest';

interface ControllerActions {
  setSelectedSource: (source: SourceType) => void;
  setGoogleSheetUrl: (value: string) => void;
  setManualMssvColumn: (value: string) => void;
  setManualNameColumn: (value: string) => void;
  setStartRow: (value: number) => void;
  setStepThreeManual: () => void;
  setStep: (step: 1 | 2 | 3 | 4) => void;
  setDuplicateStepModeChoose: () => void;
  openModal: (resetFileInput: () => void) => void;
  closeModal: (resetFileInput: () => void) => void;
  parseAndMoveToConfirmStep: (file: File) => Promise<void>;
  moveSheetToConfirmStep: () => Promise<void>;
  submitAuto: () => Promise<void>;
  submitManual: () => Promise<void>;
  handleDuplicateCreateNew: () => Promise<void>;
  handleDuplicatePrepareUpdate: () => void;
  handleDuplicateConfirmUpdate: () => Promise<void>;
  setDragOver: (value: boolean) => void;
}

export const useImportButtonController = ({ onImportSuccess }: ImportButtonProps): [ImportStateSnapshot, ControllerActions] => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [stepThreeMode, setStepThreeMode] = useState<'manual' | 'success'>('manual');
  const [selectedSource, setSelectedSource] = useState<SourceType>('excel');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [columns, setColumns] = useState<string[]>([]);
  const [autoMssvColumn, setAutoMssvColumn] = useState('');
  const [autoNameColumn, setAutoNameColumn] = useState('');
  const [manualMssvColumn, setManualMssvColumn] = useState('');
  const [manualNameColumn, setManualNameColumn] = useState('');
  const [startRow, setStartRow] = useState(2);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDragOver, setDragOver] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pendingMappingMode, setPendingMappingMode] = useState<MappingMode | null>(null);
  const [duplicateStepMode, setDuplicateStepMode] = useState<'choose' | 'confirm-update'>('choose');
  const [duplicateConflict, setDuplicateConflict] = useState<ImportStateSnapshot['duplicateConflict']>(null);

  const isAutoDetected = useMemo(() => Boolean(autoMssvColumn && autoNameColumn), [autoMssvColumn, autoNameColumn]);

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
    setDragOver(false);
    setMessage(null);
    setPendingMappingMode(null);
    setDuplicateStepMode('choose');
    setDuplicateConflict(null);
  };

  const validateGoogleSheetUrl = (): string | null => {
    const trimmedUrl = googleSheetUrl.trim();
    if (!trimmedUrl) {
      return 'Vui lòng nhập URL Google Sheet.';
    }
    if (!/docs\.google\.com\/spreadsheets\//i.test(trimmedUrl)) {
      return 'Link Google Sheet không hợp lệ. Vui lòng kiểm tra lại URL.';
    }
    return null;
  };

  const onImportSucceeded = async (classId: string, successMessage?: string) => {
    setMessage({ type: 'success', text: successMessage || 'Import thành công!' });
    await onImportSuccess(classId);
    setStepThreeMode('success');
    setStep(3);
  };

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

    if (usingSheet) {
      const validationError = validateGoogleSheetUrl();
      if (validationError) {
        setMessage({ type: 'error', text: validationError });
        return;
      }
    }

    setIsImporting(true);
    setMessage(null);

    try {
      const result = await submitImportRequest({
        source: selectedSource,
        selectedFile,
        googleSheetUrl,
        startRow,
        mappingMode,
        mssvColumn,
        nameColumn,
        duplicateOptions,
      });

      await onImportSucceeded(result.classId, result.message);
    } catch (error: any) {
      const conflict = extractDuplicateConflict(error);
      if (conflict) {
        setPendingMappingMode(mappingMode);
        setDuplicateConflict(conflict);
        setDuplicateStepMode('choose');
        setStep(4);
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
    autoMssvColumn, autoNameColumn, manualMssvColumn, manualNameColumn, startRow,
    isParsing, isImporting, isDragOver, message, isAutoDetected, pendingMappingMode,
    duplicateStepMode, duplicateConflict,
  };

  const actions: ControllerActions = {
    setSelectedSource,
    setGoogleSheetUrl,
    setManualMssvColumn,
    setManualNameColumn,
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
        setAutoMssvColumn(parsed.mssvColumn || '');
        setAutoNameColumn(parsed.nameColumn || '');
        setManualMssvColumn(parsed.mssvColumn || parsed.columns[0] || '');
        setManualNameColumn(parsed.nameColumn || parsed.columns[1] || parsed.columns[0] || '');
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
        setAutoMssvColumn(parsed.mssvColumn || '');
        setAutoNameColumn(parsed.nameColumn || '');
        setManualMssvColumn(parsed.mssvColumn || parsed.columns[0] || '');
        setManualNameColumn(parsed.nameColumn || parsed.columns[1] || parsed.columns[0] || '');
        setStepThreeMode('manual');
        setStep(2);
      } catch (error: any) {
        setMessage({ type: 'error', text: mapImportErrorMessage(error) });
      } finally {
        setIsParsing(false);
      }
    },
    submitAuto: async () => submitImport('auto'),
    submitManual: async () => submitImport('manual'),
    handleDuplicateCreateNew: async () => {
      if (!pendingMappingMode) {
        return;
      }

      await submitImport(pendingMappingMode, { duplicateAction: 'create_new' });
    },
    handleDuplicatePrepareUpdate: () => setDuplicateStepMode('confirm-update'),
    handleDuplicateConfirmUpdate: async () => {
      if (!pendingMappingMode || !duplicateConflict?.existingClassId) {
        setMessage({ type: 'error', text: 'Không tìm thấy lớp mục tiêu để cập nhật.' });
        return;
      }
      await submitImport(pendingMappingMode, {
        duplicateAction: 'update_existing',
        targetClassId: duplicateConflict.existingClassId,
        confirmUpdate: true,
      });
    },
    setDragOver,
  };

  return [snapshot, actions];
};
