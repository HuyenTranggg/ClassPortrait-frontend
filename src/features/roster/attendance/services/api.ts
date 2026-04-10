import api from '../../../../lib/api';

export type AttendanceStatus = 'present' | 'absent';

export interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
}

export interface AttendanceStudentItem {
  studentId: string;
  mssv: string;
  name?: string;
  status: AttendanceStatus;
  markedAt: string | null;
}

export interface ClassAttendanceResponse {
  classId: string;
  students: AttendanceStudentItem[];
  stats?: AttendanceStats;
}

export interface ToggleAttendanceResponse {
  classId: string;
  studentId: string;
  status: AttendanceStatus;
  markedAt: string;
}

export interface SetAttendanceStatusPayload {
  status: AttendanceStatus;
}

export interface SetAttendanceStatusResponse {
  classId: string;
  studentId: string;
  status: AttendanceStatus;
  markedAt: string;
}

export interface ResetAttendancePayload {
  status?: 'absent';
}

export interface ResetAttendanceResponse {
  classId: string;
  updatedCount: number;
  status: 'absent';
  markedAt: string;
}

export const attendanceService = {
  /**
   * Lấy trạng thái điểm danh của toàn bộ sinh viên trong lớp.
   * @param classId UUID của lớp cần lấy điểm danh.
   * @param includeStats Có trả thêm thống kê tổng quát hay không.
   * @returns Dữ liệu điểm danh gồm danh sách sinh viên và thống kê.
   */
  getClassAttendance: async (classId: string, includeStats = true): Promise<ClassAttendanceResponse> => {
    const response = await api.get<ClassAttendanceResponse>(`/classes/${classId}/attendance`, {
      params: {
        includeStats,
      },
    });

    return response.data;
  },

  /**
   * Toggle trạng thái điểm danh của một sinh viên theo backend logic.
   * @param classId UUID lớp của sinh viên.
   * @param studentId UUID sinh viên cần toggle.
   * @returns Trạng thái mới sau khi toggle.
   */
  toggleStudentAttendance: async (classId: string, studentId: string): Promise<ToggleAttendanceResponse> => {
    const response = await api.patch<ToggleAttendanceResponse>(
      `/classes/${classId}/attendance/students/${studentId}/toggle`
    );

    return response.data;
  },

  /**
   * Gán trạng thái điểm danh tường minh cho một sinh viên.
   * @param classId UUID lớp của sinh viên.
   * @param studentId UUID sinh viên cần cập nhật.
   * @param payload Trạng thái đích muốn set cho sinh viên.
   * @returns Trạng thái mới được backend lưu thành công.
   */
  setStudentAttendanceStatus: async (
    classId: string,
    studentId: string,
    payload: SetAttendanceStatusPayload
  ): Promise<SetAttendanceStatusResponse> => {
    const response = await api.put<SetAttendanceStatusResponse>(
      `/classes/${classId}/attendance/students/${studentId}`,
      payload
    );

    return response.data;
  },

  /**
   * Reset toàn bộ điểm danh của lớp về trạng thái vắng.
   * @param classId UUID lớp cần reset điểm danh.
   * @param payload Payload reset, chỉ chấp nhận status='absent' nếu có gửi.
   * @returns Kết quả reset gồm số lượng bản ghi được cập nhật.
   */
  resetClassAttendance: async (classId: string, payload?: ResetAttendancePayload): Promise<ResetAttendanceResponse> => {
    const response = await api.post<ResetAttendanceResponse>(`/classes/${classId}/attendance/reset`, payload || {});

    return response.data;
  },
};

export default attendanceService;
