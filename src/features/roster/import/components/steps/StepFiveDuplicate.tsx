import React from 'react';
import { ImportStateSnapshot } from '../../types';
import { ImportProgress } from './ImportProgress';
import { formatExcelTime } from '../../utils/formatters';

/**
 * Bước 5: Giao diện hiển thị khi phát hiện lớp thi đã tồn tại trong hệ thống (Duplicate).
 * Cho phép người dùng quyết định: (1) Cập nhật lớp đã có, hoặc (2) Vẫn tạo thành lớp mới riêng biệt.
 * 
 * @param props.state Trạng thái chứa thông tin xung đột (duplicateConflict).
 * @param props.onCreateNew Callback để bỏ qua cảnh báo và tạo tất cả thành lớp mới.
 * @param props.onPrepareUpdate Callback chuyển sang màn hình xem trước sự thay đổi trước khi cập nhật.
 * @param props.onBackToChoose Callback để quay lại màn hình chọn hành động (Tạo mới hay Cập nhật).
 * @param props.onConfirmUpdate Callback thực thi việc ghi đè thông tin lên lớp cũ trong Database.
 * @returns React Element giao diện bước 5, hoặc null nếu không có xung đột.
 */
export function StepFive(props: {
  state: ImportStateSnapshot;
  onCreateNew: () => Promise<void>;
  onPrepareUpdate: () => void;
  onBackToChoose: () => void;
  onConfirmUpdate: () => Promise<void>;
}) {
  const conflict = props.state.duplicateConflict;
  if (!conflict) return null;

  return (
    <div className="duplicate-conflict-view">
      <p className="import-modal-subtitle">Lớp đã tồn tại trong hệ thống</p>
      <ImportProgress step={props.state.step} />

      <div className="import-detection-box is-warning align-items-start">
        <div style={{ width: '100%' }}>
          <strong>{conflict.message}</strong>
          <p className="mb-1 mt-1">Phát hiện {conflict.duplicates.length} lớp trùng lặp:</p>
          <div style={{ maxHeight: '150px', overflowY: 'auto', marginRight: '-16px', paddingRight: '16px' }}>
            <ul className="mb-0 ps-3">
              {conflict.duplicates.map((dup, i) => (
                <li key={i}>
                  <strong>{dup.isFallback ? dup.classCode : dup.classExamCode}</strong>
                  {dup.examDate && <span className="ms-2">{dup.examDate}</span>}
                  {dup.examRoom && <span className="ms-2">{dup.examRoom}</span>}
                  {(dup.examTime || dup.examShift) && <span className="ms-2">{formatExcelTime(dup.examTime) || dup.examShift}</span>}
                  <span className="ms-2 text-muted">{dup.studentCount} SV</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {props.state.duplicateStepMode === 'choose' ? (
        <div className="import-actions mt-3">
          <button type="button" className="btn btn-outline-secondary" onClick={props.onCreateNew} disabled={props.state.isImporting}>{props.state.isImporting ? 'Đang xử lý...' : 'Vẫn tạo lớp mới'}</button>
          <button type="button" className="btn btn-primary" onClick={props.onPrepareUpdate} disabled={props.state.isImporting}>Cập nhật lớp đã có</button>
        </div>
      ) : (
        <>
          <h5 className="import-section-title">THAY ĐỔI PHÁT HIỆN</h5>
          <div style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
            <div>
              {conflict.duplicates.map((dup, index) => (
                <div key={index} className="mb-3">
                  <h6 className="mb-2 text-primary" style={{ fontSize: '0.9rem' }}>
                    {dup.isFallback ? (
                      dup.classCode && <strong className="me-2">{dup.classCode}</strong>
                    ) : (
                      dup.classExamCode && <strong className="me-2">{dup.classExamCode}</strong>
                    )}
                    {dup.examDate && <span className="ms-2">{dup.examDate}</span>}
                    {dup.examRoom && <span className="ms-2">{dup.examRoom}</span>}
                    {(dup.examTime || dup.examShift) && <span className="ms-2">{formatExcelTime(dup.examTime) || dup.examShift}</span>}
                    <span className="ms-2 text-muted">{dup.studentCount} SV</span>
                  </h6>
                  {dup.classFieldChanges.length > 0 && <div className="detected-mapping-card mb-2">{dup.classFieldChanges.map((change) => <div className="detected-mapping-row" key={`${change.field}-${change.oldValue}-${change.newValue}`}><span>{change.field}</span><strong>{change.oldValue}{' -> '}{change.newValue}</strong></div>)}</div>}
                  {dup.studentChanges.length > 0 && <div className="detected-mapping-card mb-2">{dup.studentChanges.map((change) => <div className="detected-mapping-row" key={`${change.label}-${change.value}`}><span>{change.label}</span><strong>{change.value}</strong></div>)}</div>}
                  {dup.classFieldChanges.length === 0 && dup.studentChanges.length === 0 && (
                    dup.fallbackDiffLines.length > 0
                      ? <ul className="mb-0 text-muted small">{dup.fallbackDiffLines.map((line) => <li key={line}>{line}</li>)}</ul>
                      : <p className="mb-0 text-muted small">Hệ thống sẽ cập nhật lại toàn bộ thông tin và danh sách sinh viên của lớp hiện có dựa trên dữ liệu mới nhập vào.</p>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="import-actions mt-3">
            <button type="button" className="btn btn-outline-secondary" onClick={props.onBackToChoose} disabled={props.state.isImporting}>Quay lại</button>
            <button type="button" className="btn btn-primary" onClick={props.onConfirmUpdate} disabled={props.state.isImporting}>{props.state.isImporting ? 'Đang cập nhật...' : 'Xác nhận cập nhật'}</button>
          </div>
        </>
      )}
    </div>
  );
}
