import React from 'react';
import { ActiveView } from '../features/roster/types';

interface AppSidebarProps {
  activeView: ActiveView;
  sidebarCollapsed: boolean;
  lecturerDisplayName: string;
  onToggleSidebar: () => void;
  onSetActiveView: (view: ActiveView) => void;
  onLogout: () => void;
}

function AppSidebar({
  activeView,
  sidebarCollapsed,
  lecturerDisplayName,
  onToggleSidebar,
  onSetActiveView,
  onLogout,
}: AppSidebarProps) {
  return (
    <>
      <button
        type="button"
        className="sidebar-edge-toggle no-print"
        onClick={onToggleSidebar}
        aria-expanded={!sidebarCollapsed}
        aria-label={sidebarCollapsed ? 'Hiện sidebar' : 'Ẩn sidebar'}
        title={sidebarCollapsed ? 'Hiện sidebar' : 'Ẩn sidebar'}
      >
        <span
          className={`sidebar-edge-toggle-icon ${sidebarCollapsed ? 'is-collapsed' : ''}`}
          aria-hidden="true"
        />
      </button>

      <aside className="app-sidebar no-print">
        <div className="brand-block">
          <div className="brand-mark">S</div>
          <div>
            <strong>Sổ ảnh</strong>
            <span>Thi sinh dự thi</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            type="button"
            className={`sidebar-link ${activeView === 'roster' ? 'is-active' : ''}`}
            onClick={() => onSetActiveView('roster')}
          >
            <span>Sổ ảnh</span>
            <small>Quản lý danh sách ảnh</small>
          </button>
          <button
            type="button"
            className={`sidebar-link ${activeView === 'history' ? 'is-active' : ''}`}
            onClick={() => onSetActiveView('history')}
          >
            <span>Lịch sử import</span>
            <small>Theo dõi các lần nhập file</small>
          </button>

          <button
            type="button"
            className={`sidebar-link ${activeView === 'share' ? 'is-active' : ''}`}
            onClick={() => onSetActiveView('share')}
          >
            <span>Chia sẻ</span>
            <small>Quản lý link chia sẻ theo từng lớp</small>
          </button>

          <button
            type="button"
            className={`sidebar-link ${activeView === 'dashboard' ? 'is-active' : ''}`}
            onClick={() => onSetActiveView('dashboard')}
          >
            <span>Dashboard</span>
            <small>Tổng hợp nhanh theo lớp phụ trách</small>
          </button>
          
          <button type="button" className="sidebar-link">
            <span>Cài đặt</span>
            <small>Tùy chỉnh layout và in ấn</small>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-avatar" aria-hidden="true">GV</div>
          <div className="sidebar-user-meta">
            <strong>{lecturerDisplayName}</strong>
            <span>Giảng viên</span>
          </div>
          <button type="button" className="sidebar-logout" onClick={onLogout}>Đăng xuất</button>
        </div>
      </aside>
    </>
  );
}

export default AppSidebar;
