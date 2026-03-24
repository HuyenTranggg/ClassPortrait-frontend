import { useCallback, useEffect, useState } from 'react';
import {
  classService,
  ImportHistoryItem,
  ImportHistoryPagination,
  ImportSourceType,
} from '../classService';

export type ImportHistoryFilter = 'all' | ImportSourceType;

interface UseImportHistoryReturn {
  historyItems: ImportHistoryItem[];
  pagination: ImportHistoryPagination;
  page: number;
  limit: number;
  sourceType: ImportHistoryFilter;
  loading: boolean;
  error: string | null;
  setPage: (nextPage: number) => void;
  setSourceType: (nextSourceType: ImportHistoryFilter) => void;
  refetch: () => Promise<void>;
}

const DEFAULT_LIMIT = 20;

const defaultPagination: ImportHistoryPagination = {
  page: 1,
  limit: DEFAULT_LIMIT,
  total: 0,
  totalPages: 0,
};

export const useImportHistory = (): UseImportHistoryReturn => {
  const [historyItems, setHistoryItems] = useState<ImportHistoryItem[]>([]);
  const [pagination, setPagination] = useState<ImportHistoryPagination>(defaultPagination);
  const [page, setPage] = useState(1);
  const [sourceType, setSourceTypeState] = useState<ImportHistoryFilter>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await classService.getImportHistory({
        page,
        limit: DEFAULT_LIMIT,
        sourceType: sourceType === 'all' ? undefined : sourceType,
      });

      setHistoryItems(response.items || []);
      setPagination(response.pagination || { ...defaultPagination, page, limit: DEFAULT_LIMIT });
    } catch (fetchError: any) {
      const message = String(
        fetchError?.response?.data?.message ||
        fetchError?.message ||
        'Không thể tải lịch sử import. Vui lòng thử lại.'
      );

      setHistoryItems([]);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page, sourceType]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const setSourceType = useCallback((nextSourceType: ImportHistoryFilter) => {
    setSourceTypeState(nextSourceType);
    setPage(1);
  }, []);

  return {
    historyItems,
    pagination,
    page,
    limit: DEFAULT_LIMIT,
    sourceType,
    loading,
    error,
    setPage,
    setSourceType,
    refetch: fetchHistory,
  };
};

export default useImportHistory;