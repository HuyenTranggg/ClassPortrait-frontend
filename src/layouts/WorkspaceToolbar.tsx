import React from 'react';
import { Class } from '../types';

interface WorkspaceToolbarProps {
  selectedClass: Class | null;
  studentsCount: number;
  photosPerRow: number;
  loading: boolean;
  searchQuery: string;
  onLayoutChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPrint: () => void;
}

function WorkspaceToolbar({
  selectedClass,
  studentsCount,
  photosPerRow,
  loading,
  searchQuery,
  onLayoutChange,
  onSearchChange,
  onPrint,
}: WorkspaceToolbarProps) {
  return (
    <section className="workspace-panel">
      <div className="workspace-toolbar">


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

        <button type="button" className="btn btn-accent btn-print" onClick={onPrint}>
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
