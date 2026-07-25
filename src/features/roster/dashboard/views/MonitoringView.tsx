import React from 'react';
import { useDashboardContext, DashSection, DashPanel } from './TeacherDashboardLayout';
import { formatGeneratedAt } from '../utils/dashboardHelpers';
import DashboardSummaryGrid from '../components/DashboardSummaryGrid';
import { PhotoHealthChart, ExamRoomChart, ExamShiftChart, CourseDistributionChart } from '../components/DashboardCharts';
import AttendanceOverviewCard from '../components/AttendanceOverviewCard';
import ShareLinkStatusCard from '../components/ShareLinkStatusCard';
import DashboardFilters from '../components/DashboardFilters';

function MonitoringView() {
  const {
    overview,
    photoHealth,
    logistics,
    attendance,
    shareLinks,
    generatedAt,
    refetch,
    filters,
    setFilters,
  } = useDashboardContext();

  return (
    <>
      <div className="dash-section-header mb-4">
        <h2 className="dash-section-title">Giám sát & Điều phối kỳ thi</h2>
        <p className="dash-section-subtitle">Dữ liệu được tổng hợp dựa trên khoảng thời gian lựa chọn.</p>
      </div>

      <DashboardFilters
        startDate={filters.startDate}
        endDate={filters.endDate}
        onFilterChange={(newFilters) => setFilters(newFilters)}
      />

      <DashSection
        title="Tổng quan nhanh"
        subtitle="Bức tranh toàn cảnh kỳ thi: số lớp, sinh viên, phòng thi, ca thi và tình trạng ảnh."
      >
        <DashboardSummaryGrid
          overview={overview}
          validPhotoRate={photoHealth.validPhotoRate}
          classesWithIncompletePhoto={photoHealth.classesWithIncompletePhoto}
        />
      </DashSection>

      <DashSection
        title="Thống kê chi tiết"
        subtitle="Phân bổ sinh viên theo phòng thi, ca thi và học phần."
        className="dash-section-charts"
      >
        <div className="dash-charts-grid">
          <DashPanel title="Sinh viên theo phòng thi">
            <ExamRoomChart byRoom={logistics.byRoom} />
          </DashPanel>

          <DashPanel title="Phân bổ theo ca thi">
            <ExamShiftChart byShift={logistics.byShift} />
          </DashPanel>

          <DashPanel title="Sinh viên theo học phần">
            <CourseDistributionChart byCourse={logistics.byCourse} />
          </DashPanel>

          <DashPanel title="Tình trạng ảnh sinh viên">
            <PhotoHealthChart photoHealth={photoHealth} />
            {photoHealth.classesWithIncompletePhoto > 0 && (
              <p className="dash-photo-warning">
                ⚠️ Còn <strong>{photoHealth.classesWithIncompletePhoto} lớp</strong> chưa đủ ảnh hợp lệ.
              </p>
            )}
          </DashPanel>
        </div>
      </DashSection>

      <DashSection
        title="Điểm danh & Chia sẻ"
        subtitle="Tổng quan tình trạng điểm danh thí sinh và link chia sẻ sổ ảnh."
      >
        <div className="dash-bottom-grid">
          <DashPanel title="Điểm danh thí sinh">
            <AttendanceOverviewCard attendance={attendance} />
          </DashPanel>
          <DashPanel title="Link chia sẻ sổ ảnh">
            <ShareLinkStatusCard shareLinks={shareLinks} />
          </DashPanel>
        </div>
      </DashSection>

      <div className="dash-footer mt-4">
        Dữ liệu cập nhật lúc: {formatGeneratedAt(generatedAt)}
        <button type="button" className="btn btn-link btn-sm p-0 ms-3" onClick={refetch}>
          🔄 Làm mới
        </button>
      </div>
    </>
  );
}

export default MonitoringView;
