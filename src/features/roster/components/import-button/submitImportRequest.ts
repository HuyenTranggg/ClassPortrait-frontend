import { classService, DuplicateImportOptions, ImportClassResult } from '../../services/classService';
import { MappingMode, SourceType } from './types';

interface SubmitImportRequestParams {
  source: SourceType;
  selectedFile: File | null;
  googleSheetUrl: string;
  startRow: number;
  mappingMode: MappingMode;
  mssvColumn: string;
  nameColumn: string;
  duplicateOptions?: DuplicateImportOptions;
}

export const submitImportRequest = async ({
  source,
  selectedFile,
  googleSheetUrl,
  startRow,
  mappingMode,
  mssvColumn,
  nameColumn,
  duplicateOptions,
}: SubmitImportRequestParams): Promise<ImportClassResult> => {
  const usingSheet = source === 'gsheet';

  if (usingSheet) {
    return classService.importClassFromSheet({
      googleSheetUrl: googleSheetUrl.trim(),
      mappingMode,
      startRow,
      mssvColumn,
      nameColumn,
      duplicateAction: duplicateOptions?.duplicateAction || 'ask',
      confirmUpdate: duplicateOptions?.confirmUpdate,
      targetClassId: duplicateOptions?.targetClassId,
    });
  }

  if (!selectedFile) {
    throw new Error('Vui lòng chọn file để import.');
  }

  return classService.importClass(selectedFile, {
    mssvColumn,
    nameColumn,
    startRow,
    mappingMode,
    duplicateAction: duplicateOptions?.duplicateAction || 'ask',
    confirmUpdate: duplicateOptions?.confirmUpdate,
    targetClassId: duplicateOptions?.targetClassId,
  });
};
