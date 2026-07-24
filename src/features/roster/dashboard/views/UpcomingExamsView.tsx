import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardContext, DashSection } from './TeacherDashboardLayout';
import UpcomingExamsList from '../components/UpcomingExamsList';

function UpcomingExamsView() {
  const navigate = useNavigate();
  const { allExams, loading } = useDashboardContext();

  const handleOpenClass = (classId: string) => {
    navigate(`/classes/${classId}`);
  };

  return (
    <DashSection
      title="Lịch thi sắp tới"
      subtitle="Danh sách các lớp thi sắp tới, kèm tỷ lệ ảnh và điểm danh. Bấm vào để mở sổ ảnh lớp."
    >
      {loading && <div className="dash-refresh-note">Đang cập nhật...</div>}
      <UpcomingExamsList
        exams={allExams.filter(e => e.examDate >= new Date().toISOString().split('T')[0])}
        onOpenClass={handleOpenClass}
      />
    </DashSection>
  );
}

export default UpcomingExamsView;
