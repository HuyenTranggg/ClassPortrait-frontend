// frontend/src/services/studentService.ts

import api from './api';
import { Student } from '../types/Student';

/**
 * Service để tương tác với Student API
 */
export const studentService = {
  /**
   * Lấy danh sách tất cả sinh viên
   */
  getAll: async (): Promise<Student[]> => {
    const response = await api.get<Student[]>('/students');
    return response.data;
  },

  /**
   * Lấy URL ảnh của sinh viên
   */
  getPhotoUrl: (mssv: string): string => {
    return `${api.defaults.baseURL}/students/${mssv}/photo`;
  },
};

export default studentService;
