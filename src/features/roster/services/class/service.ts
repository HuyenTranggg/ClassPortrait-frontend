// frontend/src/services/classService.ts

import { classApi } from './api';
import { importApi } from '../../import/services/api';
import { shareApi } from '../../share/services/api';

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
} from './types';

export const classService = {
  ...classApi,
  ...importApi,
  ...shareApi,
};

export default classService;
