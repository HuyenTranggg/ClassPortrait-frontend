import { Class, Student } from '../../../types';
import { PrintMeta, RosterMeta } from '../types';

export const ALLOWED_LAYOUTS = [4, 5, 6] as const;

export const isAllowedLayout = (value: number): value is (typeof ALLOWED_LAYOUTS)[number] => {
  return ALLOWED_LAYOUTS.includes(value as (typeof ALLOWED_LAYOUTS)[number]);
};

export const getInitialLayout = (params: URLSearchParams): number => {
  const layoutFromUrl = Number(params.get('layout'));
  return isAllowedLayout(layoutFromUrl) ? layoutFromUrl : 5;
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

export const formatDate = (value?: string | Date | null): string => {
  if (!value) return '—';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('vi-VN');
  } catch {
    return '—';
  }
};

export const formatTime = (value?: string | null): string => {
  if (!value) return '—';
  const str = String(value).trim();
  // Nếu là số thập phân (ví dụ 0.666...) → chuyển sang giờ
  const num = parseFloat(str);
  if (!isNaN(num) && str.includes('.')) {
    const totalSeconds = Math.round(num * 24 * 3600);
    const h = Math.floor(totalSeconds / 3600)
      .toString()
      .padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }
  // Nếu là chuỗi giờ hh:mm[:ss]
  if (/^\d{1,2}:\d{2}/.test(str)) return str;
  return str;
};

export const buildRosterMeta = (selectedClass: Class | null, students: Student[]): RosterMeta => {
  return {
    courseLabel: selectedClass
      ? [selectedClass.courseCode, selectedClass.courseName].filter(Boolean).join(' - ') || 'Chưa có dữ liệu học phần'
      : 'Chưa import dữ liệu',
    courseCode: selectedClass?.courseCode || '—',
    courseName: selectedClass?.courseName || '—',
    classCodeLabel: selectedClass?.classCode || '—',
    classExamCode: selectedClass?.classExamCode || '—',
    semesterLabel: selectedClass?.semester || '—',
    examDate: formatDate(selectedClass?.examDate),
    examRoom: selectedClass?.examRoom || '—',
    examTime: formatTime(selectedClass?.examTime),
    examShift: selectedClass?.examShift || selectedClass?.shift || '—',
    instructor: selectedClass?.instructor || '—',
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
    printExamTime: formatTime(selectedClassMeta?.examTime || selectedClassMeta?.time),
    printClassCode: String(selectedClass?.classCode || '').trim(),
    printStudentCount: selectedClass ? String(students.length) : '',
  };
};
