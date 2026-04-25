export type ImportSourceType = 'excel' | 'google_sheet' | 'onedrive';

export interface ImportHistoryClassFieldChange {
  field: string;
  oldValue: string | number | boolean | null;
  newValue: string | number | boolean | null;
}

export interface ImportHistoryStudentChanges {
  added?: number;
  removed?: number;
  renamed?: number;
  updated?: number;
  unchanged?: number;
  [key: string]: number | undefined;
}

export interface ImportHistoryChangesSummary {
  classFieldChanges?: ImportHistoryClassFieldChange[];
  studentChanges?: ImportHistoryStudentChanges;
}

export interface ImportHistoryItem {
  id: string;
  classId: string;
  action?: 'created' | 'updated' | string;
  duplicateDetected?: boolean;
  changesSummary?: ImportHistoryChangesSummary;
  classCode: string;
  courseCode?: string;
  courseName?: string;
  semester?: string;
  sourceType: ImportSourceType;
  sourceName: string;
  totalCount: number;
  importedRows: number;
  skippedRows: number;
  mappingModeUsed: 'auto' | 'manual' | string;
  createdAt: string;
}

export interface ImportHistoryPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ImportHistoryResponse {
  items: ImportHistoryItem[];
  pagination: ImportHistoryPagination;
}

export interface ImportHistoryApiRawResponse {
  items?: ImportHistoryItem[];
  data?: ImportHistoryItem[];
  pagination?: ImportHistoryPagination;
}

export type DuplicateAction = 'ask' | 'create_new' | 'update_existing';

export interface DuplicateImportOptions {
  duplicateAction?: DuplicateAction;
  confirmUpdate?: boolean;
  targetClassId?: string;
}

export interface ImportClassResult {
  success: boolean;
  classId: string;
  message: string;
  action?: 'created' | 'updated' | string;
}

export interface ShareLink {
  id: string;
  token: string;
  shareUrl: string;
  isActive: boolean;
  requireLogin: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export interface CreateShareLinkPayload {
  expiresInDays?: number;
  requireLogin?: boolean;
}

export interface UpdateShareLinkPayload {
  isActive?: boolean;
  expiresAt?: string | null;
  requireLogin?: boolean;
}

export interface DeleteShareLinkResponse {
  success: boolean;
  message: string;
}

export interface SharedClassInfo {
  id: string;
  classCode: string;
  courseCode?: string;
  courseName?: string;
  semester?: string;
  department?: string;
  classType?: string;
  instructor?: string;
}

export interface SharedClassStudent {
  mssv: string;
  name?: string;
  photoUrl?: string;
  photoStatus?: string;
  importOrder?: number;
}

export interface SharedClassResponse {
  classInfo: SharedClassInfo;
  students: SharedClassStudent[];
}
