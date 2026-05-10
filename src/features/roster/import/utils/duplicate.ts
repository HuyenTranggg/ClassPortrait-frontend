import { DuplicateConflictState } from '../types';
import { normalizeText } from './parsers';
import { formatExcelTime } from './formatters';

const CLASS_FIELD_LABELS: Record<string, string> = {
  classCode: 'Mã lớp',
  semester: 'Học kỳ',
  courseCode: 'Mã học phần',
  courseName: 'Tên học phần',
  instructor: 'Giảng viên',
  department: 'Đơn vị',
  examDate: 'Ngày thi',
  examRoom: 'Phòng thi',
  examTime: 'Giờ thi',
  shift: 'Kíp thi',
  proctor: 'Giám thị',
};

const STUDENT_CHANGE_LABELS: Record<string, string> = {
  added: 'Số sinh viên sẽ thêm vào lớp',
  removed: 'Số sinh viên sẽ bị loại khỏi lớp',
  renamed: 'Số sinh viên có thay đổi thông tin',
  updated: 'Số sinh viên có thay đổi thông tin',
  unchanged: 'Số sinh viên giữ nguyên',
};

const getDiffLines = (diff: any): string[] => {
  if (!diff) {
    return [];
  }

  if (Array.isArray(diff)) {
    return diff.map((item) => String(item));
  }

  if (typeof diff === 'object') {
    return Object.entries(diff).map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: ${value.map((entry) => String(entry)).join(', ')}`;
      }

      if (value && typeof value === 'object') {
        return `${key}: ${JSON.stringify(value)}`;
      }

      return `${key}: ${String(value)}`;
    });
  }

  return [String(diff)];
};

const parseClassFieldChanges = (diff: any): Array<{ field: string; oldValue: string; newValue: string }> => {
  const rawChanges = Array.isArray(diff?.classFieldChanges) ? diff.classFieldChanges : [];

  return rawChanges.map((item: any) => {
    const rawField = String(item?.field || item?.key || item?.name || '').trim();
    const field = CLASS_FIELD_LABELS[rawField] || rawField || 'Trường dữ liệu';
    const oldValue = String(item?.oldValue ?? item?.from ?? '').trim() || '(trống)';
    const newValue = String(item?.newValue ?? item?.to ?? '').trim() || '(trống)';

    let finalOldValue = oldValue;
    let finalNewValue = newValue;

    if (field === 'Giờ thi') {
      finalOldValue = formatExcelTime(oldValue) || oldValue;
      finalNewValue = formatExcelTime(newValue) || newValue;
    }

    return { field, oldValue: finalOldValue, newValue: finalNewValue };
  });
};

const parseStudentChanges = (diff: any): Array<{ label: string; value: string }> => {
  const raw = diff?.studentChanges;

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return [];
  }

  return Object.entries(raw)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => ({
      label: STUDENT_CHANGE_LABELS[key] || key,
      value: String(value),
    }));
};

export const extractDuplicateConflict = (error: any): DuplicateConflictState | null => {
  const status = error?.response?.status;
  const payload = error?.response?.data || {};
  const code = normalizeText(String(payload?.code || ''));
  const payloadMessage = String(payload?.message || '').trim();
  const normalizedMessage = normalizeText(payloadMessage);

  const isDuplicateClassError =
    status === 409 &&
    (code.includes('classalreadyexists') ||
      code.includes('duplicateclass') ||
      normalizedMessage.includes('classalreadyexists') ||
      normalizedMessage.includes('loptontai'));

  if (!isDuplicateClassError) {
    return null;
  }

  const existingClass = payload?.existingClass || payload?.class || payload?.targetClass || payload?.duplicateClass || {};
  const existingClassId = String(existingClass?.id || payload?.targetClassId || '').trim();

  // Lấy mảng duplicates từ backend (nếu có), hoặc biến existingClass thành mảng 1 phần tử
  const rawDuplicates = Array.isArray(payload?.duplicates) && payload.duplicates.length > 0
    ? payload.duplicates
    : (existingClassId ? [existingClass] : []);

  if (rawDuplicates.length === 0) {
    return null;
  }


  const duplicates = rawDuplicates.map((dup: any) => {
    const classCode = String(dup?.classCode || dup?.classExamCode || '').trim();
    const semester = String(dup?.semester || '').trim();
    const courseCode = String(dup?.courseCode || '').trim();
    const courseName = String(dup?.courseName || '').trim();
    const id = String(dup?.id || dup?.existingClassId || '').trim();

    return {
      existingClassId: id,
      existingClassLabel: [classCode, semester && `HK ${semester}`, courseCode, courseName].filter(Boolean).join(' - ') || id,
      classExamCode: String(dup?.classExamCode || '').trim(),
      classCode: String(dup?.classCode || '').trim(),
      examDate: String(dup?.examDate || '').trim(),
      examRoom: String(dup?.examRoom || '').trim(),
      examTime: String(dup?.examTime || '').trim(),
      examShift: String(dup?.examShift || '').trim(),
      studentCount: Number(dup?.studentCount || 0),
      isFallback: Boolean(dup?.isFallback),
      classFieldChanges: parseClassFieldChanges(dup?.diff || dup?.changes || dup?.differences || payload?.diff),
      studentChanges: parseStudentChanges(dup?.diff || dup?.changes || dup?.differences || payload?.diff),
      fallbackDiffLines: getDiffLines(dup?.diff || dup?.changes || dup?.differences || payload?.diff),
    };
  });

  return {
    message: payloadMessage || 'Lớp đã tồn tại theo bộ nhận diện (mã lớp, học kỳ, mã học phần).',
    duplicates,
  };
};
