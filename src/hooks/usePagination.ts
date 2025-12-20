// frontend/src/hooks/usePagination.ts

import { useMemo } from 'react';
import { Student } from '../types/Student';
import { PAGINATION_CONFIG } from '../config/constants';

interface PageData {
  pageIndex: number;
  students: Student[];
}

interface UsePaginationReturn {
  photosPerRow: number;
  photosPerPage: number;
  totalPages: number;
  paginatedPages: PageData[];
}

/**
 * Custom hook để xử lý logic phân trang
 */
export const usePagination = (students: Student[]): UsePaginationReturn => {
  // Lấy layout từ URL query parameter
  const photosPerRow = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const layoutParam = urlParams.get('layout');
    return layoutParam === '5' ? 5 : PAGINATION_CONFIG.DEFAULT_LAYOUT;
  }, []);

  // Tính toán số ảnh mỗi trang
  const photosPerPage = useMemo(
    () => photosPerRow * PAGINATION_CONFIG.ROWS_PER_PAGE,
    [photosPerRow]
  );

  // Tính tổng số trang
  const totalPages = useMemo(
    () => Math.ceil(students.length / photosPerPage),
    [students.length, photosPerPage]
  );

  // Tạo dữ liệu phân trang
  const paginatedPages = useMemo(
    () =>
      Array.from({ length: totalPages }, (_, pageIndex) => {
        const startIdx = pageIndex * photosPerPage;
        const endIdx = Math.min(startIdx + photosPerPage, students.length);
        const pageStudents = students.slice(startIdx, endIdx);

        return {
          pageIndex,
          students: pageStudents,
        };
      }),
    [totalPages, photosPerPage, students]
  );

  return {
    photosPerRow,
    photosPerPage,
    totalPages,
    paginatedPages,
  };
};

export default usePagination;
