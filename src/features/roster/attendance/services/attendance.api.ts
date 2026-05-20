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
  markedBy: string | null;
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
  markedBy: string | null;
}

export interface SetAttendanceStatusPayload {
  status: AttendanceStatus;
}

export interface SetAttendanceStatusResponse {
  classId: string;
  studentId: string;
  status: AttendanceStatus;
  markedAt: string;
  markedBy: string | null;
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

/**
 * Context share link – dùng khi giám thị gọi API điểm danh thay chủ lớp.
 * Frontend nhận từ SharedClassResponse.shareContext rồi đính kèm vào mỗi request.
 */
export interface ShareTokenParams {
  shareId: string;
  exp: number;
  sig: string;
}

export const attendanceService = {
  /**
   * Lấy trạng thái điểm danh của toàn bộ sinh viên trong lớp.
   * Hỗ trợ cả chủ lớp và giám thị (truyền shareToken khi gọi với tư cách giám thị).
   * @param classId UUID của lớp cần lấy điểm danh.
   * @param includeStats Có trả thêm thống kê tổng quát hay không.
   * @param shareToken Context share link dành cho giám thị (tuỳ chọn).
   * @returns Dữ liệu điểm danh gồm danh sách sinh viên và thống kê.
   */
  getClassAttendance: async (
    classId: string,
    includeStats = true,
    shareToken?: ShareTokenParams,
  ): Promise<ClassAttendanceResponse> => {
    const response = await api.get<ClassAttendanceResponse>(`/classes/${classId}/attendance`, {
      params: {
        includeStats,
        ...(shareToken && { shareId: shareToken.shareId, exp: shareToken.exp, sig: shareToken.sig }),
      },
    });

    return response.data;
  },

  /**
   * Toggle trạng thái điểm danh của một sinh viên theo backend logic.
   * Hỗ trợ cả chủ lớp và giám thị (truyền shareToken khi gọi với tư cách giám thị).
   * @param classId UUID lớp của sinh viên.
   * @param studentId UUID sinh viên cần toggle.
   * @param shareToken Context share link dành cho giám thị (tuỳ chọn).
   * @returns Trạng thái mới sau khi toggle.
   */
  toggleStudentAttendance: async (
    classId: string,
    studentId: string,
    shareToken?: ShareTokenParams,
  ): Promise<ToggleAttendanceResponse> => {
    const response = await api.patch<ToggleAttendanceResponse>(
      `/classes/${classId}/attendance/students/${studentId}/toggle`,
      undefined,
      {
        params: shareToken
          ? { shareId: shareToken.shareId, exp: shareToken.exp, sig: shareToken.sig }
          : undefined,
      },
    );

    return response.data;
  },

  /**
   * Gán trạng thái điểm danh tường minh cho một sinh viên.
   * Hỗ trợ cả chủ lớp và giám thị (truyền shareToken khi gọi với tư cách giám thị).
   * @param classId UUID lớp của sinh viên.
   * @param studentId UUID sinh viên cần cập nhật.
   * @param payload Trạng thái đích muốn set cho sinh viên.
   * @param shareToken Context share link dành cho giám thị (tuỳ chọn).
   * @returns Trạng thái mới được backend lưu thành công.
   */
  setStudentAttendanceStatus: async (
    classId: string,
    studentId: string,
    payload: SetAttendanceStatusPayload,
    shareToken?: ShareTokenParams,
  ): Promise<SetAttendanceStatusResponse> => {
    const response = await api.put<SetAttendanceStatusResponse>(
      `/classes/${classId}/attendance/students/${studentId}`,
      payload,
      {
        params: shareToken
          ? { shareId: shareToken.shareId, exp: shareToken.exp, sig: shareToken.sig }
          : undefined,
      },
    );

    return response.data;
  },

  /**
   * Reset toàn bộ điểm danh của lớp về trạng thái vắng.
   * Chỉ dành cho chủ lớp, không hỗ trợ giám thị.
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
