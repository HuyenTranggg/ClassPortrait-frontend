import React from 'react';
import { useDashboardContext, DashSection, DashPanel } from './TeacherDashboardLayout';
import RoomShiftMatrix from '../components/RoomShiftMatrix';
import RoomGanttChart from '../components/RoomGanttChart';
import ExamCalendar from '../components/ExamCalendar';

function RoomGanttView() {
  const { allExams, selectedDate, setSelectedDate, availableDates } = useDashboardContext();

  return (
    <DashSection
      title="Tình hình sử dụng phòng thi"
      subtitle="Theo dõi phân bổ phòng thi và ca thi theo ngày thi."
      headerAction={
        <div className="d-flex align-items-center gap-3">
          <span className="small text-muted fw-semibold">Chọn ngày thi:</span>
          <ExamCalendar
            selectedDate={selectedDate}
            availableDates={availableDates}
            onDateSelect={setSelectedDate}
          />
        </div>
      }
    >
      <div className="row g-4">
        <div className="col-12">
          <DashPanel title="Ma trận Phòng thi & Ca thi">
            <RoomShiftMatrix exams={allExams} selectedDate={selectedDate} />
          </DashPanel>
        </div>
        <div className="col-12">
          <DashPanel title="Sơ đồ Gantt sử dụng phòng">
            <RoomGanttChart exams={allExams} selectedDate={selectedDate} />
          </DashPanel>
        </div>
      </div>
    </DashSection>
  );
}

export default RoomGanttView;
