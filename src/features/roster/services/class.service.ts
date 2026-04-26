// frontend/src/services/classService.ts

import { classApi } from './class.api';
import { importApi } from '../import/services/import.api';
import { shareApi } from '../share/services/share.api';

export type {
  DuplicateAction,
  DeleteShareLinkResponse,
  CreateShareLinkPayload,
  DuplicateImportOptions,
  ImportClassResult,
  ImportHistoryChangesSummary,
  ImportHistoryClassFieldChange,
  ImportHistoryItem,
  ImportHistoryPagination,
  ImportHistoryResponse,
  ImportHistoryStudentChanges,
  ImportSourceType,
  ShareLink,
  SharedClassInfo,
  SharedClassResponse,
  SharedClassStudent,
  UpdateShareLinkPayload,
} from './class.types';

export const classService = {
  ...classApi,
  ...importApi,
  ...shareApi,
};

export default classService;
