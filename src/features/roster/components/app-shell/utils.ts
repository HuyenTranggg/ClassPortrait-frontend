import { Class, Student } from '../../../../types';
import { PrintMeta, RosterMeta } from './types';

export const ALLOWED_LAYOUTS = [4, 5, 6] as const;

export const isAllowedLayout = (value: number): value is (typeof ALLOWED_LAYOUTS)[number] => {
  return ALLOWED_LAYOUTS.includes(value as (typeof ALLOWED_LAYOUTS)[number]);
};

export const getInitialLayout = (): number => {
  const params = new URLSearchParams(window.location.search);
  const layoutFromUrl = Number(params.get('layout'));
  return isAllowedLayout(layoutFromUrl) ? layoutFromUrl : 4;
};

export const getDisplayNameFromEmail = (email: string | null): string => {
  if (!email) {
    return 'Giangvien';
  }

  const localPart = email.split('@')[0]?.trim() || '';
  const firstPart = localPart.split('.')[0]?.trim() || '';
  const baseName = firstPart || localPart;

  if (!baseName) {
    return 'Giangvien';
  }

  return baseName.charAt(0).toUpperCase() + baseName.slice(1).toLowerCase();
};

export const getClassDisplayName = (cls: Class | null): string => {
  if (!cls) return '';

  const parts: string[] = [];
  if (cls.classCode) parts.push(cls.classCode);
  if (cls.courseCode) parts.push(cls.courseCode);
  if (cls.courseName) parts.push(cls.courseName);
  return parts.join(' - ') || cls.id;
};

export const buildRosterMeta = (selectedClass: Class | null, students: Student[]): RosterMeta => {
  return {
    courseLabel: selectedClass
      ? [selectedClass.courseCode, selectedClass.courseName].filter(Boolean).join(' - ') || 'Chưa có dữ liệu học phần'
      : 'Chưa import dữ liệu',
    classCodeLabel: selectedClass?.classCode || 'Chưa import dữ liệu',
    semesterLabel: selectedClass?.semester || 'Chưa import dữ liệu',
    studentCountLabel: selectedClass ? `${students.length}` : '0',
  };
};

export const buildPrintMeta = (selectedClass: Class | null, students: Student[]): PrintMeta => {
  const selectedClassMeta = selectedClass as any;

  return {
    printCourseLabel: [selectedClass?.courseCode, selectedClass?.courseName].filter(Boolean).join(' - '),
    printDepartment: String(selectedClassMeta?.department || '').trim(),
    printExamDate: String(selectedClassMeta?.examDate || selectedClassMeta?.date || '').trim(),
    printInstructor: String(selectedClassMeta?.instructor || '').trim(),
    printProctor: String(selectedClassMeta?.proctor || selectedClassMeta?.invigilator || '').trim(),
    printExamRoom: String(selectedClassMeta?.examRoom || selectedClassMeta?.room || '').trim(),
    printExamShift: String(selectedClassMeta?.shift || selectedClassMeta?.examShift || '').trim(),
    printExamTime: String(selectedClassMeta?.examTime || selectedClassMeta?.time || '').trim(),
    printClassCode: String(selectedClass?.classCode || '').trim(),
    printStudentCount: selectedClass ? String(students.length) : '',
  };
};
