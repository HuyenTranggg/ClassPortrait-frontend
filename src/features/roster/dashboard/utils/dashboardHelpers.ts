import { DashboardClassItem, ShareLinkStatus } from '../types';

export const formatPercent = (value: number | null): string => {
  if (value === null || Number.isNaN(value)) {
    return '--';
  }

  return `${Math.round(value)}%`;
};

export const formatGeneratedAt = (value: string): string => {
  if (!value) {
    return '--';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('vi-VN');
};

/**
 * Tạo nhãn lớp ưu tiên tên lớp, sau đó fallback về mã lớp.
 * @param row Dữ liệu lớp từ dashboard.
 * @returns Chuỗi hiển thị tên lớp phù hợp UI.
 */
export const getClassDisplayName = (row: DashboardClassItem): string => {
  const className = String(row.className || '').trim();

  if (className) {
    return className;
  }

  return row.classCode;
};

/**
 * Trả về nhãn tiếng Việt cho trạng thái link chia sẻ.
 * @param status Trạng thái link từ backend.
 * @returns Chuỗi hiển thị trạng thái phù hợp UI.
 */
export const mapShareStatusLabel = (status: ShareLinkStatus): string => {
  if (status === 'active') {
    return 'Đang hoạt động';
  }

  if (status === 'inactive') {
    return 'Đã tắt';
  }

  if (status === 'expired') {
    return 'Hết hạn';
  }

  return 'Chưa tạo';
};

/**
 * Tạo className badge tương ứng với trạng thái link.
 * @param status Trạng thái link chia sẻ hiện tại.
 * @returns Tên class dùng để tô màu badge.
 */
export const mapShareStatusClassName = (status: ShareLinkStatus): string => {
  if (status === 'active') {
    return 'is-active';
  }

  if (status === 'inactive') {
    return 'is-inactive';
  }

  if (status === 'expired') {
    return 'is-expired';
  }

  return 'is-no-link';
};

/**
 * Chuẩn hóa text hiển thị số ngày còn hạn của link chia sẻ.
 * @param row Dòng dữ liệu lớp cần hiển thị.
 * @returns Chuỗi còn hạn hoặc placeholder khi không có dữ liệu.
 */
export const getRemainingDaysLabel = (row: DashboardClassItem): string => {
  if (row.shareLink.remainingDays === null) {
    return '--';
  }

  if (row.shareLink.remainingDays < 0) {
    return 'Đã quá hạn';
  }

  if (row.shareLink.remainingDays === 0) {
    return 'Hết hạn hôm nay';
  }

  return `${row.shareLink.remainingDays} ngày`;
};
