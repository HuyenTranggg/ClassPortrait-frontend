import React from 'react';
import ImportButton from '../../import/components/ImportButton';
import { ActiveView, RosterMeta } from './types';

interface ShellHeaderProps {
  activeView: ActiveView;
  selectedClassExists: boolean;
  hasStudents: boolean;
  hasSavedAttendance: boolean;
  rosterMeta: RosterMeta;
  isAttendanceMode: boolean;
  isAttendanceBusy: boolean;
  onOpenShare: () => void;
  onStartAttendance: () => Promise<void> | void;
  onSaveAttendance: () => void;
  onCancelAttendance: () => void;
  onImportSuccess: (importedClassId?: string) => Promise<void> | void;
}

function ShellHeader({
  activeView,
  selectedClassExists,
  hasStudents,
  hasSavedAttendance,
  rosterMeta,
  isAttendanceMode,
  isAttendanceBusy,
  onOpenShare,
  onStartAttendance,
  onSaveAttendance,
  onCancelAttendance,
  onImportSuccess,
}: ShellHeaderProps) {
  const title =
    activeView === 'roster'
      ? 'DANH SÁCH THÍ SINH DỰ THI'
      : activeView === 'dashboard'
        ? 'DASHBOARD GIẢNG VIÊN'
      : activeView === 'history'
        ? 'LỊCH SỬ IMPORT'
        : 'QUẢN LÝ LINK CHIA SẺ';

  return (
    <header className="shell-header">
      <div className="shell-header-content">
        <p className="roster-school">ĐẠI HỌC BÁCH KHOA HÀ NỘI</p>
        <h1>{title}</h1>

        {activeView === 'roster' ? (
          <div className="roster-meta" role="list" aria-label="Thông tin lớp học">
            <div className="roster-meta-item" role="listitem"><span>Học phần:</span><strong>{rosterMeta.courseLabel}</strong></div>
            <div className="roster-meta-item" role="listitem"><span>Mã lớp:</span><strong>{rosterMeta.classCodeLabel}</strong></div>
            <div className="roster-meta-item" role="listitem"><span>Học kỳ:</span><strong>{rosterMeta.semesterLabel}</strong></div>
            <div className="roster-meta-item" role="listitem"><span>Sĩ số:</span><strong>{rosterMeta.studentCountLabel}</strong></div>
          </div>
        ) : (
          <div className="roster-meta" role="list" aria-label="Thông tin màn hình hiện tại"></div>
        )}
      </div>

      {activeView === 'roster' && (
        <div className="shell-actions">
          {isAttendanceMode ? (
            <>
              <button type="button" className="btn btn-outline-secondary" onClick={onCancelAttendance} disabled={isAttendanceBusy}>
                Hủy
              </button>
              <button type="button" className="btn btn-primary" onClick={onSaveAttendance} disabled={isAttendanceBusy || !selectedClassExists}>
                Lưu kết quả
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-outline-secondary btn-share"
                disabled={!selectedClassExists}
                onClick={onOpenShare}
              >
                Chia sẻ
              </button>
              <ImportButton onImportSuccess={onImportSuccess} />
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={!selectedClassExists || !hasStudents || isAttendanceBusy}
                onClick={onStartAttendance}
              >
                {isAttendanceBusy ? 'Đang tải...' : hasSavedAttendance ? 'Chỉnh sửa điểm danh' : 'Bắt đầu điểm danh'}
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}

export default ShellHeader;
