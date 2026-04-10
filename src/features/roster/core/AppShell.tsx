import React, { useEffect, useState } from 'react';
import ImportHistoryView from '../import/views/ImportHistoryView';
import ShareLinksView from '../share/views/ShareLinksView';
import { useClasses } from './hooks/useClasses';
import { usePagination } from './hooks/usePagination';
import { useAuth } from '../../auth';
import AppSidebar from './shell/AppSidebar';
import ShellHeader from './shell/ShellHeader';
import WorkspaceToolbar from './shell/WorkspaceToolbar';
import RosterBody from './shell/RosterBody';
import { buildPrintMeta, buildRosterMeta, getDisplayNameFromEmail } from './shell/utils';
import ShareLinkModal from '../share/components/ShareLinkModal';
import { AttendanceStatsModal, AttendanceDetailModal, RetakeConfirmModal } from '../attendance/components/AttendanceModals';
import AppToast from '../shared/components/AppToast';
import { AttendanceFilter, useAttendanceController } from '../attendance/hooks/useAttendanceController';
import { useRosterFilteredStudents } from '../attendance/hooks/useRosterFilteredStudents';
import { useRosterController } from './hooks/useRosterController';

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
  const [isShareModalOpen, setShareModalOpen] = useState(false);
  const { logout, userEmail } = useAuth();
  const { classes, selectedClass, students, loading, error, selectClass, refetchClasses } = useClasses();

  const {
    headerRef,
    sidebarCollapsed,
    activeView,
    layout,
    setSidebarCollapsed,
    setActiveView,
    handlePrint,
    handleClassChange,
    handleOpenClassFromHistory,
    handleLayoutChange,
  } = useRosterController({
    selectedClassId: selectedClass?.id,
    selectClass,
  });

  const {
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
  } = useAttendanceController({
    selectedClass,
    students,
    activeView,
  });

  const filteredStudents = useRosterFilteredStudents({
    students,
    attendanceSearch,
    isAttendanceMode,
    attendanceFilter,
    savedAttendance,
  });

  const { photosPerRow } = usePagination(filteredStudents, layout);

  useEffect(() => {
    document.body.setAttribute('data-layout', photosPerRow.toString());

    return () => {
      document.body.removeAttribute('data-layout');
    };
  }, [photosPerRow]);

  const handleImportSuccess = async (importedClassId?: string) => {
    await refetchClasses(importedClassId);
  };

  const handleClassChangeWithAttendanceConfirm = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (isAttendanceMode) {
      const confirmed = window.confirm('Bạn đang điểm danh dở. Đổi lớp sẽ mất dữ liệu tạm. Tiếp tục?');
      if (!confirmed) {
        return;
      }
    }

    await handleClassChange(event);
  };

  const handleOpenClassFromHistoryWithAttendanceConfirm = async (classId: string) => {
    if (isAttendanceMode) {
      const confirmed = window.confirm('Bạn đang điểm danh dở. Đổi lớp sẽ mất dữ liệu tạm. Tiếp tục?');
      if (!confirmed) {
        return;
      }
    }

    await handleOpenClassFromHistory(classId);
  };

  const lecturerDisplayName = getDisplayNameFromEmail(userEmail);
  const rosterMeta = buildRosterMeta(selectedClass, students);
  const printMeta = buildPrintMeta(selectedClass, filteredStudents);

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
                onClassChange={handleClassChangeWithAttendanceConfirm}
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

        {activeView === 'history' && <ImportHistoryView onOpenClass={handleOpenClassFromHistoryWithAttendanceConfirm} />}
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
        <AppToast message={attendanceMessage} onClose={() => setAttendanceMessage(null)} className="no-print" />
      )}
    </div>
  );
}

export default AppShell;
