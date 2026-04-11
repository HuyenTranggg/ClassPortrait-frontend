import type { Student } from '../../../../types/Student';
import type { AttendanceDetailRow } from '../components/AttendanceModals';
import type { AttendanceStatus } from '../../services';

export interface AttendanceRecord {
  studentId: string;
  mssv: string;
  name?: string;
  status: AttendanceStatus;
  markedAt: string | null;
}

export interface SavedAttendanceState {
  takenAt: string;
  stats: {
    total: number;
    present: number;
    absent: number;
  };
  records: Record<string, AttendanceRecord>;
}

export type AttendanceFilter = 'all' | 'present' | 'absent';

export type AppMessage = { type: 'success' | 'error'; text: string } | null;

/**
 * Chuyển danh sách attendance backend về map theo MSSV để tra cứu nhanh khi render.
 */
export const toAttendanceMap = (students: AttendanceRecord[]): Record<string, AttendanceRecord> => {
  return students.reduce<Record<string, AttendanceRecord>>((accumulator, student) => {
    accumulator[student.mssv] = student;
    return accumulator;
  }, {});
};

/**
 * Tính thống kê điểm danh từ bản ghi hiện tại.
 */
export const getAttendanceStats = (records: Record<string, AttendanceRecord>) => {
  const values = Object.values(records);
  const present = values.filter((item) => item.status === 'present').length;
  const total = values.length;

  return {
    total,
    present,
    absent: total - present,
  };
};

/**
 * Lấy mốc thời gian điểm danh mới nhất từ danh sách bản ghi attendance.
 */
export const getLatestMarkedAt = (records: Record<string, AttendanceRecord>): string | null => {
  const timestamps = Object.values(records)
    .map((item) => item.markedAt)
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter((value) => !Number.isNaN(value));

  if (timestamps.length === 0) {
    return null;
  }

  return new Date(Math.max(...timestamps)).toISOString();
};

/**
 * Chuẩn hóa lỗi API điểm danh thành thông báo thân thiện cho người dùng.
 */
export const mapAttendanceError = (error: any): string => {
  const status = error?.response?.status;

  if (status === 400) {
    return 'Dữ liệu điểm danh gửi lên không hợp lệ. Vui lòng kiểm tra lại.';
  }

  if (status === 401) {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  }

  if (status === 403) {
    return 'Không thể thực hiện thao tác điểm danh này.';
  }

  if (status === 404) {
    return 'Không tìm thấy lớp hoặc sinh viên thuộc lớp hiện tại.';
  }

  return String(error?.response?.data?.message || error?.message || 'Không thể xử lý điểm danh. Vui lòng thử lại.');
};

/**
 * Chuyển map kết quả attendance thành danh sách hiển thị trong modal chi tiết.
 */
export const buildAttendanceDetailRows = (
  students: Student[],
  savedAttendance: SavedAttendanceState | null
): AttendanceDetailRow[] => {
  if (!savedAttendance) {
    return [];
  }

  return students
    .map((student) => {
      const record = savedAttendance.records[student.mssv];
      return {
        mssv: student.mssv,
        name: student.name,
        status: record?.status || 'absent',
        markedAt: record?.markedAt || null,
      };
    })
    .sort((left, right) => left.mssv.localeCompare(right.mssv));
};
