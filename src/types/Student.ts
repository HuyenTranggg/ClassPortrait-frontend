/**
 * Interface định nghĩa cấu trúc dữ liệu của một sinh viên
 */
export interface Student {
  mssv: string;
  name?: string;
  photoUrl?: string;        // URL ảnh có chữ ký do backend cấp
  photoStatus?: string;     // trạng thái ảnh: 'found' | 'not_found' | ...
  importOrder?: number;     // thứ tự theo file Excel gốc
}
