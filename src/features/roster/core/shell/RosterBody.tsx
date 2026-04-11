import React from 'react';
import { Student } from '../../../../types';
import StudentCard from '../StudentCard';
import { PrintMeta } from './types';
import { AttendanceStatus } from '../../attendance/services/api';

interface RosterBodyProps {
  loading: boolean;
  error: string | null;
  students: Student[];
  printMeta: PrintMeta;
  isAttendanceMode: boolean;
  attendanceByMssv: Record<string, { status: AttendanceStatus }>;
  onToggleAttendance: (mssv: string) => void;
}

function RosterBody({
  loading,
  error,
  students,
  printMeta,
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
          <div className="print-only print-first-header">
            <div className="print-form-top">
              <div className="print-form-org">
                <p>ĐẠI HỌC BÁCH KHOA HÀ NỘI</p>
                <p>{printMeta.printDepartment || '\u00A0'}</p>
              </div>

              <div className="print-form-title">
                <h2>DANH SÁCH THÍ SINH DỰ THI</h2>
                <p>Học phần: {printMeta.printCourseLabel || '\u00A0'}</p>
              </div>
            </div>

            <div className="print-form-grid">
              <div className="print-field"><span className="print-field-label">Ngày thi:</span><span className="print-field-value">{printMeta.printExamDate || '\u00A0'}</span></div>
              <div className="print-field"><span className="print-field-label">GV:</span><span className="print-field-value">{printMeta.printInstructor || '\u00A0'}</span></div>
              <div className="print-field"><span className="print-field-label">Sĩ số:</span><span className="print-field-value">{printMeta.printStudentCount || '\u00A0'}</span></div>
              <div className="print-field"><span className="print-field-label">Phòng thi:</span><span className="print-field-value">{printMeta.printExamRoom || '\u00A0'}</span></div>
              <div className="print-field"><span className="print-field-label">Mã lớp học:</span><span className="print-field-value">{printMeta.printClassCode || '\u00A0'}</span></div>
              <div className="print-field"><span className="print-field-label">Giám thị:</span><span className="print-field-value">{printMeta.printProctor || '\u00A0'}</span></div>
              <div className="print-field"><span className="print-field-label">Kíp thi:</span><span className="print-field-value">{printMeta.printExamShift || '\u00A0'}</span></div>
              <div className="print-field"><span className="print-field-label">Giờ thi:</span><span className="print-field-value">{printMeta.printExamTime || '\u00A0'}</span></div>
            </div>
          </div>

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
