// frontend/src/hooks/useClasses.ts

import { useState, useEffect, useCallback } from 'react';
import { Class } from '../types/Class';
import { Student } from '../types/Student';
import { classService } from '../services';

interface UseClassesReturn {
  classes: Class[];
  selectedClass: Class | null;
  students: Student[];
  loading: boolean;
  error: string | null;
  selectClass: (classId: string) => Promise<void>;
  refetchClasses: () => Promise<void>;
}

/**
 * Custom hook để quản lý danh sách lớp học và sinh viên
 */
export const useClasses = (): UseClassesReturn => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lấy danh sách tất cả các lớp
  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await classService.getAll();
      setClasses(data);
      
      // Tự động chọn lớp đầu tiên nếu có
      if (data.length > 0 && !selectedClass) {
        await selectClassInternal(data[0].id, data);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách lớp:', err);
      setError('Không thể tải danh sách lớp. Vui lòng kiểm tra backend đang chạy.');
    } finally {
      setLoading(false);
    }
  }, [selectedClass]);

  // Chọn một lớp và lấy danh sách sinh viên
  const selectClassInternal = async (classId: string, classList?: Class[]) => {
    try {
      setLoading(true);
      setError(null);
      
      // Tìm thông tin lớp từ danh sách hiện có
      const classData = (classList || classes).find(c => c.id === classId);
      if (classData) {
        setSelectedClass(classData);
      }
      
      // Lấy danh sách sinh viên của lớp
      const studentsData = await classService.getStudents(classId);
      setStudents(studentsData);
    } catch (err) {
      console.error('Lỗi khi tải danh sách sinh viên:', err);
      setError('Không thể tải danh sách sinh viên của lớp này.');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const selectClass = useCallback(async (classId: string) => {
    await selectClassInternal(classId);
  }, [classes]);

  const refetchClasses = useCallback(async () => {
    await fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    fetchClasses();
  }, []);

  return {
    classes,
    selectedClass,
    students,
    loading,
    error,
    selectClass,
    refetchClasses,
  };
};

export default useClasses;
