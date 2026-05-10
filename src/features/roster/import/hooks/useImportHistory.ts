import { useCallback, useEffect, useState } from 'react';
import { ImportHistoryItem, ImportHistoryPagination, ImportSourceType } from '../../services/class.types';
import { importApi } from '../services/import.api';

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
  deleteHistory: (id: string) => Promise<void>;
}

const DEFAULT_LIMIT = 20;

const defaultPagination: ImportHistoryPagination = {
  page: 1,
  limit: DEFAULT_LIMIT,
  total: 0,
  totalPages: 0,
};

/** Normalize history response - backend mới trả data[], cũ trả items[] */
function normalizeItems(raw: any): ImportHistoryItem[] {
  const list: any[] = raw?.data || raw?.items || [];
  return list.map((item: any) => ({
    ...item,
    // Normalize số liệu stats nếu backend cũ chưa expose
    importedRows: item.importedRows ?? item.columnMapping?.stats?.importedRows ?? 0,
    skippedRows: item.skippedRows ?? item.columnMapping?.stats?.skippedRows ?? 0,
    mappingModeUsed: item.mappingModeUsed ?? item.columnMapping?.mappingModeUsed ?? null,
    // classes có thể là array các ClassSummary từ backend mới
    classes: item.classes ?? [],
    classIds: item.classIds ?? [],
  }));
}

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

      const rawResponse = await importApi.getImportHistory({
        page,
        limit: DEFAULT_LIMIT,
        sourceType: sourceType === 'all' ? undefined : (sourceType as ImportSourceType),
      });

      // Support both shapes: { items, pagination } and { data, pagination }
      const items = normalizeItems(rawResponse);
      const pag = (rawResponse as any).pagination || {
        ...defaultPagination,
        page,
        limit: DEFAULT_LIMIT,
        total: items.length,
      };

      setHistoryItems(items);
      setPagination(pag);
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

  const deleteHistory = useCallback(async (id: string) => {
    await importApi.deleteImportHistory(id);
    await fetchHistory();
  }, [fetchHistory]);

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
    deleteHistory,
  };
};

export default useImportHistory;
