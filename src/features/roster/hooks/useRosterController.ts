import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getInitialLayout, isAllowedLayout } from '../utils/roster.utils';

interface UseRosterControllerOptions {
  selectedClassId?: string;
  selectClass: (classId: string) => Promise<void>;
}

/**
 * Quản lý trạng thái view/layout và đồng bộ params cho RosterView.
 */
export const useRosterController = ({
  selectedClassId,
  selectClass,
}: UseRosterControllerOptions) => {
  const headerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [layout, setLayout] = useState<number>(() => getInitialLayout(searchParams));

  useEffect(() => {
    const nextLayout = getInitialLayout(searchParams);
    setLayout((currentLayout) => (currentLayout === nextLayout ? currentLayout : nextLayout));
  }, [searchParams]);

  const updateUrlParams = (updates: { layout?: number }) => {
    const params = new URLSearchParams(searchParams);

    if (typeof updates.layout === 'number') {
      params.set('layout', String(updates.layout));
    }

    setSearchParams(params, { replace: true });
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
    const newClassId = event.target.value;

    if (!newClassId) {
      navigate('/classes');
      return;
    }

    await selectClass(newClassId);
    navigate(`/classes/${newClassId}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`);
  };

  const handleOpenClassFromHistory = async (newClassId: string) => {
    if (!newClassId) {
      return;
    }

    await selectClass(newClassId);
    navigate(`/classes/${newClassId}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`);
  };

  const handleLayoutChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextValue = Number(event.target.value);
    const nextLayout = isAllowedLayout(nextValue) ? nextValue : 5;

    setLayout(nextLayout);
    updateUrlParams({ layout: nextLayout });
  };

  return {
    headerRef,
    layout,
    handlePrint,
    handleClassChange,
    handleOpenClassFromHistory,
    handleLayoutChange,
  };
};

export default useRosterController;
