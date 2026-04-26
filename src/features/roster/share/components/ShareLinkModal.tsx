import React from 'react';
import { Class } from '../../../../types';
import AppToast from '../../../../components/AppToast';
import { formatDateTime } from '../utils/shareHelpers';
import { useShareLinkModalController } from '../hooks/useShareLinkModalController';

interface ShareLinkModalProps {
  isOpen: boolean;
  selectedClass: Class | null;
  onClose: () => void;
}

function ShareLinkModal({ isOpen, selectedClass, onClose }: ShareLinkModalProps) {
  const {
    loading,
    submitting,
    shareLink,
    expiresInDays,
    expiresAtInput,
    requireLogin,
    message,
    classLabel,
    publicShareUrl,
    shareStatus,
    setExpiresInDays,
    setExpiresAtInput,
    setRequireLogin,
    setMessage,
    handleCreateShareLink,
    handleToggleActive,
    handleToggleRequireLogin,
    handleSaveExpiry,
    handleDeleteLink,
    handleCopyLink,
  } = useShareLinkModalController({ isOpen, selectedClass });

  if (!isOpen) {
    return null;
  }

  return (
    <div className="share-modal-backdrop" role="presentation" onClick={!submitting ? onClose : undefined}>
      <div
        className={`share-modal-card ${shareLink ? 'is-manage-mode' : 'is-setup-mode'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          disabled={submitting}
          aria-label="Đóng"
        >
          ×
        </button>

        <div className="share-modal-head">
          <h2 id="share-modal-title">Chia sẻ sổ ảnh</h2>
          <p className="share-subtitle">Thiết lập và quản lý link chia sẻ cho lớp học</p>
        </div>

        {loading ? (
          <div className="state-panel mt-3">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
            <p>Đang tải thông tin chia sẻ...</p>
          </div>
        ) : (
          <>
            {!shareLink ? (
              <>
                <section className="share-class-card">
                  <div className="share-block-label">LỚP HỌC</div>
                  <div className="share-class-value">{classLabel || 'Chưa chọn lớp'}</div>
                </section>

                <section className="share-setup-card">
                  <label htmlFor="share-expire-days" className="share-field-label">Số ngày hiệu lực</label>
                  <input
                    id="share-expire-days"
                    type="number"
                    min={1}
                    className="form-control"
                    value={expiresInDays}
                    onChange={(event) => setExpiresInDays(event.target.value)}
                    disabled={submitting}
                  />
                  <small className="share-hint">Để trống nếu muốn link không có thời hạn.</small>

                  <div className="share-field-label mt-3">Chế độ truy cập</div>
                  <div className="share-access-options" role="radiogroup" aria-label="Chế độ truy cập">
                    <label className={`share-access-option ${!requireLogin ? 'is-selected' : ''}`}>
                      <input
                        type="radio"
                        name="share-require-login"
                        value="public"
                        checked={!requireLogin}
                        onChange={() => setRequireLogin(false)}
                        disabled={submitting}
                      />
                      <span className="share-access-text">
                        <strong>Công khai</strong>
                        <small>Ai có link đều xem được</small>
                      </span>
                    </label>
                    <label className={`share-access-option ${requireLogin ? 'is-selected' : ''}`}>
                      <input
                        type="radio"
                        name="share-require-login"
                        value="login"
                        checked={requireLogin}
                        onChange={() => setRequireLogin(true)}
                        disabled={submitting}
                      />
                      <span className="share-access-text">
                        <strong>Yêu cầu đăng nhập</strong>
                        <small>Chỉ tài khoản HUST mới xem được</small>
                      </span>
                    </label>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary share-create-btn"
                    onClick={handleCreateShareLink}
                    disabled={submitting || !selectedClass?.id}
                  >
                    {submitting ? 'Đang tạo...' : 'Tạo link chia sẻ'}
                  </button>
                </section>
              </>
            ) : (
              <>
                <section className="share-class-card is-with-status">
                  <div>
                    <div className="share-block-label">LỚP HỌC</div>
                    <div className="share-class-value">{classLabel || 'Chưa chọn lớp'}</div>
                  </div>
                  <span className={`share-status-pill ${shareStatus ? `is-${shareStatus.key}` : 'is-inactive'}`}>
                    {shareStatus?.label || 'Link đã tắt'}
                  </span>
                </section>

                <section className="share-section-card">
                  <div className="share-section-title">LINK CHIA SẺ</div>
                  <div className="share-url-row">
                    <input id="share-url" className="form-control" value={publicShareUrl} readOnly />
                    <button type="button" className="btn btn-outline-secondary" onClick={handleCopyLink}>
                      Sao chép
                    </button>
                    <a className="btn btn-outline-primary" href={publicShareUrl} target="_blank" rel="noreferrer">
                      Mở link
                    </a>
                  </div>
                </section>

                <section className="share-section-card">
                  <div className="share-section-head share-access-head">
                    <div className="share-access-head-left">
                      <div className="share-section-title" style={{ margin: 0 }}>CHẾ ĐỘ TRUY CẬP</div>
                      <div className={`share-access-badge ${shareLink.requireLogin ? 'is-locked' : 'is-public'}`}>
                        {shareLink.requireLogin ? 'Yêu cầu đăng nhập HUST' : 'Công khai'}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={handleToggleRequireLogin}
                      disabled={submitting}
                    >
                      {shareLink.requireLogin ? 'Đổi sang Công khai' : 'Đổi sang Yêu cầu đăng nhập'}
                    </button>
                  </div>
                </section>

                <section className="share-section-card">
                  <div className="share-section-head">
                    <div className="share-section-title">HẠN SỬ DỤNG</div>
                    <div className="share-current-expiry">Hiện tại: {formatDateTime(shareLink.expiresAt)}</div>
                  </div>

                  <div className="share-expiry-row">
                    <input
                      id="share-expires-at"
                      type="datetime-local"
                      className="form-control"
                      value={expiresAtInput}
                      onChange={(event) => setExpiresAtInput(event.target.value)}
                      disabled={submitting}
                    />

                    <button
                      type="button"
                      className="btn btn-outline-secondary share-save-btn"
                      onClick={handleSaveExpiry}
                      disabled={submitting}
                    >
                      Lưu
                    </button>
                  </div>
                </section>

                <section className="share-footer-row">
                  <small className="text-muted d-block share-created-at">
                    Tạo lúc: {formatDateTime(shareLink.createdAt)}
                  </small>

                  <div className="share-actions">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={handleToggleActive}
                      disabled={submitting}
                    >
                      {shareLink.isActive ? 'Tắt link' : 'Bật link'}
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      onClick={handleDeleteLink}
                      disabled={submitting}
                    >
                      Xóa link
                    </button>
                  </div>
                </section>
              </>
            )}
          </>
        )}

        <AppToast message={message} onClose={() => setMessage(null)} />
      </div>
    </div>
  );
}

export default ShareLinkModal;
