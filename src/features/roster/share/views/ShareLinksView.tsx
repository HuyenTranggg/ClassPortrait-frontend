import React from 'react';
import { ShareLink } from '../../services/class.service';
import AppToast from '../../../../components/AppToast';
import {
  buildPublicShareUrl,
  formatDateTime,
  getShareLinkStatus,
} from '../utils/shareHelpers';
import { ShareStatusFilter, useShareLinksController } from '../hooks/useShareLinksController';
import { useClasses } from '../../hooks/useClasses';
import ShellHeader from '../../../../layouts/ShellHeader';

const shareStatusOptions: Array<{ value: ShareStatusFilter; label: string }> = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'inactive', label: 'Đã tắt' },
  { value: 'expired', label: 'Hết hạn' },
];

const formatDate = (value?: string | null): string => {
  if (!value) {
    return 'Không giới hạn';
  }

  return formatDateTime(value, value);
};

function ShareLinksView() {
  const { classes } = useClasses({ enabled: true });
  
  const {
    filteredRows,
    statusFilter,
    loading,
    error,
    actionLoadingMap,
    expiryEditorMap,
    message,
    setStatusFilter,
    setMessage,
    fetchShareLinks,
    handleToggleLink,
    handleToggleRequireLogin,
    handleCopySuccess,
    handleCopyFailure,
    handleOpenExpiryEditor,
    handleCloseExpiryEditor,
    handleExpiryInputChange,
    handleSaveExpiry,
    handleDeleteLink,
  } = useShareLinksController({ classes });

  const handleCopyLink = async (shareLink: ShareLink | null) => {
    const publicUrl = buildPublicShareUrl(shareLink);
    if (!publicUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(publicUrl);
      handleCopySuccess();
    } catch {
      handleCopyFailure();
    }
  };

  if (loading) {
    return (
      <>
        <div className="sticky-controls no-print">
          <ShellHeader activeView="share" />
        </div>
        <section className="share-links-panel">
          <div className="state-panel">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
            <p>Đang tải danh sách link chia sẻ...</p>
          </div>
        </section>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="sticky-controls no-print">
          <ShellHeader activeView="share" />
        </div>
        <section className="share-links-panel">
          <div className="alert alert-danger" role="alert">
            <strong>Lỗi!</strong> {error}
            <div className="mt-2">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={fetchShareLinks}>
                Thử lại
              </button>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <div className="sticky-controls no-print">
        <ShellHeader activeView="share" />
      </div>
      <section className="share-links-panel">
      <div className="share-links-toolbar">
        <div className="share-toolbar-right">
          <div className="share-filter-group">
            <select
              className="form-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ShareStatusFilter)}
            >
              {shareStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <span className="share-links-total">{filteredRows.length} lớp</span>
        </div>
      </div>

          {filteredRows.length === 0 ? (
            <div className="empty-state-card">
              <h2>Không có link phù hợp bộ lọc</h2>
              <p>{statusFilter === 'all' ? 'Hiện chưa có lớp nào được tạo link chia sẻ.' : 'Hãy đổi bộ lọc để xem trạng thái link khác.'}</p>
            </div>
          ) : (
            <div className="share-link-list">
              {filteredRows.map((row) => {
                const classId = row.classInfo.id;
                const publicUrl = buildPublicShareUrl(row.shareLink);
                const isBusy = Boolean(actionLoadingMap[classId]);
                const isEditingExpiry = Object.prototype.hasOwnProperty.call(expiryEditorMap, classId);
                const expiryEditorValue = expiryEditorMap[classId] ?? '';
                const status = row.shareLink ? getShareLinkStatus(row.shareLink) : null;

                return (
                  <article className="share-link-item" key={classId}>
                    <div className="share-link-item-head">
                      <div className="share-link-class-name">
                        {row.classInfo.classCode} - {row.classInfo.courseName || row.classInfo.courseCode || 'Chưa có tên học phần'}
                      </div>

                      <span className={`share-link-status ${status ? `is-${status.key}` : 'is-inactive'}`}>
                        {status?.label || 'Đã tắt'}
                      </span>
                    </div>

                    <div className="share-link-item-body">
                      <div className="share-link-row-top">
                        <input
                          className="form-control share-link-url"
                          value={publicUrl}
                          readOnly
                          disabled
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => handleCopyLink(row.shareLink)}
                          disabled={isBusy}
                        >
                          Sao chép
                        </button>
                      </div>

                      <div className="share-link-row-bottom">
                        <div className="share-link-actions">
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => handleOpenExpiryEditor(row)}
                            disabled={isBusy}
                          >
                            Đổi hạn
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => handleToggleRequireLogin(row)}
                            disabled={isBusy}
                            title={row.shareLink?.requireLogin ? 'Đang yêu cầu đăng nhập – nhấn để đổi sang công khai' : 'Đang công khai – nhấn để yêu cầu đăng nhập'}
                          >
                            {row.shareLink?.requireLogin ? 'Bỏ yêu cầu đăng nhập' : 'Yêu cầu đăng nhập'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => handleToggleLink(row)}
                            disabled={isBusy}
                          >
                            {row.shareLink?.isActive ? 'Tắt link' : 'Bật link'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => handleDeleteLink(row)}
                            disabled={isBusy}
                          >
                            Xóa
                          </button>
                        </div>

                        <div className="share-link-item-meta">
                          Tạo {row.shareLink ? formatDate(row.shareLink.createdAt) : '--'} · Hết hạn {row.shareLink ? formatDate(row.shareLink.expiresAt) : '--'}
                        </div>
                      </div>
                    </div>

                    {isEditingExpiry && (
                      <div className="share-link-expiry-editor">
                        <input
                          type="datetime-local"
                          className="form-control"
                          value={expiryEditorValue}
                          onChange={(event) => handleExpiryInputChange(classId, event.target.value)}
                          disabled={isBusy}
                        />

                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          onClick={() => handleSaveExpiry(row)}
                          disabled={isBusy}
                        >
                          Lưu hạn
                        </button>

                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => handleCloseExpiryEditor(classId)}
                          disabled={isBusy}
                        >
                          Hủy
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          <AppToast message={message} onClose={() => setMessage(null)} />
        </section>
      </>
  );
}

export default ShareLinksView;
