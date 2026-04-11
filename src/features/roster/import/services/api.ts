import api from '../../../../lib/api';
import {
  DuplicateAction,
  ImportClassResult,
  ImportHistoryApiRawResponse,
  ImportHistoryResponse,
  ImportSourceType,
} from '../../services/class/types';

interface ImportClassOptions {
  mssvColumn?: string;
  nameColumn?: string;
  startRow?: number;
  mappingMode?: 'auto' | 'manual';
  duplicateAction?: DuplicateAction;
  confirmUpdate?: boolean;
  targetClassId?: string;
}

interface ImportSheetPayload extends ImportClassOptions {
  googleSheetUrl: string;
  mappingMode: 'auto' | 'manual';
}

/**
 * Nhóm API phục vụ nghiệp vụ import lớp học.
 */
export const importApi = {
  /**
   * Import lớp học từ file upload.
   * @param file File nguồn cần import.
   * @param options Tùy chọn mapping và xử lý trùng.
   * @returns Kết quả import lớp học.
   */
  importClass: async (file: File, options?: ImportClassOptions): Promise<ImportClassResult> => {
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

    const response = await api.post<ImportClassResult>('/classes/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  /**
   * Import lớp học từ Google Sheet.
   * @param payload Payload chứa link sheet và tùy chọn mapping.
   * @returns Kết quả import lớp học.
   */
  importClassFromSheet: async (payload: ImportSheetPayload): Promise<ImportClassResult> => {
    const response = await api.post<ImportClassResult>('/classes/import-from-sheet', payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  },

  /**
   * Lấy lịch sử import có phân trang.
   * @param params Bộ lọc phân trang và nguồn import.
   * @returns Danh sách lịch sử import theo định dạng chuẩn UI.
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
};

export default importApi;
