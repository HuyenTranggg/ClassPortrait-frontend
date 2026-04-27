import { useEffect, useRef, useState } from 'react';
import { getInitialLayout, isAllowedLayout } from '../utils/roster.utils';

interface UseRosterControllerOptions {
  selectedClassId?: string;
  selectClass: (classId: string) => Promise<void>;
}

/**
 * Quản lý trạng thái view/layout/sidebar và đồng bộ query params cho AppShell.
 */
export const useRosterController = ({
  selectedClassId,
  selectClass,
}: UseRosterControllerOptions) => {
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [layout, setLayout] = useState<number>(getInitialLayout);

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

  const handleClassChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const classId = event.target.value;

    if (!classId) {
      return;
    }

    await selectClass(classId);
    updateUrlParams({ classId });
  };

  const handleOpenClassFromHistory = async (classId: string) => {
    if (!classId) {
      return;
    }

    await selectClass(classId);
    updateUrlParams({ classId });
  };

  const handleLayoutChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextValue = Number(event.target.value);
    const nextLayout = isAllowedLayout(nextValue) ? nextValue : 5;

    setLayout(nextLayout);
    updateUrlParams({ layout: nextLayout, classId: selectedClassId });
  };

  return {
    headerRef,
    sidebarCollapsed,
    layout,
    setSidebarCollapsed,
    handlePrint,
    handleClassChange,
    handleOpenClassFromHistory,
    handleLayoutChange,
  };
};

export default useRosterController;
