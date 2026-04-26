import React from 'react';
import { AttendanceStatus } from '../services/attendance.api';
import { exportAttendanceToCsv, exportAttendanceToXlsx } from '../utils/attendanceExport';

export interface AttendanceDetailRow {
  mssv: string;
  name?: string;
  status: AttendanceStatus;
  markedAt: string | null;
}

interface AttendanceStatsModalProps {
  isOpen: boolean;
  present: number;
  absent: number;
  total: number;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
  isSubmitting?: boolean;
}

interface AttendanceDetailModalProps {
  isOpen: boolean;
  rows: AttendanceDetailRow[];
  classLabel?: string;
  onClose: () => void;
}

interface RetakeConfirmModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
  isSubmitting?: boolean;
}

/**
 * Format thời gian ISO thành định dạng địa phương vi-VN dễ đọc.
 * @param value Chuỗi ISO datetime hoặc null.
 * @param fallback Nội dung fallback khi thời gian trống hoặc không hợp lệ.
 * @returns Chuỗi thời gian đã định dạng để hiển thị.
 */
const formatDateTime = (value: string | null | undefined, fallback = '--'): string => {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toLocaleString('vi-VN');
};


export function AttendanceStatsModal({
  isOpen,
  present,
  absent,
  total,
  onCancel,
  onConfirm,
  isSubmitting,
}: AttendanceStatsModalProps) {
  if (!isOpen) {
    return null;
  }

  const ratio = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <div className="attendance-modal-backdrop" role="presentation" onClick={!isSubmitting ? onCancel : undefined}>
      <div
        className="attendance-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="attendance-stats-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="attendance-stats-title">Xác nhận lưu kết quả điểm danh</h2>

        <div className="attendance-stats-grid" role="list" aria-label="Thống kê điểm danh">
          <div className="attendance-stats-item" role="listitem">
            <span>Tổng số</span>
            <strong>{total}</strong>
          </div>
          <div className="attendance-stats-item" role="listitem">
            <span>Có mặt</span>
            <strong className="is-present">{present}</strong>
          </div>
          <div className="attendance-stats-item" role="listitem">
            <span>Vắng</span>
            <strong className="is-absent">{absent}</strong>
          </div>
          <div className="attendance-stats-item" role="listitem">
            <span>Tỉ lệ có mặt</span>
            <strong>{ratio}%</strong>
          </div>
        </div>

        <div className="attendance-modal-actions">
          <button type="button" className="btn btn-outline-secondary" onClick={onCancel} disabled={isSubmitting}>
            Hủy
          </button>
          <button type="button" className="btn btn-primary" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AttendanceDetailModal({ isOpen, rows, classLabel, onClose }: AttendanceDetailModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="attendance-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="attendance-modal-card attendance-modal-card-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="attendance-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="attendance-detail-title">Chi tiết điểm danh</h2>

        <div className="table-responsive mt-3 attendance-detail-scroll">
          <table className="table table-bordered table-hover align-middle mb-0 attendance-detail-table">
            <thead>
              <tr>
                <th>MSSV</th>
                <th>Họ và tên</th>
                <th>Trạng thái</th>
                <th>Điểm danh lúc</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.mssv}>
                  <td>{row.mssv}</td>
                  <td>{row.name || '--'}</td>
                  <td>
                    <span className={`attendance-status-chip ${row.status === 'present' ? 'is-present' : 'is-absent'}`}>
                      {row.status === 'present' ? 'Có mặt' : 'Vắng'}
                    </span>
                  </td>
                  <td>{formatDateTime(row.markedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="attendance-modal-actions">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => exportAttendanceToCsv(rows, classLabel, formatDateTime)}
          >
            Export CSV
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => exportAttendanceToXlsx(rows, classLabel, formatDateTime)}
          >
            Export XLSX
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export function RetakeConfirmModal({ isOpen, onCancel, onConfirm, isSubmitting }: RetakeConfirmModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="attendance-modal-backdrop" role="presentation" onClick={!isSubmitting ? onCancel : undefined}>
      <div
        className="attendance-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="attendance-retake-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="attendance-retake-title">Xác nhận điểm danh lại</h2>
        <p className="attendance-modal-description">
          Bạn có muốn điểm danh lại không? Kết quả cũ sẽ bị ghi đè.
        </p>

        <div className="attendance-modal-actions">
          <button type="button" className="btn btn-outline-secondary" onClick={onCancel} disabled={isSubmitting}>
            Hủy
          </button>
          <button type="button" className="btn btn-primary" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Đang xử lý...' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}
