import { useMemo } from 'react';
import type { Student } from '../../../../types/Student';
import type { AttendanceFilter, SavedAttendanceState } from '../services/attendance.service';

interface UseRosterFilteredStudentsOptions {
  students: Student[];
  attendanceSearch: string;
  isAttendanceMode: boolean;
  attendanceFilter: AttendanceFilter;
  savedAttendance: SavedAttendanceState | null;
}

/**
 * Lọc danh sách sinh viên theo trạng thái điểm danh và từ khóa tìm kiếm.
 */
export const useRosterFilteredStudents = ({
  students,
  attendanceSearch,
  isAttendanceMode,
  attendanceFilter,
  savedAttendance,
}: UseRosterFilteredStudentsOptions): Student[] => {
  return useMemo(() => {
    const normalizedQuery = attendanceSearch.trim().toLowerCase();

    return students.filter((student) => {
      if (!isAttendanceMode && savedAttendance && attendanceFilter !== 'all') {
        const status = savedAttendance.records[student.mssv]?.status;
        if (status !== attendanceFilter) {
          return false;
        }
      }

      if (!normalizedQuery) {
        return true;
      }

      const normalizedName = String(student.name || '').toLowerCase();
      const normalizedMssv = String(student.mssv || '').toLowerCase();

      return normalizedName.includes(normalizedQuery) || normalizedMssv.includes(normalizedQuery);
    });
  }, [attendanceFilter, attendanceSearch, isAttendanceMode, savedAttendance, students]);
};

export default useRosterFilteredStudents;
