import React, { useEffect, useRef, useState } from 'react';
import ImportHistoryView from './ImportHistoryView';
import ShareLinksView from './ShareLinksView';
import { useClasses, usePagination } from '../hooks';
import { useAuth } from '../../auth';
import AppSidebar from './app-shell/AppSidebar';
import ShellHeader from './app-shell/ShellHeader';
import WorkspaceToolbar from './app-shell/WorkspaceToolbar';
import RosterBody from './app-shell/RosterBody';
import { buildPrintMeta, buildRosterMeta, getDisplayNameFromEmail, getInitialLayout, isAllowedLayout } from './app-shell/utils';
import ShareLinkModal from './share/ShareLinkModal';

function AppShell() {
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState<'roster' | 'history' | 'share'>('roster');
  const [layout, setLayout] = useState<number>(getInitialLayout);
  const [isShareModalOpen, setShareModalOpen] = useState(false);
  const { logout, userEmail } = useAuth();
  const { classes, selectedClass, students, loading, error, selectClass, refetchClasses } = useClasses();
    const handleImportSuccess = async (importedClassId?: string) => {
      await refetchClasses(importedClassId);
    };

  const { photosPerRow } = usePagination(students, layout);

  const updateUrlParams = (updates: { layout?: number; classId?: string }) => {
    const params = new URLSearchParams(window.location.search);

    if (typeof updates.layout === 'number') {
      params.set('layout', String(updates.layout));
    }

    if (updates.classId) {
      params.set('classId', updates.classId);
    }

    const query = params.toString();
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState(null, '', nextUrl);
  };

  useEffect(() => {
    document.body.setAttribute('data-layout', photosPerRow.toString());

    return () => {
      document.body.removeAttribute('data-layout');
    };
  }, [photosPerRow]);

  useEffect(() => {
    const updateHeaderHeight = () => {
      const headerHeight = headerRef.current?.offsetHeight || 0;
      document.documentElement.style.setProperty('--shell-header-height', `${headerHeight}px`);
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);

    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleClassChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const classId = event.target.value;

    if (classId) {
      selectClass(classId);
      updateUrlParams({ classId });
    }
  };

  const handleOpenClassFromHistory = async (classId: string) => {
    if (!classId) {
      return;
    }

    await selectClass(classId);
    updateUrlParams({ classId });
    setActiveView('roster');
  };

  const handleLayoutChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextValue = Number(event.target.value);
    const nextLayout = isAllowedLayout(nextValue) ? nextValue : 4;

    setLayout(nextLayout);
    updateUrlParams({ layout: nextLayout, classId: selectedClass?.id });
  };

  const lecturerDisplayName = getDisplayNameFromEmail(userEmail);
  const rosterMeta = buildRosterMeta(selectedClass, students);
  const printMeta = buildPrintMeta(selectedClass, students);

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <AppSidebar
        activeView={activeView}
        sidebarCollapsed={sidebarCollapsed}
        lecturerDisplayName={lecturerDisplayName}
        onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
        onSetActiveView={setActiveView}
        onLogout={logout}
      />

      <main className="app-main">
        <div className="sticky-controls no-print" ref={headerRef}>
          <ShellHeader
            activeView={activeView}
            selectedClassExists={Boolean(selectedClass)}
            rosterMeta={rosterMeta}
            onOpenShare={() => setShareModalOpen(true)}
            onImportSuccess={handleImportSuccess}
          />

          {activeView === 'roster' && (
            <WorkspaceToolbar
              selectedClass={selectedClass}
              classes={classes}
              studentsCount={students.length}
              photosPerRow={photosPerRow}
              loading={loading}
              onClassChange={handleClassChange}
              onLayoutChange={handleLayoutChange}
              onPrint={handlePrint}
            />
          )}
        </div>

        {activeView === 'roster' && (
          <RosterBody
            loading={loading}
            error={error}
            students={students}
            printMeta={printMeta}
          />
        )}

        {activeView === 'history' && <ImportHistoryView onOpenClass={handleOpenClassFromHistory} />}
        {activeView === 'share' && <ShareLinksView classes={classes} />}
      </main>

      <ShareLinkModal
        isOpen={isShareModalOpen}
        selectedClass={selectedClass}
        onClose={() => setShareModalOpen(false)}
      />
    </div>
  );
}

export default AppShell;
