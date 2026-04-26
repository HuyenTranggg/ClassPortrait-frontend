import React, { useState } from 'react';
import { DashboardClassItem } from '../types';
import {
  getClassDisplayName,
  mapShareStatusClassName,
  mapShareStatusLabel,
  formatPercent,
  getRemainingDaysLabel,
} from '../utils/dashboardHelpers';

interface DashboardTableProps {
  classes: DashboardClassItem[];
  onOpenClass: (classId: string) => Promise<void> | void;
  onStartAttendance: (classId: string) => Promise<void> | void;
  onOpenShare: (classId: string) => Promise<void> | void;
}

function DashboardTable({ classes, onOpenClass, onStartAttendance, onOpenShare }: DashboardTableProps) {
  const [actionLoadingClassId, setActionLoadingClassId] = useState<string | null>(null);

  /**
   * Thực thi action nhanh theo từng lớp và tự quản lý trạng thái loading cục bộ.
   * @param classId UUID lớp tương ứng với dòng đang thao tác.
   * @param action Hàm action cần chạy (mở lớp/điểm danh/chia sẻ).
   * @returns Không trả về giá trị.
   */
  const runQuickAction = async (classId: string, action: (value: string) => Promise<void> | void) => {
    setActionLoadingClassId(classId);

    try {
      await action(classId);
    } finally {
      setActionLoadingClassId(null);
    }
  };

  return (
    <div className="table-responsive dashboard-table-wrap">
      <table className="table table-bordered table-hover align-middle mb-0">
        <thead>
          <tr>
            <th>Tên lớp</th>
            <th>Sĩ số</th>
            <th>% ảnh hợp lệ</th>
            <th>% có mặt</th>
            <th>Số vắng</th>
            <th>Trạng thái điểm danh</th>
            <th>Trạng thái link chia sẻ</th>
            <th>Còn hạn</th>
            <th>Hành động nhanh</th>
          </tr>
        </thead>
        <tbody>
          {classes.length === 0 ? (
            <tr>
              <td colSpan={9} className="text-center py-4">
                Không có dữ liệu lớp phù hợp bộ lọc hiện tại.
              </td>
            </tr>
          ) : (
            classes.map((row) => (
              <tr key={row.classId}>
                <td>
                  <div className="dashboard-class-name">{getClassDisplayName(row)}</div>
                  {row.className && row.classCode && (
                    <div className="dashboard-class-code">{row.classCode}</div>
                  )}
                </td>
                <td>{row.studentCount}</td>
                <td>{formatPercent(row.validPhotoRate)}</td>
                <td>{formatPercent(row.presentRate)}</td>
                <td>{row.absentCount === null ? '--' : row.absentCount}</td>
                <td>
                  {row.attendanceStatus === 'available' ? (
                    <span className="dashboard-badge is-available">Có dữ liệu</span>
                  ) : (
                    <span className="dashboard-badge is-no-data">Chưa có dữ liệu</span>
                  )}
                </td>
                <td>
                  <span className={`dashboard-badge ${mapShareStatusClassName(row.shareLink.status)}`}>
                    {mapShareStatusLabel(row.shareLink.status)}
                  </span>
                </td>
                <td>{getRemainingDaysLabel(row)}</td>
                <td>
                  <div className="dashboard-action-group">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => runQuickAction(row.classId, onOpenClass)}
                      disabled={actionLoadingClassId === row.classId}
                    >
                      Mở lớp
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => runQuickAction(row.classId, onStartAttendance)}
                      disabled={actionLoadingClassId === row.classId}
                    >
                      Điểm danh
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => runQuickAction(row.classId, onOpenShare)}
                      disabled={actionLoadingClassId === row.classId}
                    >
                      Chia sẻ
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DashboardTable;
