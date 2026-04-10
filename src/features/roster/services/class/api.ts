import api from '../../../../lib/api';
import { Class } from '../../../../types/Class';
import { Student } from '../../../../types/Student';

/**
 * Nhóm API thao tác với dữ liệu lớp học cốt lõi.
 */
export const classApi = {
  /**
   * Lấy danh sách tất cả lớp thuộc người dùng hiện tại.
   * @returns Mảng lớp học.
   */
  getAll: async (): Promise<Class[]> => {
    const response = await api.get<Class[]>('/classes');
    return response.data;
  },

  /**
   * Lấy chi tiết một lớp theo id.
   * @param id UUID lớp học cần truy vấn.
   * @returns Đối tượng lớp học chi tiết.
   */
  getById: async (id: string): Promise<Class> => {
    const response = await api.get<Class>(`/classes/${id}`);
    return response.data;
  },

  /**
   * Lấy danh sách sinh viên của một lớp.
   * @param id UUID lớp học cần lấy sinh viên.
   * @returns Mảng sinh viên thuộc lớp.
   */
  getStudents: async (id: string): Promise<Student[]> => {
    const response = await api.get<Student[]>(`/classes/${id}/students`);
    return response.data;
  },

  /**
   * Xóa một lớp học.
   * @param id UUID lớp học cần xóa.
   * @returns Thông báo kết quả từ backend.
   */
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/classes/${id}`);
    return response.data;
  },
};

export default classApi;
