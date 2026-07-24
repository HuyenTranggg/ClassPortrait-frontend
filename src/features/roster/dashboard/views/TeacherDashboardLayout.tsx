import React from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';
import useTeacherDashboard from '../hooks/useTeacherDashboard';
import ShellHeader from '../../../../layouts/ShellHeader';

type DashboardContextType = ReturnType<typeof useTeacherDashboard>;

export function useDashboardContext() {
  return useOutletContext<DashboardContextType>();
}

export interface DashSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
}

export function DashSection({ title, subtitle, children, className = '', headerAction }: DashSectionProps) {
  return (
    <section className={`dash-section ${className}`}>
      <div className="dash-section-header d-flex justify-content-between align-items-center">
        <div>
          <h2 className="dash-section-title">{title}</h2>
          {subtitle && <p className="dash-section-subtitle">{subtitle}</p>}
        </div>
        {headerAction && <div>{headerAction}</div>}
      </div>
      {children}
    </section>
  );
}

export function DashPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="dash-panel">
      <h3 className="dash-panel-title">{title}</h3>
      <div className="dash-panel-body">{children}</div>
    </div>
  );
}

function TeacherDashboardLayout() {
  const dashboardData = useTeacherDashboard();
  const { generatedAt, loading, error, refetch } = dashboardData;

  const isInitialLoading = loading && !generatedAt;

  if (isInitialLoading) {
    return (
      <>
        <div className="sticky-controls no-print">
          <ShellHeader activeView="dashboard" />
        </div>
        <div className="dash-page">
          <div className="dash-loading-state">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
            <p>Đang tải dữ liệu dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="sticky-controls no-print">
          <ShellHeader activeView="dashboard" />
        </div>
        <div className="dash-page">
          <div className="alert alert-danger d-flex align-items-center gap-3" role="alert">
            <span>⚠️</span>
            <div>
              <strong>Lỗi tải dữ liệu!</strong> {error}
              <div className="mt-2">
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={refetch}>
                  Thử lại
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="sticky-controls no-print">
        <ShellHeader activeView="dashboard" />
      </div>
      <div className="dash-page">
        <Outlet context={dashboardData} />
      </div>
    </>
  );
}

export default TeacherDashboardLayout;
