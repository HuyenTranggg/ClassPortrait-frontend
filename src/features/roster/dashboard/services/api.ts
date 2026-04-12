import api from '../../../../lib/api';
import {
  AttendanceStatusFilter,
  DashboardSortBy,
  ShareLinkStatus,
  SortOrder,
  TeacherDashboardResponse,
} from '../types';

export interface GetTeacherDashboardParams {
  page: number;
  limit: number;
  expiringSoonDays?: number;
  search?: string;
  attendanceStatus?: AttendanceStatusFilter;
  shareLinkStatus?: ShareLinkStatus;
  sortBy?: DashboardSortBy;
  sortOrder?: SortOrder;
}

/**
 * Gọi API dashboard của giảng viên theo bộ lọc và phân trang.
 * @param params Bộ tham số truy vấn dashboard.
 * @returns Dữ liệu dashboard tổng hợp cho giao diện.
 */
const getTeacherDashboard = async (params: GetTeacherDashboardParams): Promise<TeacherDashboardResponse> => {
  const response = await api.get<TeacherDashboardResponse>('/classes/dashboard/overview', {
    params,
  });

  return response.data;
};

export const dashboardApi = {
  getTeacherDashboard,
};

export default dashboardApi;
