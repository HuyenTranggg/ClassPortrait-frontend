import React from 'react';
import { Class } from '../types';
import { getClassDisplayName } from '../features/roster/utils/roster.utils';

interface WorkspaceToolbarProps {
  selectedClass: Class | null;
  classes: Class[];
  studentsCount: number;
  photosPerRow: number;
  loading: boolean;
  searchQuery: string;
  onClassChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onLayoutChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPrint: () => void;
}

function WorkspaceToolbar({
  selectedClass,
  classes,
  studentsCount,
  photosPerRow,
  loading,
  searchQuery,
  onClassChange,
  onLayoutChange,
  onSearchChange,
  onPrint,
}: WorkspaceToolbarProps) {
  return (
    <section className="workspace-panel">
      <div className="workspace-toolbar">
        <select
          className="form-select"
          value={selectedClass?.id || ''}
          onChange={onClassChange}
          disabled={loading || classes.length === 0}
        >
          {classes.length === 0 ? (
            <option value="">Chưa có lớp</option>
          ) : (
            classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {getClassDisplayName(cls)}
              </option>
            ))
          )}
        </select>

        <select
          className="form-select layout-select"
          value={String(photosPerRow)}
          onChange={onLayoutChange}
          aria-label="Chọn layout"
        >
          <option value="4">Lưới 4 cột</option>
          <option value="5">Lưới 5 cột</option>
          <option value="6">Lưới 6 cột</option>
        </select>

        <button type="button" className="btn btn-primary btn-print" onClick={onPrint}>
          In sổ ảnh
        </button>

        <input
          type="search"
          className="form-control workspace-search-input"
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Tìm MSSV hoặc tên"
          aria-label="Tìm sinh viên theo MSSV hoặc tên"
        />

        <span className="workspace-student-count">{studentsCount} sinh viên</span>
      </div>
    </section>
  );
}

export default WorkspaceToolbar;
