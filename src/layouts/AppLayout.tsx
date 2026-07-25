import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import { useAuth } from '../features/auth';
import { getDisplayNameFromEmail } from '../features/roster/utils/roster.utils';

function AppLayout() {
  const { logout, userEmail } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const lecturerDisplayName = getDisplayNameFromEmail(userEmail);

  // Đóng mobile menu khi chuyển route
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Khóa scroll body khi mobile menu mở
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Overlay backdrop cho mobile */}
      {mobileMenuOpen && (
        <div
          className="mobile-sidebar-overlay"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <AppSidebar
        sidebarCollapsed={sidebarCollapsed}
        lecturerDisplayName={lecturerDisplayName}
        onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
        onLogout={logout}
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
      />

      <main className="app-main">
        {/* Hamburger button chỉ hiện trên mobile */}
        <button
          type="button"
          className="mobile-nav-toggle no-print"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Mở menu"
        >
          <span className="mobile-nav-toggle-bar" />
          <span className="mobile-nav-toggle-bar" />
          <span className="mobile-nav-toggle-bar" />
        </button>

        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
