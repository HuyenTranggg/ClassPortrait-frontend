// frontend/src/hooks/usePagination.ts

import { useMemo } from 'react';
import { Student } from '../../../types/Student';
import { PAGINATION_CONFIG } from '../../../config/constants';

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
export const usePagination = (students: Student[], selectedLayout?: number): UsePaginationReturn => {
  // Lấy layout từ state hoặc URL query parameter
  const photosPerRow = useMemo(() => {
    const allowedLayouts = PAGINATION_CONFIG.AVAILABLE_LAYOUTS as readonly number[];

    if (typeof selectedLayout === 'number' && allowedLayouts.includes(selectedLayout)) {
      return selectedLayout;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const parsedLayout = Number(urlParams.get('layout'));

    return allowedLayouts.includes(parsedLayout)
      ? parsedLayout
      : PAGINATION_CONFIG.DEFAULT_LAYOUT;
  }, [selectedLayout]);

  // Tính toán số ảnh mỗi trang
  const photosPerPage = useMemo(
    () => photosPerRow * PAGINATION_CONFIG.ROWS_PER_PAGE,
    [photosPerRow]
  );

  // Giữ tương thích API hook cũ, nhưng frontend hiện để browser tự ngắt trang khi in
  const paginatedPages = useMemo(() => {
    return students.length > 0
      ? [{ pageIndex: 0, students }]
      : [];
  }, [students]);

  const totalPages = paginatedPages.length;

  return {
    photosPerRow,
    photosPerPage,
    totalPages,
    paginatedPages,
  };
};

export default usePagination;
