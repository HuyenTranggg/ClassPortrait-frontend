// frontend/src/services/classService.ts

import api from './api';
import { Class } from '../types/Class';
import { Student } from '../types/Student';

/**
 * Service để tương tác với Class API
 */
export const classService = {
  /**
   * Lấy danh sách tất cả các lớp
   */
  getAll: async (): Promise<Class[]> => {
    const response = await api.get<Class[]>('/classes');
    return response.data;
  },

  /**
   * Lấy thông tin chi tiết một lớp (bao gồm danh sách sinh viên)
   */
  getById: async (id: string): Promise<Class> => {
    const response = await api.get<Class>(`/classes/${id}`);
    return response.data;
  },

  /**
   * Lấy danh sách sinh viên của một lớp
   */
  getStudents: async (id: string): Promise<Student[]> => {
    const response = await api.get<Student[]>(`/classes/${id}/students`);
    return response.data;
  },

  /**
   * Import lớp học mới từ file
   * @param file File Excel, CSV hoặc JSON
   * @returns Promise với thông báo kết quả
   */
  importClass: async (file: File): Promise<{ message: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post<{ message: string }>('/classes/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Xóa một lớp
   */
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/classes/${id}`);
    return response.data;
  },
};

export default classService;
