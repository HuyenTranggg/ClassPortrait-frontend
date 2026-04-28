import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import { useAuth } from '../features/auth';
import { getDisplayNameFromEmail } from '../features/roster/utils/roster.utils';

function AppLayout() {
  const { logout, userEmail } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const lecturerDisplayName = getDisplayNameFromEmail(userEmail);

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <AppSidebar
        sidebarCollapsed={sidebarCollapsed}
        lecturerDisplayName={lecturerDisplayName}
        onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
        onLogout={logout}
      />

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
