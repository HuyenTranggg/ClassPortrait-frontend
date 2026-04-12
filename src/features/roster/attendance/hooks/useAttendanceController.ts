import { useEffect, useMemo, useRef, useState } from 'react';
import { Class } from '../../../../types/Class';
import { Student } from '../../../../types/Student';
import { useAutoDismissMessage } from '../../shared/hooks/useAutoDismissMessage';
import { ActiveView } from '../../core/shell/types';
import {
  AppMessage,
  AttendanceFilter,
  AttendanceRecord,
  buildAttendanceDetailRows,
  getAttendanceStats,
  SavedAttendanceState,
} from './attendance.controller';
import { useAttendanceActions } from './useAttendanceActions';

export type { AttendanceFilter } from './attendance.controller';

interface UseAttendanceControllerOptions {
  selectedClass: Class | null;
  students: Student[];
  activeView: ActiveView;
}

/**
 * Controller gom toàn bộ state và nghiệp vụ điểm danh để AppShell nhẹ hơn.
 */
export const useAttendanceController = ({
  selectedClass,
  students,
  activeView,
}: UseAttendanceControllerOptions) => {
  const selectedClassIdRef = useRef<string | null>(null);
  const [isAttendanceMode, setAttendanceMode] = useState(false);
  const [isAttendanceBusy, setAttendanceBusy] = useState(false);
  const [attendanceMessage, setAttendanceMessage] = useState<AppMessage>(null);
  const [attendanceFilter, setAttendanceFilter] = useState<AttendanceFilter>('all');
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [isStatsModalOpen, setStatsModalOpen] = useState(false);
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [isRetakeConfirmOpen, setRetakeConfirmOpen] = useState(false);
  const [attendanceInitialMap, setAttendanceInitialMap] = useState<Record<string, AttendanceRecord>>({});
  const [attendanceDraftMap, setAttendanceDraftMap] = useState<Record<string, AttendanceRecord>>({});
  const [savedAttendance, setSavedAttendance] = useState<SavedAttendanceState | null>(null);

  const {
    clearAttendanceState,
    hydrateSavedAttendanceFromServer,
    handleStartAttendance,
    handleToggleAttendance,
    handleConfirmSaveAttendance,
    handleCancelAttendanceMode,
    handleConfirmRetakeAttendance,
  } = useAttendanceActions({
    selectedClassId: selectedClass?.id,
    studentsCount: students.length,
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
  });

  const attendanceStats = useMemo(() => getAttendanceStats(attendanceDraftMap), [attendanceDraftMap]);

  const detailRows = useMemo(() => buildAttendanceDetailRows(students, savedAttendance), [savedAttendance, students]);

  const activeAttendanceMap = isAttendanceMode ? attendanceDraftMap : savedAttendance?.records || {};

  useEffect(() => {
    const nextClassId = selectedClass?.id || null;

    if (selectedClassIdRef.current && selectedClassIdRef.current !== nextClassId) {
      clearAttendanceState();
    }

    selectedClassIdRef.current = nextClassId;
  }, [clearAttendanceState, selectedClass?.id]);

  useEffect(() => {
    if (!selectedClass?.id || isAttendanceMode || activeView !== 'roster') {
      return;
    }

    hydrateSavedAttendanceFromServer(selectedClass.id);
  }, [activeView, hydrateSavedAttendanceFromServer, isAttendanceMode, selectedClass?.id]);

  useAutoDismissMessage(attendanceMessage, () => setAttendanceMessage(null));

  return {
    isAttendanceMode,
    isAttendanceBusy,
    attendanceMessage,
    attendanceFilter,
    attendanceSearch,
    isStatsModalOpen,
    isDetailModalOpen,
    isRetakeConfirmOpen,
    savedAttendance,
    attendanceStats,
    detailRows,
    activeAttendanceMap,
    setAttendanceMessage,
    setAttendanceFilter,
    setAttendanceSearch,
    setStatsModalOpen,
    setDetailModalOpen,
    setRetakeConfirmOpen,
    handleStartAttendance,
    handleToggleAttendance,
    handleConfirmSaveAttendance,
    handleCancelAttendanceMode,
    handleConfirmRetakeAttendance,
  };
};

export default useAttendanceController;
