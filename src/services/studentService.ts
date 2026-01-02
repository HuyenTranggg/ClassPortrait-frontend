// frontend/src/services/studentService.ts

import api from './api';

/**
 * Service để tương tác với Student API
 */
export const studentService = {
  /**
   * Lấy URL ảnh của sinh viên
   */
  getPhotoUrl: (mssv: string): string => {
    return `${api.defaults.baseURL}/students/${mssv}/photo`;
  },
};

export default studentService;
