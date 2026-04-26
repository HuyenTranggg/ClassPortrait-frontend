import React, { useEffect, useState } from 'react';
import { DashboardSortBy, ShareLinkStatus } from '../types';

interface DashboardToolbarProps {
  search: string;
  attendanceStatus: string;
  shareLinkStatus: string;
  sortBy: string;
  sortOrder: string;
  setSearch: (value: string) => void;
  setAttendanceStatus: (value: '' | 'available' | 'no_data') => void;
  setShareLinkStatus: (value: '' | ShareLinkStatus) => void;
  setSortBy: (value: DashboardSortBy) => void;
  setSortOrder: (value: 'asc' | 'desc') => void;
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

function DashboardToolbar({
  search,
  attendanceStatus,
  shareLinkStatus,
  sortBy,
  sortOrder,
  setSearch,
  setAttendanceStatus,
  setShareLinkStatus,
  setSortBy,
  setSortOrder,
}: DashboardToolbarProps) {
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (searchInput !== search) {
        setSearch(searchInput);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [search, searchInput, setSearch]);

  return (
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
        value={attendanceStatus}
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
        value={shareLinkStatus}
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
        value={sortBy}
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
        value={sortOrder}
        onChange={(event) => setSortOrder(event.target.value as 'asc' | 'desc')}
      >
        <option value="asc">Tăng dần</option>
        <option value="desc">Giảm dần</option>
      </select>
    </div>
  );
}

export default DashboardToolbar;
