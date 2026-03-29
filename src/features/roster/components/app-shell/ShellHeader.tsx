import React from 'react';
import ImportButton from '../ImportButton';
import { ActiveView, RosterMeta } from './types';

interface ShellHeaderProps {
  activeView: ActiveView;
  selectedClassExists: boolean;
  rosterMeta: RosterMeta;
  onOpenShare: () => void;
  onImportSuccess: (importedClassId?: string) => Promise<void> | void;
}

function ShellHeader({ activeView, selectedClassExists, rosterMeta, onOpenShare, onImportSuccess }: ShellHeaderProps) {
  const title =
    activeView === 'roster'
      ? 'DANH SÁCH THÍ SINH DỰ THI'
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
          <div className="roster-meta" role="list" aria-label="Thông tin lịch sử import"></div>
        )}
      </div>

      {activeView === 'roster' && (
        <div className="shell-actions">
          <button
            type="button"
            className="btn btn-outline-secondary btn-share"
            disabled={!selectedClassExists}
            onClick={onOpenShare}
          >
            Chia sẻ
          </button>
          <ImportButton onImportSuccess={onImportSuccess} />
        </div>
      )}
    </header>
  );
}

export default ShellHeader;
