import React from 'react';
import { Student } from '../../../types';
import StudentCard from './StudentCard';
import { PrintMeta } from '../types';
import { AttendanceStatus } from '../attendance/services/attendance.api';
import { PrintHeaderConfig, PrintHeaderRenderer } from '../print';

interface RosterBodyProps {
  loading: boolean;
  error: string | null;
  students: Student[];
  printMeta: PrintMeta;
  printHeaderConfig: PrintHeaderConfig;
  isAttendanceMode: boolean;
  attendanceByMssv: Record<string, { status: AttendanceStatus }>;
  onToggleAttendance: (mssv: string) => void;
}

function RosterBody({
  loading,
  error,
  students,
  printMeta,
  printHeaderConfig,
  isAttendanceMode,
  attendanceByMssv,
  onToggleAttendance,
}: RosterBodyProps) {
  if (loading) {
    return (
      <div className="state-panel">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
        <p>Đang tải danh sách sinh viên...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <strong>Lỗi!</strong> {error}
        <br />
        <small>Đảm bảo backend đang chạy tại http://localhost:3000</small>
      </div>
    );
  }

  return (
    <section className="gallery-panel">
      {isAttendanceMode && (
        <div className="attendance-mode-hint">
          Đang ở chế độ điểm danh: Click vào ảnh thí sinh để đổi trạng thái có mặt/vắng.
        </div>
      )}

      {students.length === 0 ? (
        <div className="empty-state-card">
          <h2>Chưa có dữ liệu để hiển thị</h2>
          <p>Hãy import danh sách lớp để hệ thống tự động lấy ảnh và tạo sổ ảnh chuẩn định dạng.</p>
        </div>
      ) : (
        <div className="page-content">
          <PrintHeaderRenderer config={printHeaderConfig} printMeta={printMeta} className="print-only" />

          <div className="student-gallery">
            {students.map((student) => (
              <StudentCard
                key={student.mssv}
                mssv={student.mssv}
                name={student.name}
                photoUrl={student.photoUrl}
                attendanceStatus={attendanceByMssv[student.mssv]?.status}
                isAttendanceMode={isAttendanceMode}
                showAttendanceStatus={!isAttendanceMode && Boolean(attendanceByMssv[student.mssv])}
                onToggleAttendance={() => onToggleAttendance(student.mssv)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default RosterBody;
