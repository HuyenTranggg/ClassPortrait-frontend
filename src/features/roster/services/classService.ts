// frontend/src/services/classService.ts

import api from '../../../lib/api';
import { Class } from '../../../types/Class';
import { Student } from '../../../types/Student';

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

interface ImportHistoryApiRawResponse {
  items?: ImportHistoryItem[];
  data?: ImportHistoryItem[];
  pagination?: ImportHistoryPagination;
}

/**
 * Service để tương tác với Class API
 */
export const classService = {
  /**
   * Lấy danh sách tất cả các lớp
   */
  getAll: async (): Promise<Class[]> => {
    const response = await api.get<Class[]>('/classes');
    return response.data;
  },

  /**
   * Lấy thông tin chi tiết một lớp (bao gồm danh sách sinh viên)
   */
  getById: async (id: string): Promise<Class> => {
    const response = await api.get<Class>(`/classes/${id}`);
    return response.data;
  },

  /**
   * Lấy danh sách sinh viên của một lớp
   */
  getStudents: async (id: string): Promise<Student[]> => {
    const response = await api.get<Student[]>(`/classes/${id}/students`);
    return response.data;
  },

  /**
   * Import lớp học mới từ file
   * @param file File Excel, CSV hoặc JSON
   * @returns Promise với kết quả import
   */
  importClass: async (
    file: File,
    options?: {
      mssvColumn?: string;
      nameColumn?: string;
      startRow?: number;
      mappingMode?: 'auto' | 'manual';
      duplicateAction?: DuplicateAction;
      confirmUpdate?: boolean;
      targetClassId?: string;
    }
  ): Promise<ImportClassResult> => {
    const formData = new FormData();
    formData.append('file', file);

    if (options?.mssvColumn) {
      formData.append('mssvColumn', options.mssvColumn);
    }

    if (options?.nameColumn) {
      formData.append('nameColumn', options.nameColumn);
    }

    if (typeof options?.startRow === 'number') {
      formData.append('startRow', String(options.startRow));
    }

    if (options?.mappingMode) {
      formData.append('mappingMode', options.mappingMode);
    }

    if (options?.duplicateAction) {
      formData.append('duplicateAction', options.duplicateAction);
    }

    if (typeof options?.confirmUpdate === 'boolean') {
      formData.append('confirmUpdate', String(options.confirmUpdate));
    }

    if (options?.targetClassId) {
      formData.append('targetClassId', options.targetClassId);
    }

    const response = await api.post<ImportClassResult>(
      '/classes/import',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Import lớp học mới từ link Google Sheet
   */
  importClassFromSheet: async (payload: {
    googleSheetUrl: string;
    mappingMode: 'auto' | 'manual';
    startRow?: number;
    mssvColumn?: string;
    nameColumn?: string;
    duplicateAction?: DuplicateAction;
    confirmUpdate?: boolean;
    targetClassId?: string;
  }): Promise<ImportClassResult> => {
    const response = await api.post<ImportClassResult>(
      '/classes/import-from-sheet',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  },

  /**
   * Lấy lịch sử import theo user hiện tại
   */
  getImportHistory: async (params: {
    page: number;
    limit: number;
    sourceType?: ImportSourceType;
  }): Promise<ImportHistoryResponse> => {
    const response = await api.get<ImportHistoryApiRawResponse>('/classes/import-history', {
      params,
    });

    const payload = response.data || {};

    return {
      items: payload.items || payload.data || [],
      pagination: payload.pagination || {
        page: params.page,
        limit: params.limit,
        total: (payload.items || payload.data || []).length,
        totalPages: 1,
      },
    };
  },

  /**
   * Xóa một lớp
   */
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/classes/${id}`);
    return response.data;
  },
};

export default classService;
