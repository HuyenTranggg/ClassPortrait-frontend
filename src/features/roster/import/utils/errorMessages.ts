import { normalizeText } from './parsers';

export const mapImportErrorMessage = (error: any): string => {
  const backendMessage = String(error?.response?.data?.message || error?.message || '').trim();
  const normalized = normalizeText(backendMessage);

  if (
    normalized.includes('failedtofetch') ||
    normalized.includes('networkerror') ||
    normalized.includes('loadfailed') ||
    normalized.includes('khongthetruycap')
  ) {
    return 'Không thể truy cập Google Sheet. Vui lòng kiểm tra link, quyền chia sẻ (public) hoặc kết nối mạng.';
  }

  if (
    normalized.includes('google') &&
    (normalized.includes('url') || normalized.includes('link') || normalized.includes('invalid') || normalized.includes('khonghople'))
  ) {
    return 'Link Google Sheet không hợp lệ. Vui lòng kiểm tra lại URL.';
  }

  if (
    normalized.includes('permission') ||
    normalized.includes('forbidden') ||
    normalized.includes('unauthorized') ||
    normalized.includes('khongcoquyen') ||
    normalized.includes('khongpublic') ||
    normalized.includes('public')
  ) {
    return 'Không thể truy cập Google Sheet. Hãy kiểm tra quyền chia sẻ (public hoặc cấp quyền phù hợp).';
  }

  if (
    normalized.includes('empty') ||
    normalized.includes('nodata') ||
    normalized.includes('khongcodulieu') ||
    normalized.includes('sheetrong')
  ) {
    return 'Google Sheet đang trống hoặc không có dữ liệu hợp lệ để import.';
  }

  return backendMessage || 'Import thất bại!';
};
