export type AttendanceStatusFilter = 'available' | 'no_data';

export type ShareLinkStatus = 'no_link' | 'active' | 'inactive' | 'expired';

export type DashboardSortBy =
  | 'classCode'
  | 'studentCount'
  | 'validPhotoRate'
  | 'presentRate'
  | 'absentCount'
  | 'attendanceStatus'
  | 'shareLinkStatus'
  | 'remainingDays';

export type SortOrder = 'asc' | 'desc';

export interface DashboardSummary {
  classCount: number;
  studentCount: number;
  validPhotoRate: number;
  expiringSoonLinkCount: number;
  activeLinkCount: number;
  inactiveLinkCount: number;
  expiredLinkCount: number;
}

export interface DashboardShareLink {
  status: ShareLinkStatus;
  isActive: boolean;
  isExpired: boolean;
  expiresAt: string | null;
  remainingDays: number | null;
}

export interface DashboardClassItem {
  classId: string;
  classCode: string;
  className?: string;
  studentCount: number;
  validPhotoRate: number;
  presentRate: number | null;
  absentCount: number | null;
  attendanceStatus: 'no_data' | 'available';
  shareLink: DashboardShareLink;
}

export interface DashboardPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface DashboardFilters {
  expiringSoonDays: number;
  search?: string;
  attendanceStatus?: AttendanceStatusFilter;
  shareLinkStatus?: ShareLinkStatus;
  sortBy?: DashboardSortBy;
  sortOrder?: SortOrder;
}

export interface TeacherDashboardResponse {
  summary: DashboardSummary;
  classes: DashboardClassItem[];
  pagination: DashboardPagination;
  filters: DashboardFilters;
  generatedAt: string;
}
