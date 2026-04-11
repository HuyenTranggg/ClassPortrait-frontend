import * as XLSX from 'xlsx';
import type { AttendanceDetailRow } from '../components/AttendanceModals';

/**
 * Tạo tên file export attendance với timestamp để tránh trùng tên.
 * @param classLabel Nhãn lớp học để đưa vào tên file.
 * @param extension Đuôi file export mong muốn.
 * @returns Tên file export hợp lệ để tải về.
 */
const buildAttendanceExportFileName = (classLabel?: string, extension: 'csv' | 'xlsx' = 'csv'): string => {
  const normalizedLabel = String(classLabel || 'class')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .toLowerCase();

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');

  return `attendance_${normalizedLabel || 'class'}_${yyyy}${mm}${dd}_${hh}${min}.${extension}`;
};

/**
 * Escape nội dung CSV để tránh vỡ cột khi có dấu phẩy hoặc dấu ngoặc kép.
 * @param value Giá trị cần escape.
 * @returns Chuỗi an toàn cho định dạng CSV.
 */
const escapeCsvValue = (value: string): string => {
  const normalized = String(value || '').replace(/"/g, '""');
  return `"${normalized}"`;
};

/**
 * Export danh sách điểm danh ra CSV UTF-8 BOM để Excel đọc tiếng Việt chuẩn.
 * @param rows Danh sách chi tiết điểm danh cần xuất.
 * @param classLabel Nhãn lớp học để đặt tên file.
 * @returns Không trả về giá trị.
 */
export const exportAttendanceToCsv = (
  rows: AttendanceDetailRow[],
  classLabel: string | undefined,
  formatDateTime: (value: string | null | undefined, fallback?: string) => string
): void => {
  const headers = ['MSSV', 'Họ và tên', 'Trạng thái', 'Điểm danh lúc'];
  const lines = rows.map((row) => {
    const statusLabel = row.status === 'present' ? 'Có mặt' : 'Vắng';
    return [
      escapeCsvValue(row.mssv),
      escapeCsvValue(row.name || ''),
      escapeCsvValue(statusLabel),
      escapeCsvValue(formatDateTime(row.markedAt, '')),
    ].join(',');
  });

  const csvContent = ['\uFEFF', headers.join(','), ...lines].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.setAttribute('download', buildAttendanceExportFileName(classLabel, 'csv'));
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
};

/**
 * Export danh sách điểm danh ra XLSX.
 * @param rows Danh sách chi tiết điểm danh cần xuất.
 * @param classLabel Nhãn lớp học để đặt tên file.
 * @param formatDateTime Hàm format thời gian dùng chung với UI.
 * @returns Không trả về giá trị.
 */
export const exportAttendanceToXlsx = (
  rows: AttendanceDetailRow[],
  classLabel: string | undefined,
  formatDateTime: (value: string | null | undefined, fallback?: string) => string
): void => {
  const worksheetRows = rows.map((row) => ({
    MSSV: row.mssv,
    'Họ và tên': row.name || '',
    'Trạng thái': row.status === 'present' ? 'Có mặt' : 'Vắng',
    'Điểm danh lúc': formatDateTime(row.markedAt, ''),
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
  XLSX.writeFile(workbook, buildAttendanceExportFileName(classLabel, 'xlsx'));
};
