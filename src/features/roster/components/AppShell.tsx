import React, { useEffect, useMemo, useRef, useState } from 'react';
import ImportHistoryView from './ImportHistoryView';
import ShareLinksView from './ShareLinksView';
import { useClasses, usePagination } from '../hooks';
import { useAuth } from '../../auth';
import AppSidebar from './app-shell/AppSidebar';
import ShellHeader from './app-shell/ShellHeader';
import WorkspaceToolbar from './app-shell/WorkspaceToolbar';
import RosterBody from './app-shell/RosterBody';
import { buildPrintMeta, buildRosterMeta, getDisplayNameFromEmail, getInitialLayout, isAllowedLayout } from './app-shell/utils';
import ShareLinkModal from './share/ShareLinkModal';
import { AttendanceStatsModal, AttendanceDetailModal, AttendanceDetailRow, RetakeConfirmModal } from './attendance/AttendanceModals';
import { attendanceService, AttendanceStatus } from '../services';

interface AttendanceRecord {
  studentId: string;
  mssv: string;
  name?: string;
  status: AttendanceStatus;
  markedAt: string | null;
}

interface SavedAttendanceState {
  takenAt: string;
  stats: {
    total: number;
    present: number;
    absent: number;
  };
  records: Record<string, AttendanceRecord>;
}

type AttendanceFilter = 'all' | 'present' | 'absent';

/**
 * Chuyển danh sách attendance backend về map theo MSSV để tra cứu nhanh khi render.
 * @param students Danh sách trạng thái attendance trả từ backend.
 * @returns Map key MSSV -> bản ghi điểm danh.
 */
const toAttendanceMap = (students: AttendanceRecord[]): Record<string, AttendanceRecord> => {
  return students.reduce<Record<string, AttendanceRecord>>((accumulator, student) => {
    accumulator[student.mssv] = student;
    return accumulator;
  }, {});
};

/**
 * Tính thống kê điểm danh từ bản ghi hiện tại.
 * @param records Map attendance theo MSSV.
 * @returns Bộ số liệu tổng/có mặt/vắng.
 */
const getAttendanceStats = (records: Record<string, AttendanceRecord>) => {
  const values = Object.values(records);
  const present = values.filter((item) => item.status === 'present').length;
  const total = values.length;

  return {
    total,
    present,
    absent: total - present,
  };
};

/**
 * Lấy mốc thời gian điểm danh mới nhất từ danh sách bản ghi attendance.
 * @param records Map attendance theo MSSV.
 * @returns Chuỗi ISO thời gian mới nhất, hoặc null nếu chưa có dữ liệu đã đánh dấu.
 */
const getLatestMarkedAt = (records: Record<string, AttendanceRecord>): string | null => {
  const timestamps = Object.values(records)
    .map((item) => item.markedAt)
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter((value) => !Number.isNaN(value));

  if (timestamps.length === 0) {
    return null;
  }

  return new Date(Math.max(...timestamps)).toISOString();
};

/**
 * Chuẩn hóa lỗi API điểm danh thành thông báo thân thiện cho người dùng.
 * @param error Lỗi phát sinh từ axios hoặc runtime.
 * @returns Chuỗi thông báo đã được ánh xạ.
 */
const mapAttendanceError = (error: any): string => {
  const status = error?.response?.status;

  if (status === 400) {
    return 'Dữ liệu điểm danh gửi lên không hợp lệ. Vui lòng kiểm tra lại.';
  }

  if (status === 401) {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  }

  if (status === 403) {
    return 'Không thể thực hiện thao tác điểm danh này.';
  }

  if (status === 404) {
    return 'Không tìm thấy lớp hoặc sinh viên thuộc lớp hiện tại.';
  }

  return String(error?.response?.data?.message || error?.message || 'Không thể xử lý điểm danh. Vui lòng thử lại.');
};

/**
 * Định dạng thời gian điểm danh để hiển thị ở summary panel.
 * @param value Chuỗi thời gian ISO của lần điểm danh.
 * @returns Chuỗi thời gian theo locale vi-VN.
 */
const formatAttendanceTime = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('vi-VN');
};

function AppShell() {
  const headerRef = useRef<HTMLDivElement | null>(null);
  const selectedClassIdRef = useRef<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState<'roster' | 'history' | 'share'>('roster');
  const [layout, setLayout] = useState<number>(getInitialLayout);
  const [isShareModalOpen, setShareModalOpen] = useState(false);
  const [isAttendanceMode, setAttendanceMode] = useState(false);
  const [isAttendanceBusy, setAttendanceBusy] = useState(false);
  const [attendanceMessage, setAttendanceMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [attendanceFilter, setAttendanceFilter] = useState<AttendanceFilter>('all');
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [isStatsModalOpen, setStatsModalOpen] = useState(false);
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [isRetakeConfirmOpen, setRetakeConfirmOpen] = useState(false);
  const [attendanceInitialMap, setAttendanceInitialMap] = useState<Record<string, AttendanceRecord>>({});
  const [attendanceDraftMap, setAttendanceDraftMap] = useState<Record<string, AttendanceRecord>>({});
  const [savedAttendance, setSavedAttendance] = useState<SavedAttendanceState | null>(null);
  const { logout, userEmail } = useAuth();
  const { classes, selectedClass, students, loading, error, selectClass, refetchClasses } = useClasses();
  const handleImportSuccess = async (importedClassId?: string) => {
    await refetchClasses(importedClassId);
  };

  const attendanceStats = useMemo(() => getAttendanceStats(attendanceDraftMap), [attendanceDraftMap]);

  const filteredStudents = useMemo(() => {
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

  const { photosPerRow } = usePagination(filteredStudents, layout);

  /**
   * Xóa trạng thái điểm danh tạm khi đổi lớp hoặc thoát chế độ điểm danh.
   * @returns Không trả về giá trị.
   */
  const clearAttendanceState = () => {
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
  };

  /**
   * Đồng bộ trạng thái điểm danh đã lưu từ backend khi mở lớp.
   * @param classId UUID lớp cần đồng bộ dữ liệu attendance.
   * @returns Không trả về giá trị.
   */
  const hydrateSavedAttendanceFromServer = async (classId: string) => {
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
  };

  /**
   * Đồng bộ URL query params khi thay đổi layout hoặc lớp.
   * @param updates Giá trị layout/classId cần cập nhật.
   * @returns Không trả về giá trị.
   */
  const updateUrlParams = (updates: { layout?: number; classId?: string }) => {
    const params = new URLSearchParams(window.location.search);

    if (typeof updates.layout === 'number') {
      params.set('layout', String(updates.layout));
    }

    if (updates.classId) {
      params.set('classId', updates.classId);
    }

    const query = params.toString();
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState(null, '', nextUrl);
  };

  useEffect(() => {
    document.body.setAttribute('data-layout', photosPerRow.toString());

    return () => {
      document.body.removeAttribute('data-layout');
    };
  }, [photosPerRow]);

  useEffect(() => {
    const updateHeaderHeight = () => {
      const headerHeight = headerRef.current?.offsetHeight || 0;
      document.documentElement.style.setProperty('--shell-header-height', `${headerHeight}px`);
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);

    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

  useEffect(() => {
    if (!attendanceMessage) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setAttendanceMessage(null);
    }, 3500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [attendanceMessage]);

  const handlePrint = () => {
    window.print();
  };

  /**
   * Xử lý đổi lớp, có confirm nếu đang điểm danh dở để tránh mất dữ liệu tạm.
   * @param event Sự kiện thay đổi class dropdown.
   * @returns Không trả về giá trị.
   */
  const handleClassChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const classId = event.target.value;

    if (!classId) {
      return;
    }

    if (isAttendanceMode) {
      const confirmed = window.confirm('Bạn đang điểm danh dở. Đổi lớp sẽ mất dữ liệu tạm. Tiếp tục?');
      if (!confirmed) {
        return;
      }
    }

    await selectClass(classId);
    updateUrlParams({ classId });
  };

  /**
   * Mở lớp từ lịch sử import và chuyển về màn roster.
   * @param classId UUID lớp cần mở.
   * @returns Không trả về giá trị.
   */
  const handleOpenClassFromHistory = async (classId: string) => {
    if (!classId) {
      return;
    }

    if (isAttendanceMode) {
      const confirmed = window.confirm('Bạn đang điểm danh dở. Đổi lớp sẽ mất dữ liệu tạm. Tiếp tục?');
      if (!confirmed) {
        return;
      }
    }

    await selectClass(classId);
    updateUrlParams({ classId });
    setActiveView('roster');
  };

  const handleLayoutChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextValue = Number(event.target.value);
    const nextLayout = isAllowedLayout(nextValue) ? nextValue : 5;

    setLayout(nextLayout);
    updateUrlParams({ layout: nextLayout, classId: selectedClass?.id });
  };

  /**
   * Bắt đầu chế độ điểm danh bằng cách tải dữ liệu attendance hiện tại từ backend.
   * @returns Không trả về giá trị.
   */
  const handleStartAttendance = async () => {
    if (!selectedClass?.id || students.length === 0) {
      return;
    }

    setAttendanceBusy(true);
    setAttendanceMessage(null);

    try {
      const response = await attendanceService.getClassAttendance(selectedClass.id, true);
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
  };

  /**
   * Toggle trạng thái điểm danh cục bộ khi giáo viên click ảnh sinh viên.
   * @param mssv MSSV sinh viên được click.
   * @returns Không trả về giá trị.
   */
  const handleToggleAttendance = (mssv: string) => {
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
  };

  /**
   * Lưu kết quả điểm danh từ draft lên backend bằng API set trạng thái tường minh.
   * @returns Không trả về giá trị.
   */
  const handleConfirmSaveAttendance = async () => {
    if (!selectedClass?.id) {
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
          return attendanceService.setStudentAttendanceStatus(selectedClass.id, item.studentId, {
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
  };

  /**
   * Hủy chế độ điểm danh hiện tại và quay về màn sổ ảnh bình thường.
   * @returns Không trả về giá trị.
   */
  const handleCancelAttendanceMode = () => {
    setAttendanceMode(false);
    setAttendanceDraftMap(attendanceInitialMap);
    setStatsModalOpen(false);
    setAttendanceMessage(null);
  };

  /**
   * Xác nhận điểm danh lại: reset backend về vắng rồi mở lại chế độ điểm danh.
   * @returns Không trả về giá trị.
   */
  const handleConfirmRetakeAttendance = async () => {
    if (!selectedClass?.id) {
      return;
    }

    setAttendanceBusy(true);
    setAttendanceMessage(null);

    try {
      await attendanceService.resetClassAttendance(selectedClass.id, { status: 'absent' });
      setRetakeConfirmOpen(false);
      await handleStartAttendance();
      setAttendanceMessage({ type: 'success', text: 'Đã reset kết quả cũ. Bạn có thể bắt đầu điểm danh lại.' });
    } catch (attendanceError: any) {
      setAttendanceMessage({ type: 'error', text: mapAttendanceError(attendanceError) });
    } finally {
      setAttendanceBusy(false);
    }
  };

  /**
   * Trả về dữ liệu chi tiết điểm danh để hiển thị trong modal danh sách.
   * @returns Danh sách chi tiết theo từng sinh viên.
   */
  const detailRows: AttendanceDetailRow[] = useMemo(() => {
    if (!savedAttendance) {
      return [];
    }

    return students
      .map((student) => {
        const record = savedAttendance.records[student.mssv];
        return {
          mssv: student.mssv,
          name: student.name,
          status: record?.status || 'absent',
          markedAt: record?.markedAt || null,
        };
      })
      .sort((left, right) => left.mssv.localeCompare(right.mssv));
  }, [savedAttendance, students]);

  useEffect(() => {
    const nextClassId = selectedClass?.id || null;

    if (selectedClassIdRef.current && selectedClassIdRef.current !== nextClassId) {
      clearAttendanceState();
    }

    selectedClassIdRef.current = nextClassId;
  }, [selectedClass?.id]);

  useEffect(() => {
    if (!selectedClass?.id || isAttendanceMode || activeView !== 'roster') {
      return;
    }

    hydrateSavedAttendanceFromServer(selectedClass.id);
  }, [activeView, isAttendanceMode, selectedClass?.id]);

  const lecturerDisplayName = getDisplayNameFromEmail(userEmail);
  const rosterMeta = buildRosterMeta(selectedClass, students);
  const printMeta = buildPrintMeta(selectedClass, filteredStudents);
  const activeAttendanceMap = isAttendanceMode ? attendanceDraftMap : savedAttendance?.records || {};

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <AppSidebar
        activeView={activeView}
        sidebarCollapsed={sidebarCollapsed}
        lecturerDisplayName={lecturerDisplayName}
        onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
        onSetActiveView={setActiveView}
        onLogout={logout}
      />

      <main className="app-main">
        <div className="sticky-controls no-print" ref={headerRef}>
          <ShellHeader
            activeView={activeView}
            selectedClassExists={Boolean(selectedClass)}
            hasStudents={students.length > 0}
            hasSavedAttendance={Boolean(savedAttendance)}
            rosterMeta={rosterMeta}
            isAttendanceMode={isAttendanceMode}
            isAttendanceBusy={isAttendanceBusy}
            onOpenShare={() => setShareModalOpen(true)}
            onStartAttendance={handleStartAttendance}
            onSaveAttendance={() => setStatsModalOpen(true)}
            onCancelAttendance={handleCancelAttendanceMode}
            onImportSuccess={handleImportSuccess}
          />

          {activeView === 'roster' && (
            <div className="roster-controls-combined">
              <WorkspaceToolbar
                selectedClass={selectedClass}
                classes={classes}
                studentsCount={filteredStudents.length}
                photosPerRow={photosPerRow}
                loading={loading}
                searchQuery={attendanceSearch}
                onClassChange={handleClassChange}
                onLayoutChange={handleLayoutChange}
                onSearchChange={(event) => setAttendanceSearch(event.target.value)}
                onPrint={handlePrint}
              />

              {!isAttendanceMode && savedAttendance && (
                <div className="attendance-summary-panel">
                  <div className="attendance-summary-row">
                    <div className="attendance-summary-meta">
                      Đã điểm danh lúc: <strong>{formatAttendanceTime(savedAttendance.takenAt)}</strong>
                    </div>

                    <div className="attendance-summary-stats">
                      <span>
                        Có mặt: <strong className="text-success">{savedAttendance.stats.present}</strong>
                      </span>
                      <span>
                        Vắng: <strong className="text-danger">{savedAttendance.stats.absent}</strong>
                      </span>
                      <span>
                        Tỉ lệ: <strong>{savedAttendance.stats.total > 0 ? Math.round((savedAttendance.stats.present / savedAttendance.stats.total) * 100) : 0}%</strong>
                      </span>
                    </div>

                    <div className="attendance-summary-filter">
                      <select
                        className="form-select"
                        value={attendanceFilter}
                        onChange={(event) => setAttendanceFilter(event.target.value as AttendanceFilter)}
                        aria-label="Lọc danh sách điểm danh"
                      >
                        <option value="all">Tất cả</option>
                        <option value="present">Có mặt</option>
                        <option value="absent">Vắng</option>
                      </select>
                    </div>

                    <div className="attendance-summary-actions">
                      <button type="button" className="btn btn-outline-secondary" onClick={() => setRetakeConfirmOpen(true)}>
                        Điểm danh lại
                      </button>
                      <button type="button" className="btn btn-outline-secondary" onClick={() => setDetailModalOpen(true)}>
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {activeView === 'roster' && (
          <RosterBody
            loading={loading}
            error={error}
            students={filteredStudents}
            printMeta={printMeta}
            isAttendanceMode={isAttendanceMode}
            attendanceByMssv={activeAttendanceMap}
            onToggleAttendance={handleToggleAttendance}
          />
        )}

        {activeView === 'history' && <ImportHistoryView onOpenClass={handleOpenClassFromHistory} />}
        {activeView === 'share' && <ShareLinksView classes={classes} />}
      </main>

      <ShareLinkModal
        isOpen={isShareModalOpen}
        selectedClass={selectedClass}
        onClose={() => setShareModalOpen(false)}
      />

      <AttendanceStatsModal
        isOpen={isStatsModalOpen}
        present={attendanceStats.present}
        absent={attendanceStats.absent}
        total={attendanceStats.total}
        onCancel={() => setStatsModalOpen(false)}
        onConfirm={handleConfirmSaveAttendance}
        isSubmitting={isAttendanceBusy}
      />

      <AttendanceDetailModal
        isOpen={isDetailModalOpen}
        rows={detailRows}
        classLabel={rosterMeta.classCodeLabel}
        onClose={() => setDetailModalOpen(false)}
      />

      <RetakeConfirmModal
        isOpen={isRetakeConfirmOpen}
        onCancel={() => setRetakeConfirmOpen(false)}
        onConfirm={handleConfirmRetakeAttendance}
        isSubmitting={isAttendanceBusy}
      />

      {attendanceMessage && (
        <div className="attendance-toast-wrap no-print" aria-live="polite" aria-atomic="true">
          <div className={`attendance-toast ${attendanceMessage.type === 'success' ? 'is-success' : 'is-error'}`} role="alert">
            <span className="attendance-toast-text">{attendanceMessage.text}</span>
            <button
              type="button"
              className="attendance-toast-close"
              aria-label="Đóng thông báo"
              onClick={() => setAttendanceMessage(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppShell;
