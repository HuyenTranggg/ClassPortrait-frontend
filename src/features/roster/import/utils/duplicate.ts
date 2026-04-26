import { DuplicateConflictState } from '../types';
import { normalizeText } from './parsers';

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
  added: 'Sinh viên thêm mới',
  removed: 'Sinh viên bị xóa',
  renamed: 'Sinh viên đổi tên',
  updated: 'Sinh viên cập nhật',
  unchanged: 'Sinh viên giữ nguyên',
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

    return { field, oldValue, newValue };
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

  if (!existingClassId) {
    return null;
  }

  const classCode = String(existingClass?.classCode || '').trim();
  const semester = String(existingClass?.semester || '').trim();
  const courseCode = String(existingClass?.courseCode || '').trim();
  const courseName = String(existingClass?.courseName || '').trim();

  const existingClassLabel =
    [classCode, semester && `HK ${semester}`, courseCode, courseName].filter(Boolean).join(' - ') || existingClassId;

  const rawDiff = payload?.diff || payload?.changes || payload?.differences || {};

  return {
    existingClassId,
    existingClassLabel,
    message: payloadMessage || 'Lớp đã tồn tại theo bộ nhận diện (mã lớp, học kỳ, mã học phần).',
    classFieldChanges: parseClassFieldChanges(rawDiff),
    studentChanges: parseStudentChanges(rawDiff),
    fallbackDiffLines: getDiffLines(rawDiff),
  };
};
