import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Class } from '../../../../types/Class';
import { attendanceService, AttendanceStatus } from '../../services';
import {
  AppMessage,
  AttendanceFilter,
  AttendanceRecord,
  getAttendanceStats,
  getLatestMarkedAt,
  mapAttendanceError,
  SavedAttendanceState,
  toAttendanceMap,
} from './attendance.controller';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isValidUuid = (value?: string): boolean => {
  return Boolean(value && UUID_REGEX.test(value));
};

const pickUuidFromClass = (selectedClass?: Class | null): string => {
  if (!selectedClass) {
    return '';
  }

  const rawClass = selectedClass as any;
  const candidates = [
    rawClass?.id,
    rawClass?.classId,
    rawClass?.classID,
    rawClass?.class_id,
    rawClass?.uuid,
    rawClass?.classUuid,
    rawClass?._id,
  ]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean);

  return candidates.find((value) => UUID_REGEX.test(value)) || '';
};

interface UseAttendanceActionsOptions {
  selectedClassId?: string;
  selectedClass?: Class | null;
  studentsCount: number;
  isAttendanceMode: boolean;
  attendanceInitialMap: Record<string, AttendanceRecord>;
  attendanceDraftMap: Record<string, AttendanceRecord>;
  setAttendanceMode: Dispatch<SetStateAction<boolean>>;
  setAttendanceBusy: Dispatch<SetStateAction<boolean>>;
  setAttendanceMessage: Dispatch<SetStateAction<AppMessage>>;
  setAttendanceFilter: Dispatch<SetStateAction<AttendanceFilter>>;
  setAttendanceSearch: Dispatch<SetStateAction<string>>;
  setStatsModalOpen: Dispatch<SetStateAction<boolean>>;
  setDetailModalOpen: Dispatch<SetStateAction<boolean>>;
  setRetakeConfirmOpen: Dispatch<SetStateAction<boolean>>;
  setAttendanceInitialMap: Dispatch<SetStateAction<Record<string, AttendanceRecord>>>;
  setAttendanceDraftMap: Dispatch<SetStateAction<Record<string, AttendanceRecord>>>;
  setSavedAttendance: Dispatch<SetStateAction<SavedAttendanceState | null>>;
}

/**
 * Gom nhóm các action điểm danh (API + cập nhật state) để giảm tải cho useAttendanceController.
 */
export const useAttendanceActions = ({
  selectedClassId,
  selectedClass,
  studentsCount,
  isAttendanceMode,
  attendanceInitialMap,
  attendanceDraftMap,
  setAttendanceMode,
  setAttendanceBusy,
  setAttendanceMessage,
  setAttendanceFilter,
  setAttendanceSearch,
  setStatsModalOpen,
  setDetailModalOpen,
  setRetakeConfirmOpen,
  setAttendanceInitialMap,
  setAttendanceDraftMap,
  setSavedAttendance,
}: UseAttendanceActionsOptions) => {
  const resolveAttendanceClassId = useCallback((classIdOverride?: string): string => {
    if (isValidUuid(classIdOverride)) {
      return classIdOverride as string;
    }

    if (isValidUuid(selectedClassId)) {
      return selectedClassId as string;
    }

    return pickUuidFromClass(selectedClass);
  }, [selectedClass, selectedClassId]);

  const clearAttendanceState = useCallback(() => {
    setAttendanceMode(false);
    setAttendanceBusy(false);
    setAttendanceFilter('all');
    setStatsModalOpen(false);
    setDetailModalOpen(false);
    setRetakeConfirmOpen(false);
    setAttendanceInitialMap({});
    setAttendanceDraftMap({});
    setAttendanceSearch('');
    setSavedAttendance(null);
    setAttendanceMessage(null);
  }, [
    setAttendanceBusy,
    setAttendanceDraftMap,
    setAttendanceFilter,
    setAttendanceInitialMap,
    setAttendanceMessage,
    setAttendanceMode,
    setAttendanceSearch,
    setDetailModalOpen,
    setRetakeConfirmOpen,
    setSavedAttendance,
    setStatsModalOpen,
  ]);

  const hydrateSavedAttendanceFromServer = useCallback(
    async (classId: string) => {
      try {
        const response = await attendanceService.getClassAttendance(classId, true);
        const records = toAttendanceMap(
          response.students.map((item) => ({
            studentId: item.studentId,
            mssv: item.mssv,
            name: item.name,
            status: item.status,
            markedAt: item.markedAt,
          }))
        );

        const latestMarkedAt = getLatestMarkedAt(records);

        if (!latestMarkedAt) {
          setSavedAttendance(null);
          setAttendanceFilter('all');
          setAttendanceSearch('');
          return;
        }

        setSavedAttendance({
          takenAt: latestMarkedAt,
          stats: response.stats || getAttendanceStats(records),
          records,
        });
        setAttendanceInitialMap(records);
        setAttendanceDraftMap(records);
        setAttendanceFilter('all');
        setAttendanceSearch('');
      } catch {
        setSavedAttendance(null);
      }
    },
    [setAttendanceDraftMap, setAttendanceFilter, setAttendanceInitialMap, setAttendanceSearch, setSavedAttendance]
  );

  const handleStartAttendance = useCallback(async (classIdOverride?: string) => {
    const targetClassId = resolveAttendanceClassId(classIdOverride);

    if (!targetClassId || studentsCount === 0) {
      return;
    }

    if (!isValidUuid(targetClassId)) {
      setAttendanceMessage({
        type: 'error',
        text: 'ID lớp không hợp lệ cho tính năng điểm danh (cần UUID). Vui lòng tải lại danh sách lớp hoặc kiểm tra dữ liệu backend.',
      });
      return;
    }

    setAttendanceBusy(true);
    setAttendanceMessage(null);

    try {
      const response = await attendanceService.getClassAttendance(targetClassId, true);
      const records = toAttendanceMap(
        response.students.map((item) => ({
          studentId: item.studentId,
          mssv: item.mssv,
          name: item.name,
          status: item.status,
          markedAt: item.markedAt,
        }))
      );

      setAttendanceInitialMap(records);
      setAttendanceDraftMap(records);
      setAttendanceMode(true);
      setAttendanceFilter('all');
      setAttendanceSearch('');
      setSavedAttendance(null);
    } catch (attendanceError: any) {
      setAttendanceMessage({ type: 'error', text: mapAttendanceError(attendanceError) });
    } finally {
      setAttendanceBusy(false);
    }
  }, [
    resolveAttendanceClassId,
    setAttendanceBusy,
    setAttendanceDraftMap,
    setAttendanceFilter,
    setAttendanceInitialMap,
    setAttendanceMessage,
    setAttendanceMode,
    setAttendanceSearch,
    setSavedAttendance,
    studentsCount,
  ]);

  const handleToggleAttendance = useCallback(
    (mssv: string) => {
      if (!isAttendanceMode) {
        return;
      }

      setAttendanceDraftMap((previous) => {
        const target = previous[mssv];
        if (!target) {
          return previous;
        }

        const nextStatus: AttendanceStatus = target.status === 'present' ? 'absent' : 'present';
        return {
          ...previous,
          [mssv]: {
            ...target,
            status: nextStatus,
            markedAt: new Date().toISOString(),
          },
        };
      });
    },
    [isAttendanceMode, setAttendanceDraftMap]
  );

  const handleConfirmSaveAttendance = useCallback(async () => {
    const targetClassId = resolveAttendanceClassId();

    if (!targetClassId) {
      return;
    }

    if (!isValidUuid(targetClassId)) {
      setAttendanceMessage({
        type: 'error',
        text: 'ID lớp không hợp lệ cho tính năng điểm danh (cần UUID). Vui lòng tải lại danh sách lớp hoặc kiểm tra dữ liệu backend.',
      });
      return;
    }

    setAttendanceBusy(true);
    setAttendanceMessage(null);

    try {
      const changedRecords = Object.values(attendanceDraftMap).filter(
        (item) => attendanceInitialMap[item.mssv]?.status !== item.status
      );

      await Promise.all(
        changedRecords.map((item) => {
          return attendanceService.setStudentAttendanceStatus(targetClassId, item.studentId, {
            status: item.status,
          });
        })
      );

      const takenAt = new Date().toISOString();
      setSavedAttendance({
        takenAt,
        stats: getAttendanceStats(attendanceDraftMap),
        records: attendanceDraftMap,
      });
      setAttendanceMode(false);
      setAttendanceInitialMap(attendanceDraftMap);
      setAttendanceFilter('all');
      setAttendanceSearch('');
      setStatsModalOpen(false);
      setAttendanceMessage({ type: 'success', text: 'Đã lưu kết quả điểm danh thành công.' });
    } catch (attendanceError: any) {
      setAttendanceMessage({ type: 'error', text: mapAttendanceError(attendanceError) });
    } finally {
      setAttendanceBusy(false);
    }
  }, [
    attendanceDraftMap,
    attendanceInitialMap,
    resolveAttendanceClassId,
    setAttendanceBusy,
    setAttendanceFilter,
    setAttendanceInitialMap,
    setAttendanceMessage,
    setAttendanceMode,
    setAttendanceSearch,
    setSavedAttendance,
    setStatsModalOpen,
  ]);

  const handleCancelAttendanceMode = useCallback(() => {
    setAttendanceMode(false);
    setAttendanceDraftMap(attendanceInitialMap);
    setStatsModalOpen(false);
    setAttendanceMessage(null);
  }, [attendanceInitialMap, setAttendanceDraftMap, setAttendanceMessage, setAttendanceMode, setStatsModalOpen]);

  const handleConfirmRetakeAttendance = useCallback(async () => {
    const targetClassId = resolveAttendanceClassId();

    if (!targetClassId) {
      return;
    }

    if (!isValidUuid(targetClassId)) {
      setAttendanceMessage({
        type: 'error',
        text: 'ID lớp không hợp lệ cho tính năng điểm danh (cần UUID). Vui lòng tải lại danh sách lớp hoặc kiểm tra dữ liệu backend.',
      });
      return;
    }

    setAttendanceBusy(true);
    setAttendanceMessage(null);

    try {
      await attendanceService.resetClassAttendance(targetClassId, { status: 'absent' });
      setRetakeConfirmOpen(false);
      await handleStartAttendance();
      setAttendanceMessage({ type: 'success', text: 'Đã reset kết quả cũ. Bạn có thể bắt đầu điểm danh lại.' });
    } catch (attendanceError: any) {
      setAttendanceMessage({ type: 'error', text: mapAttendanceError(attendanceError) });
    } finally {
      setAttendanceBusy(false);
    }
  }, [handleStartAttendance, resolveAttendanceClassId, setAttendanceBusy, setAttendanceMessage, setRetakeConfirmOpen]);

  return {
    clearAttendanceState,
    hydrateSavedAttendanceFromServer,
    handleStartAttendance,
    handleToggleAttendance,
    handleConfirmSaveAttendance,
    handleCancelAttendanceMode,
    handleConfirmRetakeAttendance,
  };
};

export default useAttendanceActions;
