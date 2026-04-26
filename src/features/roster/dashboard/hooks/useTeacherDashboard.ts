import { useCallback, useEffect, useState } from 'react';
import dashboardApi from '../services/dashboard.api';
import {
  AttendanceStatusFilter,
  DashboardClassItem,
  DashboardPagination,
  DashboardSortBy,
  DashboardSummary,
  ShareLinkStatus,
  SortOrder,
} from '../types';

interface DashboardQueryState {
  page: number;
  limit: number;
  expiringSoonDays: number;
  search: string;
  attendanceStatus: AttendanceStatusFilter | '';
  shareLinkStatus: ShareLinkStatus | '';
  sortBy: DashboardSortBy;
  sortOrder: SortOrder;
}

interface UseTeacherDashboardReturn {
  summary: DashboardSummary;
  classes: DashboardClassItem[];
  pagination: DashboardPagination;
  generatedAt: string;
  loading: boolean;
  error: string | null;
  query: DashboardQueryState;
  setSearch: (value: string) => void;
  setAttendanceStatus: (value: AttendanceStatusFilter | '') => void;
  setShareLinkStatus: (value: ShareLinkStatus | '') => void;
  setSortBy: (value: DashboardSortBy) => void;
  setSortOrder: (value: SortOrder) => void;
  setPage: (page: number) => void;
  refetch: () => Promise<void>;
}

const defaultSummary: DashboardSummary = {
  classCount: 0,
  studentCount: 0,
  validPhotoRate: 0,
  expiringSoonLinkCount: 0,
  activeLinkCount: 0,
  inactiveLinkCount: 0,
  expiredLinkCount: 0,
};

const defaultPagination: DashboardPagination = {
  page: 1,
  limit: 10,
  totalItems: 0,
  totalPages: 1,
};

const mapDashboardError = (error: any): string => {
  const status = error?.response?.status;

  if (status === 401) {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  }

  if (status === 403) {
    return 'Bạn không có quyền truy cập dashboard này.';
  }

  if (status === 404) {
    return 'Không tìm thấy endpoint dashboard. Vui lòng kiểm tra backend.';
  }

  return 'Không thể tải dữ liệu dashboard. Vui lòng thử lại.';
};

/**
 * Quản lý toàn bộ state và gọi API cho dashboard giảng viên.
 * @returns Trạng thái dữ liệu dashboard và các action cho UI.
 */
export const useTeacherDashboard = (): UseTeacherDashboardReturn => {
  const [summary, setSummary] = useState<DashboardSummary>(defaultSummary);
  const [classes, setClasses] = useState<DashboardClassItem[]>([]);
  const [pagination, setPagination] = useState<DashboardPagination>(defaultPagination);
  const [generatedAt, setGeneratedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<DashboardQueryState>({
    page: 1,
    limit: 10,
    expiringSoonDays: 3,
    search: '',
    attendanceStatus: '',
    shareLinkStatus: '',
    sortBy: 'classCode',
    sortOrder: 'asc',
  });

  /**
   * Tải dữ liệu dashboard theo bộ lọc hiện tại.
   * @returns Không trả về giá trị.
   */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = await dashboardApi.getTeacherDashboard({
        page: query.page,
        limit: query.limit,
        expiringSoonDays: query.expiringSoonDays,
        search: query.search.trim() || undefined,
        attendanceStatus: query.attendanceStatus || undefined,
        shareLinkStatus: query.shareLinkStatus || undefined,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });

      setSummary(payload.summary || defaultSummary);
      setClasses(payload.classes || []);
      setPagination(payload.pagination || defaultPagination);
      setGeneratedAt(payload.generatedAt || '');
    } catch (fetchError: any) {
      setError(mapDashboardError(fetchError));
      setSummary(defaultSummary);
      setClasses([]);
      setPagination(defaultPagination);
      setGeneratedAt('');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Cập nhật từ khóa tìm kiếm và quay về trang đầu.
   * @param value Chuỗi người dùng nhập để lọc theo mã lớp.
   * @returns Không trả về giá trị.
   */
  const setSearch = (value: string) => {
    setQuery((previous) => ({ ...previous, search: value, page: 1 }));
  };

  /**
   * Cập nhật bộ lọc trạng thái điểm danh và quay về trang đầu.
   * @param value Trạng thái điểm danh cần lọc.
   * @returns Không trả về giá trị.
   */
  const setAttendanceStatus = (value: AttendanceStatusFilter | '') => {
    setQuery((previous) => ({ ...previous, attendanceStatus: value, page: 1 }));
  };

  /**
   * Cập nhật bộ lọc trạng thái link chia sẻ và quay về trang đầu.
   * @param value Trạng thái link chia sẻ cần lọc.
   * @returns Không trả về giá trị.
   */
  const setShareLinkStatus = (value: ShareLinkStatus | '') => {
    setQuery((previous) => ({ ...previous, shareLinkStatus: value, page: 1 }));
  };

  /**
   * Cập nhật cột sắp xếp và quay về trang đầu.
   * @param value Tên cột dùng để sắp xếp.
   * @returns Không trả về giá trị.
   */
  const setSortBy = (value: DashboardSortBy) => {
    setQuery((previous) => ({ ...previous, sortBy: value, page: 1 }));
  };

  /**
   * Cập nhật chiều sắp xếp và quay về trang đầu.
   * @param value Chiều sắp xếp tăng/giảm.
   * @returns Không trả về giá trị.
   */
  const setSortOrder = (value: SortOrder) => {
    setQuery((previous) => ({ ...previous, sortOrder: value, page: 1 }));
  };

  /**
   * Chuyển trang hiện tại của bảng tiến độ lớp.
   * @param page Trang đích cần chuyển tới.
   * @returns Không trả về giá trị.
   */
  const setPage = (page: number) => {
    setQuery((previous) => ({ ...previous, page }));
  };

  return {
    summary,
    classes,
    pagination,
    generatedAt,
    loading,
    error,
    query,
    setSearch,
    setAttendanceStatus,
    setShareLinkStatus,
    setSortBy,
    setSortOrder,
    setPage,
    refetch: fetchData,
  };
};

export default useTeacherDashboard;
