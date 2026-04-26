import React from 'react';
import { formatPercent } from '../utils/dashboardHelpers';

interface DashboardSummaryGridProps {
  summary: {
    classCount: number;
    studentCount: number;
    validPhotoRate: number;
    expiringSoonLinkCount: number;
    activeLinkCount: number;
    inactiveLinkCount: number;
    expiredLinkCount: number;
  };
}

function DashboardSummaryGrid({ summary }: DashboardSummaryGridProps) {
  return (
    <div className="dashboard-summary-grid">
      <article className="dashboard-summary-card is-neutral">
        <span>Số lớp phụ trách</span>
        <strong>{summary.classCount}</strong>
      </article>
      <article className="dashboard-summary-card is-neutral">
        <span>Tổng sinh viên</span>
        <strong>{summary.studentCount}</strong>
      </article>
      <article className={`dashboard-summary-card ${summary.validPhotoRate >= 100 ? 'is-good' : 'is-warning'}`}>
        <span>Tỷ lệ ảnh hợp lệ</span>
        <strong>{formatPercent(summary.validPhotoRate)}</strong>
      </article>
      <article className={`dashboard-summary-card ${summary.expiringSoonLinkCount > 0 ? 'is-warning' : 'is-neutral'}`}>
        <span>Link sắp hết hạn (&lt; 3 ngày)</span>
        <strong>{summary.expiringSoonLinkCount}</strong>
      </article>
      <article className={`dashboard-summary-card ${summary.activeLinkCount > 0 ? 'is-good' : 'is-neutral'}`}>
        <span>Link hoạt động</span>
        <strong>{summary.activeLinkCount}</strong>
      </article>
      <article className={`dashboard-summary-card ${summary.inactiveLinkCount > 0 ? 'is-warning' : 'is-neutral'}`}>
        <span>Link đã tắt</span>
        <strong>{summary.inactiveLinkCount}</strong>
      </article>
      <article className={`dashboard-summary-card ${summary.expiredLinkCount > 0 ? 'is-danger' : 'is-neutral'}`}>
        <span>Link hết hạn</span>
        <strong>{summary.expiredLinkCount}</strong>
      </article>
    </div>
  );
}

export default DashboardSummaryGrid;
