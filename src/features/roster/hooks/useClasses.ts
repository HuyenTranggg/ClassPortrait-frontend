// frontend/src/hooks/useClasses.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { Class } from '../../../types/Class';
import { Student } from '../../../types/Student';
import { classService } from '../services/class.service';

interface UseClassesReturn {
  classes: Class[];
  selectedClass: Class | null;
  students: Student[];
  loading: boolean;
  error: string | null;
  selectClass: (classId: string) => Promise<void>;
  refetchClasses: (preferredClassId?: string) => Promise<void>;
}

interface UseClassesOptions {
  enabled?: boolean;
  preferredClassId?: string;
}

/**
 * Custom hook để quản lý danh sách lớp học và sinh viên
 */
export const useClasses = ({ enabled = true, preferredClassId }: UseClassesOptions = {}): UseClassesReturn => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const classesRef = useRef<Class[]>([]);
  const selectedClassIdRef = useRef<string | null>(null);

  // Chọn một lớp và lấy danh sách sinh viên
  const selectClassInternal = useCallback(async (classId: string, classList?: Class[]) => {
    try {
      setLoading(true);
      setError(null);
      
      // Tìm thông tin lớp từ danh sách hiện có
      let classData = (classList || classesRef.current).find(c => c.id === classId);

      if (!classData) {
        classData = await classService.getById(classId);
      }

      setSelectedClass(classData);
      selectedClassIdRef.current = classData.id;
      
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
  }, []);

  // Lấy danh sách tất cả các lớp
  const fetchClasses = useCallback(async (preferredClassId?: string) => {
    if (!enabled) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await classService.getAll();
      setClasses(data);
      classesRef.current = data;

      if (data.length === 0) {
        setSelectedClass(null);
        selectedClassIdRef.current = null;
        setStudents([]);
        return;
      }

      const preferredExists = preferredClassId && data.some((cls) => cls.id === preferredClassId);
      const currentSelectedClassId = selectedClassIdRef.current;
      const currentExists = currentSelectedClassId && data.some((cls) => cls.id === currentSelectedClassId);
      const classIdToSelect = preferredExists
        ? preferredClassId
        : currentExists
          ? currentSelectedClassId!
          : data[0].id;

      await selectClassInternal(classIdToSelect, data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách lớp:', err);
      setError('Không thể tải danh sách lớp. Vui lòng kiểm tra backend đang chạy.');
    } finally {
      setLoading(false);
    }
  }, [enabled, selectClassInternal]);

  const selectClass = useCallback(async (classId: string) => {
    await selectClassInternal(classId);
  }, [selectClassInternal]);

  const refetchClassesWithPreferred = useCallback(async (preferredClassId?: string) => {
    await fetchClasses(preferredClassId);
  }, [fetchClasses]);

  useEffect(() => {
    fetchClasses(preferredClassId);
  }, [fetchClasses, preferredClassId]);

  return {
    classes,
    selectedClass,
    students,
    loading,
    error,
    selectClass,
    refetchClasses: refetchClassesWithPreferred,
  };
};

export default useClasses;
