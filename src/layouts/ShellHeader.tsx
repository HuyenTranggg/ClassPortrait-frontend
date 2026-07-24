import React, { useState } from 'react';
import ImportButton from '../features/roster/import/components/ImportButton';
import { ActiveView, RosterMeta } from '../features/roster/types';

interface ShellHeaderProps {
  activeView: ActiveView;
  selectedClassExists?: boolean;
  hasStudents?: boolean;
  hasSavedAttendance?: boolean;
  rosterMeta?: RosterMeta;
  isAttendanceMode?: boolean;
  isAttendanceBusy?: boolean;
  isAutoCallEnabled?: boolean;
  onOpenShare?: () => void;
  onStartAttendance?: () => Promise<void> | void;
  onSaveAttendance?: () => void;
  onCancelAttendance?: () => void;
  onStartAiScanner?: () => void;
  onToggleAutoCall?: (enabled: boolean) => void;
  onImportSuccess?: (importedClassId?: string) => Promise<void> | void;
  hideShareAction?: boolean;
  hideAttendanceAction?: boolean;
}

function ShellHeader({
  activeView,
  selectedClassExists = false,
  hasStudents = false,
  hasSavedAttendance = false,
  rosterMeta = {} as RosterMeta,
  isAttendanceMode = false,
  isAttendanceBusy = false,
  isAutoCallEnabled = false,
  onOpenShare,
  onStartAttendance,
  onSaveAttendance,
  onCancelAttendance,
  onStartAiScanner,
  onToggleAutoCall,
  onImportSuccess,
  hideShareAction = false,
  hideAttendanceAction = false,
}: ShellHeaderProps) {
  // Thu gọn khối thông tin lớp thi: mặc định đóng để ưu tiên không gian cho
  // danh sách sinh viên, đặc biệt trên điện thoại (giám thị gọi tên thủ công).
  // Chỉ vài dòng cốt lõi (Môn học, Phòng/Ngày/Giờ thi) luôn hiển thị.
  const [isMetaExpanded, setMetaExpanded] = useState(false);

  const title =
    activeView === 'class-list'
      ? 'DANH SÁCH LỚP THI'
      : activeView === 'roster'
        ? 'SỔ ẢNH LỚP THI'
        : activeView === 'dashboard'
          ? 'DASHBOARD GIẢNG VIÊN'
          : activeView === 'history'
            ? 'LỊCH SỬ IMPORT'
            : 'QUẢN LÝ LINK CHIA SẺ';

  return (
    <header className="shell-header d-flex align-items-center justify-content-between">
      <div className="shell-header-content">
        <p className="roster-school">ĐẠI HỌC BÁCH KHOA HÀ NỘI</p>
        <h1>{title}</h1>

        {activeView === 'roster' && (
          <div className={`roster-meta-wrapper${isMetaExpanded ? ' is-expanded' : ''}`}>
            <div className="roster-meta" role="list" aria-label="Thông tin lớp học">
              {/* Cốt lõi: luôn hiển thị (kể cả khi thu gọn trên điện thoại) */}
              <div className="roster-meta-item" role="listitem"><span>Môn học:</span><strong>{rosterMeta.courseName}</strong></div>
              <div className="roster-meta-item" role="listitem"><span>Phòng thi:</span><strong>{rosterMeta.examRoom}</strong></div>
              <div className="roster-meta-item" role="listitem"><span>Ngày thi:</span><strong>{rosterMeta.examDate}</strong></div>
              <div className="roster-meta-item" role="listitem"><span>Giờ thi:</span><strong>{rosterMeta.examTime}</strong></div>
              <div className="roster-meta-item" role="listitem"><span>Sĩ số:</span><strong>{rosterMeta.studentCountLabel}</strong></div>

              {/* Phụ: desktop luôn hiện; điện thoại chỉ hiện khi bấm "Xem thêm".
                  Luôn render trong DOM, việc ẩn/hiện do CSS quyết định theo breakpoint. */}
              <div className="roster-meta-item roster-meta-item--secondary" role="listitem"><span>Học kỳ:</span><strong>{rosterMeta.semesterLabel}</strong></div>
              <div className="roster-meta-item roster-meta-item--secondary" role="listitem"><span>Mã HP:</span><strong>{rosterMeta.courseCode}</strong></div>
              <div className="roster-meta-item roster-meta-item--secondary" role="listitem"><span>Mã lớp học:</span><strong>{rosterMeta.classCodeLabel}</strong></div>
              <div className="roster-meta-item roster-meta-item--secondary" role="listitem"><span>Mã lớp thi:</span><strong>{rosterMeta.classExamCode}</strong></div>
              <div className="roster-meta-item roster-meta-item--secondary" role="listitem"><span>Kíp thi:</span><strong>{rosterMeta.examShift}</strong></div>
              <div className="roster-meta-item roster-meta-item--secondary" role="listitem"><span>GV giảng dạy:</span><strong>{rosterMeta.instructor}</strong></div>
              {rosterMeta.invigilator && (
                <div className="roster-meta-item roster-meta-item--secondary" role="listitem"><span>Giám thị:</span><strong>{rosterMeta.invigilator}</strong></div>
              )}
              {/* Nút mở rộng: chỉ hiển thị trên điện thoại (CSS ẩn ở desktop) */}
              <button
                type="button"
                className="roster-meta-toggle ms-1"
                onClick={() => setMetaExpanded((prev) => !prev)}
                aria-expanded={isMetaExpanded}
              >
                {isMetaExpanded ? (
                  <><i className="bi bi-chevron-up me-1" />Thu gọn</>
                ) : (
                  <><i className="bi bi-chevron-down me-1" />Xem thêm</>
                )}
              </button>
            </div>
          </div>
        )}

      </div>

      {activeView === 'class-list' && (
        <div className="shell-actions ms-auto">
          <ImportButton onImportSuccess={onImportSuccess} />
        </div>
      )}


      {activeView === 'roster' && (
        <div className="shell-actions">
          {isAttendanceMode ? (
            <>
              <button type="button" className="btn btn-outline-secondary" onClick={onCancelAttendance} disabled={isAttendanceBusy}>
                Hủy
              </button>
              {onStartAiScanner && (
                <button type="button" className="btn btn-outline-primary btn-ai" onClick={onStartAiScanner} disabled={isAttendanceBusy}>
                  <i className="bi bi-camera-video me-1"></i> Quét Điểm danh Tự động
                </button>
              )}

              {/* Switch Tự động gọi tên */}
              {onToggleAutoCall && (
                <div className="d-flex align-items-center gap-2 autocall-switch">
                  <div className="form-check form-switch mb-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="shellAutoCallSwitch"
                      checked={isAutoCallEnabled}
                      onChange={(e) => onToggleAutoCall(e.target.checked)}
                      disabled={isAttendanceBusy}
                    />
                    <label className="form-check-label d-flex align-items-center gap-1" htmlFor="shellAutoCallSwitch" title="Tự động gọi tên" style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                      <i className="bi bi-mic" />
                      <span className="autocall-text">Tự động gọi tên</span>
                    </label>
                  </div>
                </div>
              )}

              <button type="button" className="btn btn-primary btn-save-attendance" onClick={onSaveAttendance} disabled={isAttendanceBusy || !selectedClassExists}>
                <span className="save-label-full">Lưu kết quả</span>
                <span className="save-label-short">Lưu</span>
              </button>
            </>
          ) : (
            <>
              {!hideShareAction && (
                <button
                  type="button"
                  className="btn btn-accent btn-share"
                  disabled={!selectedClassExists}
                  onClick={onOpenShare}
                >
                  Chia sẻ
                </button>
              )}
              {!hideAttendanceAction && (
                <button
                  type="button"
                  className="btn btn-accent"
                  disabled={!selectedClassExists || !hasStudents || isAttendanceBusy}
                  onClick={onStartAttendance}
                >
                  {isAttendanceBusy ? 'Đang tải...' : hasSavedAttendance ? 'Chỉnh sửa điểm danh' : 'Bắt đầu điểm danh'}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </header>
  );
}

export default ShellHeader;
