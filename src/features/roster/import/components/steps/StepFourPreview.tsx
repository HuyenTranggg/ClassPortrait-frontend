import React, { useState } from 'react';
import { ImportStateSnapshot } from '../../types';
import { ImportProgress } from './ImportProgress';
import { formatExcelTime } from '../../utils/formatters';

/**
 * Bước 4: Hiển thị giao diện xem trước (Preview) dữ liệu sẽ được import.
 * Nhóm các lớp thi theo môn học, cảnh báo lỗi dữ liệu (nếu có), và cung cấp nút bấm để chính thức import vào DB.
 * 
 * @param props.state Trạng thái hiện tại chứa dữ liệu preview.
 * @param props.onBack Callback để quay lại cấu hình cột.
 * @param props.onConfirmImport Callback thực thi import dữ liệu vào Database.
 * @returns React Element giao diện bước 4.
 */
export function StepFourPreview(props: {
  state: ImportStateSnapshot;
  onBack: () => void;
  onConfirmImport: () => Promise<void>;
}) {
  const { state } = props;
  const preview = state.previewData;
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  if (!preview) return null;

  const hasErrors = preview.validationErrors.length > 0;

  // Nhóm sessions theo môn học
  const grouped = preview.examSessions.reduce<Record<string, typeof preview.examSessions>>((acc, session) => {
    const key = `${session.courseCode} - ${session.courseName}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(session);
    return acc;
  }, {});

  const totalClasses = preview.examSessions.length;
  const totalStudents = preview.examSessions.reduce((s, g) => s + g.studentCount, 0);
  const uniqueCourses = Object.keys(grouped).length;

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <>
      <p className="import-modal-subtitle">Preview dữ liệu trước khi import</p>
      <ImportProgress step={state.step} />

      {/* Summary */}
      <div className="preview-summary-grid">
        <div className="preview-summary-item">
          <span className="preview-summary-value">{uniqueCourses}</span>
          <span className="preview-summary-label">Mã học phần</span>
        </div>
        <div className="preview-summary-item">
          <span className="preview-summary-value">{totalClasses}</span>
          <span className="preview-summary-label">Lớp thi</span>
        </div>
        <div className="preview-summary-item">
          <span className="preview-summary-value">{totalStudents}</span>
          <span className="preview-summary-label">Sinh viên</span>
        </div>
        <div className="preview-summary-item">
          <span className={`preview-summary-value ${hasErrors ? 'text-danger' : 'text-success'}`}>{preview.validationErrors.length}</span>
          <span className="preview-summary-label">Lỗi dữ liệu</span>
        </div>
      </div>

      {/* Warning Panel */}
      {hasErrors && (
        <div className="preview-warning-panel">
          <h6 className="preview-warning-title">
            <span>⚠</span> Phát hiện {preview.validationErrors.length} dòng có vấn đề
          </h6>
          <p className="preview-warning-desc">Vui lòng sửa file gốc và import lại để đảm bảo dữ liệu chính xác.</p>
          <div className="preview-warning-list">
            {preview.validationErrors.slice(0, 5).map((err, i) => (
              <div key={i} className="preview-warning-row">
                <span className="preview-warning-row-line">Dòng {err.row}</span>
                <span className="preview-warning-row-field">{err.field}</span>
                <span className="preview-warning-row-msg">{err.message}</span>
              </div>
            ))}
            {preview.validationErrors.length > 5 && (
              <p className="text-muted small mb-0">... và {preview.validationErrors.length - 5} lỗi khác.</p>
            )}
          </div>
        </div>
      )}

      {/* Tree View */}
      <h5 className="import-section-title mt-3">CẤU TRÚC DỮ LIỆU</h5>
      <div className="preview-tree">
        {Object.entries(grouped).map(([courseKey, sessions]) => {
          const isExpanded = expandedGroups.has(courseKey);
          return (
            <div key={courseKey} className="preview-tree-group">
              <button
                type="button"
                className="preview-tree-group-header"
                onClick={() => toggleGroup(courseKey)}
              >
                <span className="preview-tree-arrow">{isExpanded ? '▾' : '▸'}</span>
                <span className="preview-tree-course">{courseKey}</span>
                <span className="preview-tree-badge">{sessions.length} lớp thi</span>
              </button>
              {isExpanded && (
                <div className="preview-tree-sessions">
                  {sessions.map((session) => (
                    <div key={session.groupKey} className="preview-tree-session-row">
                      <div className="preview-session-info">
                        {session.isFallback ? (
                          session.classCode && <strong className="me-2">{session.classCode}</strong>
                        ) : (
                          session.classExamCode && <strong className="me-2">{session.classExamCode}</strong>
                        )}
                        {session.examDate && <span className="me-2">{session.examDate}</span>}
                        {session.examRoom && <span className="me-2">{session.examRoom}</span>}
                        {(session.examTime || session.examShift) && <span className="me-2">{formatExcelTime(session.examTime) || session.examShift}</span>}
                      </div>
                      <span className="preview-session-count">{session.studentCount} SV</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="import-actions mt-3">
        <button type="button" className="btn btn-outline-secondary" onClick={props.onBack} disabled={state.isImporting}>
          Quay lại
        </button>
        <button
          type="button"
          className="btn btn-success"
          onClick={props.onConfirmImport}
          disabled={hasErrors || state.isImporting}
          title={hasErrors ? 'Vui lòng sửa các lỗi dữ liệu trước khi import' : ''}
        >
          {state.isImporting ? (
            <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Đang import...</>
          ) : (
            <>✓ Import ({totalStudents} sinh viên)</>
          )}
        </button>
      </div>
    </>
  );
}
