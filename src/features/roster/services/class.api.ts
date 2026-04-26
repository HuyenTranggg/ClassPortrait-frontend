import api from '../../../lib/api';
import { Class } from '../../../types/Class';
import { Student } from '../../../types/Student';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ID_CANDIDATE_KEYS = [
  'id',
  'classId',
  'classID',
  'class_id',
  'uuid',
  'classUuid',
  '_id',
] as const;

const normalizeString = (value: unknown): string => {
  return typeof value === 'string' ? value.trim() : '';
};

const collectIdCandidates = (raw: any): string[] => {
  const direct = ID_CANDIDATE_KEYS
    .map((key) => normalizeString(raw?.[key]))
    .filter(Boolean);

  const nested = ID_CANDIDATE_KEYS
    .map((key) => normalizeString(raw?.class?.[key]))
    .filter(Boolean);

  return [...direct, ...nested];
};

const findUuidDeep = (value: unknown, depth = 0): string => {
  if (depth > 3 || value == null) {
    return '';
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return UUID_REGEX.test(trimmed) ? trimmed : '';
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const hit = findUuidDeep(item, depth + 1);
      if (hit) {
        return hit;
      }
    }
    return '';
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);

    for (const [key, entryValue] of entries) {
      if (/id|uuid/i.test(key)) {
        const hit = findUuidDeep(entryValue, depth + 1);
        if (hit) {
          return hit;
        }
      }
    }

    for (const [, entryValue] of entries) {
      const hit = findUuidDeep(entryValue, depth + 1);
      if (hit) {
        return hit;
      }
    }
  }

  return '';
};

const pickClassId = (raw: any): string => {
  const candidates = collectIdCandidates(raw);

  const uuidCandidate = candidates.find((value) => UUID_REGEX.test(value));
  if (uuidCandidate) {
    return uuidCandidate;
  }

  const deepUuidCandidate = findUuidDeep(raw);
  if (deepUuidCandidate) {
    return deepUuidCandidate;
  }

  return candidates[0] || '';
};

const normalizeClass = (raw: any): Class => {
  return {
    ...raw,
    id: pickClassId(raw),
  } as Class;
};

/**
 * Nhóm API thao tác với dữ liệu lớp học cốt lõi.
 */
export const classApi = {
  /**
   * Lấy danh sách tất cả lớp thuộc người dùng hiện tại.
   * @returns Mảng lớp học.
   */
  getAll: async (): Promise<Class[]> => {
    const response = await api.get<Class[]>('/classes');
    return (response.data || []).map((item) => normalizeClass(item));
  },

  /**
   * Lấy chi tiết một lớp theo id.
   * @param id UUID lớp học cần truy vấn.
   * @returns Đối tượng lớp học chi tiết.
   */
  getById: async (id: string): Promise<Class> => {
    const response = await api.get<Class>(`/classes/${id}`);
    return normalizeClass(response.data);
  },

  /**
   * Lấy danh sách sinh viên của một lớp.
   * @param id UUID lớp học cần lấy sinh viên.
   * @returns Mảng sinh viên thuộc lớp.
   */
  getStudents: async (id: string): Promise<Student[]> => {
    const response = await api.get<Student[]>(`/classes/${id}/students`);
    return response.data;
  },

  /**
   * Xóa một lớp học.
   * @param id UUID lớp học cần xóa.
   * @returns Thông báo kết quả từ backend.
   */
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/classes/${id}`);
    return response.data;
  },
};

export default classApi;
