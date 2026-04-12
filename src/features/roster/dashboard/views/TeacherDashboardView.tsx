import React from 'react';
import useTeacherDashboard from '../hooks/useTeacherDashboard';
import { DashboardClassItem, DashboardSortBy, ShareLinkStatus } from '../types';

interface TeacherDashboardViewProps {
  onOpenClass: (classId: string) => Promise<void> | void;
  onStartAttendance: (classId: string) => Promise<void> | void;
  onOpenShare: (classId: string) => Promise<void> | void;
}

const attendanceFilterOptions = [
  { value: '', label: 'Tất cả điểm danh' },
  { value: 'available', label: 'Có dữ liệu' },
  { value: 'no_data', label: 'Chưa có dữ liệu' },
] as const;

const shareLinkFilterOptions = [
  { value: '', label: 'Tất cả link chia sẻ' },
  { value: 'no_link', label: 'Chưa tạo link' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'inactive', label: 'Đã tắt' },
  { value: 'expired', label: 'Hết hạn' },
] as const;

const sortByOptions: Array<{ value: DashboardSortBy; label: string }> = [
  { value: 'classCode', label: 'Mã lớp' },
  { value: 'studentCount', label: 'Sĩ số' },
  { value: 'validPhotoRate', label: '% ảnh hợp lệ' },
  { value: 'presentRate', label: '% có mặt' },
  { value: 'absentCount', label: 'Số vắng' },
  { value: 'shareLinkStatus', label: 'Trạng thái link' },
  { value: 'remainingDays', label: 'Còn hạn (ngày)' },
];

const formatPercent = (value: number | null): string => {
  if (value === null || Number.isNaN(value)) {
    return '--';
  }

  return `${Math.round(value)}%`;
};

const formatGeneratedAt = (value: string): string => {
  if (!value) {
    return '--';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('vi-VN');
};

/**
 * Tạo nhãn lớp ưu tiên tên lớp, sau đó fallback về mã lớp.
 * @param row Dữ liệu lớp từ dashboard.
 * @returns Chuỗi hiển thị tên lớp phù hợp UI.
 */
const getClassDisplayName = (row: DashboardClassItem): string => {
  const className = String(row.className || '').trim();

  if (className) {
    return className;
  }

  return row.classCode;
};

/**
 * Trả về nhãn tiếng Việt cho trạng thái link chia sẻ.
 * @param status Trạng thái link từ backend.
 * @returns Chuỗi hiển thị trạng thái phù hợp UI.
 */
const mapShareStatusLabel = (status: ShareLinkStatus): string => {
  if (status === 'active') {
    return 'Đang hoạt động';
  }

  if (status === 'inactive') {
    return 'Đã tắt';
  }

  if (status === 'expired') {
    return 'Hết hạn';
  }

  return 'Chưa tạo';
};

/**
 * Tạo className badge tương ứng với trạng thái link.
 * @param status Trạng thái link chia sẻ hiện tại.
 * @returns Tên class dùng để tô màu badge.
 */
const mapShareStatusClassName = (status: ShareLinkStatus): string => {
  if (status === 'active') {
    return 'is-active';
  }

  if (status === 'inactive') {
    return 'is-inactive';
  }

  if (status === 'expired') {
    return 'is-expired';
  }

  return 'is-no-link';
};

/**
 * Chuẩn hóa text hiển thị số ngày còn hạn của link chia sẻ.
 * @param row Dòng dữ liệu lớp cần hiển thị.
 * @returns Chuỗi còn hạn hoặc placeholder khi không có dữ liệu.
 */
const getRemainingDaysLabel = (row: DashboardClassItem): string => {
  if (row.shareLink.remainingDays === null) {
    return '--';
  }

  if (row.shareLink.remainingDays < 0) {
    return 'Đã quá hạn';
  }

  if (row.shareLink.remainingDays === 0) {
    return 'Hết hạn hôm nay';
  }

  return `${row.shareLink.remainingDays} ngày`;
};

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
  const [actionLoadingClassId, setActionLoadingClassId] = React.useState<string | null>(null);
  const [searchInput, setSearchInput] = React.useState(query.search);
  const isInitialLoading = loading && classes.length === 0 && !generatedAt;

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (searchInput !== query.search) {
        setSearch(searchInput);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [query.search, searchInput, setSearch]);

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

        <div className="dashboard-summary-grid">
          <article className="dashboard-summary-card is-neutral">
            <span>Số lớp phụ trách</span>
            <strong>{summary.classCount}</strong>
          </article>
          <article className="dashboard-summary-card is-neutral">
            <span>Tổng sinh viên</span>
            <strong>{summary.studentCount}</strong>
          </article>
          <article className={`dashboard-summary-card ${summary.validPhotoRate >= 100 ? 'is-good' : 'is-warning'}`}>
            <span>Tỷ lệ ảnh hợp lệ</span>
            <strong>{formatPercent(summary.validPhotoRate)}</strong>
          </article>
          <article className={`dashboard-summary-card ${summary.expiringSoonLinkCount > 0 ? 'is-warning' : 'is-neutral'}`}>
            <span>Link sắp hết hạn (&lt; 3 ngày)</span>
            <strong>{summary.expiringSoonLinkCount}</strong>
          </article>
          <article className={`dashboard-summary-card ${summary.activeLinkCount > 0 ? 'is-good' : 'is-neutral'}`}>
            <span>Link hoạt động</span>
            <strong>{summary.activeLinkCount}</strong>
          </article>
          <article className={`dashboard-summary-card ${summary.inactiveLinkCount > 0 ? 'is-warning' : 'is-neutral'}`}>
            <span>Link đã tắt</span>
            <strong>{summary.inactiveLinkCount}</strong>
          </article>
          <article className={`dashboard-summary-card ${summary.expiredLinkCount > 0 ? 'is-danger' : 'is-neutral'}`}>
            <span>Link hết hạn</span>
            <strong>{summary.expiredLinkCount}</strong>
          </article>
        </div>
      </div>

      <div className="dashboard-table-section">
        <div className="dashboard-section-header">
          <h2>Tiến độ theo từng lớp</h2>
          <p>Lọc, sắp xếp và thao tác nhanh trực tiếp trên danh sách lớp phụ trách.</p>
        </div>

        <div className="dashboard-toolbar">
          <div className="dashboard-search-group">
            <input
              type="search"
              className="form-control"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tìm theo mã lớp hoặc tên lớp"
              aria-label="Tìm theo mã lớp hoặc tên lớp"
            />
          </div>

          <select
            className="form-select"
            value={query.attendanceStatus}
            onChange={(event) => setAttendanceStatus(event.target.value as '' | 'available' | 'no_data')}
          >
            {attendanceFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            className="form-select"
            value={query.shareLinkStatus}
            onChange={(event) => setShareLinkStatus(event.target.value as '' | ShareLinkStatus)}
          >
            {shareLinkFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            className="form-select"
            value={query.sortBy}
            onChange={(event) => setSortBy(event.target.value as DashboardSortBy)}
          >
            {sortByOptions.map((option) => (
              <option key={option.value} value={option.value}>
                Sắp theo: {option.label}
              </option>
            ))}
          </select>

          <select
            className="form-select"
            value={query.sortOrder}
            onChange={(event) => setSortOrder(event.target.value as 'asc' | 'desc')}
          >
            <option value="asc">Tăng dần</option>
            <option value="desc">Giảm dần</option>
          </select>
        </div>

        {loading && <div className="dashboard-loading-note">Đang cập nhật danh sách...</div>}

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
