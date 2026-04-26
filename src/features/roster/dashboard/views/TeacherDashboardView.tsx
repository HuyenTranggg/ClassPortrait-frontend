import React from 'react';
import useTeacherDashboard from '../hooks/useTeacherDashboard';
import { formatGeneratedAt } from '../utils/dashboardHelpers';
import DashboardSummaryGrid from '../components/DashboardSummaryGrid';
import DashboardToolbar from '../components/DashboardToolbar';
import DashboardTable from '../components/DashboardTable';

interface TeacherDashboardViewProps {
  onOpenClass: (classId: string) => Promise<void> | void;
  onStartAttendance: (classId: string) => Promise<void> | void;
  onOpenShare: (classId: string) => Promise<void> | void;
}

function TeacherDashboardView({
  onOpenClass,
  onStartAttendance,
  onOpenShare,
}: TeacherDashboardViewProps) {
  const {
    summary,
    classes,
    pagination,
    generatedAt,
    loading,
    error,
    query,
    setSearch,
    setAttendanceStatus,
    setShareLinkStatus,
    setSortBy,
    setSortOrder,
    setPage,
    refetch,
  } = useTeacherDashboard();
  const isInitialLoading = loading && classes.length === 0 && !generatedAt;

  if (isInitialLoading) {
    return (
      <section className="teacher-dashboard">
        <div className="state-panel">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p>Đang tải dữ liệu dashboard...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="teacher-dashboard">
        <div className="alert alert-danger" role="alert">
          <strong>Lỗi!</strong> {error}
          <div className="mt-2">
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={refetch}>
              Thử lại
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="teacher-dashboard">
      <div className="dashboard-summary-section">
        <div className="dashboard-section-header">
          <h2>Tổng quan nhanh</h2>
          <p>Nhóm chỉ số trọng yếu để theo dõi tức thì tình trạng lớp và link chia sẻ.</p>
        </div>

        <DashboardSummaryGrid summary={summary} />
      </div>

      <div className="dashboard-table-section">
        <div className="dashboard-section-header">
          <h2>Tiến độ theo từng lớp</h2>
          <p>Lọc, sắp xếp và thao tác nhanh trực tiếp trên danh sách lớp phụ trách.</p>
        </div>

        <DashboardToolbar
          search={query.search || ''}
          attendanceStatus={query.attendanceStatus || ''}
          shareLinkStatus={query.shareLinkStatus || ''}
          sortBy={query.sortBy}
          sortOrder={query.sortOrder}
          setSearch={setSearch}
          setAttendanceStatus={setAttendanceStatus}
          setShareLinkStatus={setShareLinkStatus}
          setSortBy={setSortBy}
          setSortOrder={setSortOrder}
        />

        {loading && <div className="dashboard-loading-note">Đang cập nhật danh sách...</div>}

        <DashboardTable
          classes={classes}
          onOpenClass={onOpenClass}
          onStartAttendance={onStartAttendance}
          onOpenShare={onOpenShare}
        />

        <div className="dashboard-footer">
          <span>Tổng: {pagination.totalItems} lớp</span>
          <span>Cập nhật lúc: {formatGeneratedAt(generatedAt)}</span>

          <div className="btn-group" role="group" aria-label="Phân trang dashboard">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setPage(query.page - 1)}
              disabled={query.page <= 1}
            >
              Trước
            </button>
            <button type="button" className="btn btn-outline-secondary" disabled>
              Trang {pagination.page}/{Math.max(pagination.totalPages, 1)}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setPage(query.page + 1)}
              disabled={query.page >= Math.max(pagination.totalPages, 1)}
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TeacherDashboardView;
