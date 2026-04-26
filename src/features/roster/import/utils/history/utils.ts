import { ImportHistoryItem } from '../../../services/class.service';

export function getClassLabel(item: ImportHistoryItem): string {
  const classCode = String(item.classCode || '').trim();
  return classCode || 'Lớp không xác định';
}

export function getClassSubLabel(item: ImportHistoryItem): string {
  const courseParts = [item.courseCode, item.courseName].filter((value) => String(value || '').trim());
  const courseLabel = courseParts.join(' - ');
  const semesterLabel = item.semester ? `HK ${item.semester}` : '';

  if (courseLabel && semesterLabel) {
    return `${courseLabel} • ${semesterLabel}`;
  }

  return courseLabel || semesterLabel || 'Chưa có thông tin học phần';
}

export function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('vi-VN');
}
