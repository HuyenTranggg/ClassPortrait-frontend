import { ShareLink } from '../../services/class/service';

/**
 * Chuyển datetime ISO sang định dạng input datetime-local.
 * @param value Chuỗi ISO thời gian.
 * @returns Giá trị phù hợp cho input datetime-local.
 */
export const toDateTimeLocalValue = (value?: string | null): string => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const tzOffset = date.getTimezoneOffset() * 60000;
  const localTime = new Date(date.getTime() - tzOffset);

  return localTime.toISOString().slice(0, 16);
};

/**
 * Chuyển input datetime-local về ISO để gửi backend.
 * @param value Giá trị lấy từ input datetime-local.
 * @returns Chuỗi ISO hợp lệ hoặc null nếu input rỗng/không hợp lệ.
 */
export const toIsoFromDateTimeLocal = (value: string): string | null => {
  if (!value.trim()) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
};

/**
 * Format ngày giờ cho giao diện tiếng Việt.
 * @param value Giá trị thời gian đầu vào.
 * @param fallback Giá trị fallback nếu thời gian rỗng hoặc sai.
 * @returns Chuỗi ngày giờ đã format.
 */
export const formatDateTime = (value?: string | null, fallback = 'Không có'): string => {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('vi-VN');
};

/**
 * Chuẩn hóa URL share để luôn dùng origin hiện tại của frontend.
 * @param shareLink Dữ liệu share link backend trả về.
 * @returns URL public có thể copy/mở trực tiếp.
 */
export const buildPublicShareUrl = (shareLink: ShareLink | null): string => {
  if (!shareLink?.shareUrl) {
    return '';
  }

  try {
    const parsed = new URL(shareLink.shareUrl);
    return `${window.location.origin}${parsed.pathname}${parsed.search}`;
  } catch {
    return shareLink.shareUrl;
  }
};

/**
 * Ánh xạ lỗi API thành thông báo dễ hiểu cho người dùng.
 * @param error Lỗi trả về từ request API.
 * @param fallback Thông báo fallback mặc định.
 * @returns Chuỗi thông báo đã map theo mã trạng thái.
 */
export const mapShareApiError = (error: any, fallback: string): string => {
  const status = error?.response?.status;

  if (status === 400) {
    return 'Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại.';
  }

  if (status === 401) {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  }

  if (status === 403) {
    return 'Bạn không có quyền thực hiện thao tác này.';
  }

  if (status === 404) {
    return 'Không tìm thấy lớp hoặc link chia sẻ.';
  }

  if (status === 409) {
    return 'Lớp đã tồn tại link chia sẻ. Đang tải lại dữ liệu hiện tại.';
  }

  return String(error?.response?.data?.message || error?.message || fallback);
};

/**
 * Suy ra trạng thái hiển thị của link chia sẻ dựa trên isActive và expiresAt.
 * @param shareLink Thông tin link chia sẻ.
 * @returns Đối tượng key/label phục vụ UI.
 */
export const getShareLinkStatus = (shareLink: ShareLink): { key: 'inactive' | 'expired' | 'active'; label: string } => {
  if (!shareLink.isActive) {
    return { key: 'inactive', label: 'Đã tắt' };
  }

  if (shareLink.expiresAt) {
    const expiresAtTime = new Date(shareLink.expiresAt).getTime();
    if (!Number.isNaN(expiresAtTime) && Date.now() > expiresAtTime) {
      return { key: 'expired', label: 'Hết hạn' };
    }
  }

  return { key: 'active', label: 'Đang hoạt động' };
};
