import React, { useEffect, useMemo, useState } from 'react';
import { Class } from '../../../../types';
import {
  classService,
  CreateShareLinkPayload,
  ShareLink,
  UpdateShareLinkPayload,
} from '../../services/classService';

interface ShareLinkModalProps {
  isOpen: boolean;
  selectedClass: Class | null;
  onClose: () => void;
}

const formatDateTime = (value?: string | null): string => {
  if (!value) {
    return 'Không có';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('vi-VN');
};

const toDateTimeLocalValue = (value?: string | null): string => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const tzOffset = date.getTimezoneOffset() * 60000;
  const localTime = new Date(date.getTime() - tzOffset);

  return localTime.toISOString().slice(0, 16);
};

const toIsoFromDateTimeLocal = (value: string): string | null => {
  if (!value.trim()) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
};

const mapApiError = (error: any, fallback: string): string => {
  const status = error?.response?.status;

  if (status === 400) {
    return 'Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại.';
  }

  if (status === 401) {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  }

  if (status === 403) {
    return 'Bạn không có quyền thực hiện thao tác này.';
  }

  if (status === 404) {
    return 'Không tìm thấy lớp hoặc link chia sẻ.';
  }

  if (status === 409) {
    return 'Lớp đã tồn tại link chia sẻ. Đang tải lại dữ liệu hiện tại.';
  }

  return String(error?.response?.data?.message || error?.message || fallback);
};

const getShareLinkStatus = (shareLink: ShareLink): { key: 'inactive' | 'expired' | 'active'; label: string } => {
  if (!shareLink.isActive) {
    return { key: 'inactive', label: 'Link đã tắt' };
  }

  if (shareLink.expiresAt) {
    const expiresAtTime = new Date(shareLink.expiresAt).getTime();
    if (!Number.isNaN(expiresAtTime) && Date.now() > expiresAtTime) {
      return { key: 'expired', label: 'Link hết hạn' };
    }
  }

  return { key: 'active', label: 'Link đang hoạt động' };
};

function ShareLinkModal({ isOpen, selectedClass, onClose }: ShareLinkModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [expiresInDays, setExpiresInDays] = useState('7');
  const [expiresAtInput, setExpiresAtInput] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const classLabel = useMemo(() => {
    if (!selectedClass) {
      return '';
    }

    return [selectedClass.classCode, selectedClass.courseCode, selectedClass.courseName]
      .filter(Boolean)
      .join(' - ');
  }, [selectedClass]);

  const publicShareUrl = useMemo(() => {
    if (!shareLink?.shareUrl) {
      return '';
    }

    try {
      const parsed = new URL(shareLink.shareUrl);
      return `${window.location.origin}${parsed.pathname}${parsed.search}`;
    } catch {
      return shareLink.shareUrl;
    }
  }, [shareLink?.shareUrl]);

  const shareStatus = useMemo(() => {
    if (!shareLink) {
      return null;
    }

    return getShareLinkStatus(shareLink);
  }, [shareLink]);

  const fetchShareLink = async () => {
    if (!selectedClass?.id) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const data = await classService.getShareLink(selectedClass.id);
      setShareLink(data);
      setExpiresAtInput(toDateTimeLocalValue(data?.expiresAt));
    } catch (error: any) {
      setMessage({ type: 'error', text: mapApiError(error, 'Không thể tải thông tin link chia sẻ.') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    fetchShareLink();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedClass?.id]);

  useEffect(() => {
    if (!isOpen) {
      setShareLink(null);
      setExpiresInDays('7');
      setExpiresAtInput('');
      setMessage(null);
      setLoading(false);
      setSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleCreateShareLink = async () => {
    if (!selectedClass?.id) {
      return;
    }

    const parsedDays = Number(expiresInDays);
    const payload: CreateShareLinkPayload = {};

    if (expiresInDays.trim()) {
      if (!Number.isInteger(parsedDays) || parsedDays < 1) {
        setMessage({ type: 'error', text: 'Số ngày hết hạn phải là số nguyên >= 1.' });
        return;
      }

      payload.expiresInDays = parsedDays;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const result = await classService.createShareLink(selectedClass.id, payload);
      setShareLink(result);
      setExpiresAtInput(toDateTimeLocalValue(result.expiresAt));
      setMessage({ type: 'success', text: 'Tạo link chia sẻ thành công.' });
    } catch (error: any) {
      const errorMessage = mapApiError(error, 'Không thể tạo link chia sẻ.');
      setMessage({ type: 'error', text: errorMessage });

      if (error?.response?.status === 409) {
        await fetchShareLink();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async () => {
    if (!selectedClass?.id || !shareLink) {
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const payload: UpdateShareLinkPayload = {
      isActive: !shareLink.isActive,
    };

    try {
      const result = await classService.updateShareLink(selectedClass.id, payload);
      setShareLink(result);
      setMessage({
        type: 'success',
        text: result.isActive ? 'Đã bật link chia sẻ.' : 'Đã tắt link chia sẻ.',
      });
    } catch (error: any) {
      setMessage({ type: 'error', text: mapApiError(error, 'Không thể cập nhật trạng thái link.') });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveExpiry = async () => {
    if (!selectedClass?.id || !shareLink) {
      return;
    }

    const nextExpiresAt = toIsoFromDateTimeLocal(expiresAtInput);

    if (expiresAtInput.trim() && !nextExpiresAt) {
      setMessage({ type: 'error', text: 'Thời gian hết hạn không hợp lệ.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const payload: UpdateShareLinkPayload = {
      expiresAt: nextExpiresAt,
    };

    try {
      const result = await classService.updateShareLink(selectedClass.id, payload);
      setShareLink(result);
      setExpiresAtInput(toDateTimeLocalValue(result.expiresAt));
      setMessage({ type: 'success', text: 'Đã cập nhật thời gian hết hạn.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: mapApiError(error, 'Không thể cập nhật hạn sử dụng link.') });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLink = async () => {
    if (!selectedClass?.id || !shareLink) {
      return;
    }

    const confirmed = window.confirm('Bạn chắc chắn muốn xóa link chia sẻ này?');
    if (!confirmed) {
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      await classService.deleteShareLink(selectedClass.id);
      setShareLink(null);
      setExpiresAtInput('');
      setMessage({ type: 'success', text: 'Đã xóa link chia sẻ.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: mapApiError(error, 'Không thể xóa link chia sẻ.') });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    if (!publicShareUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(publicShareUrl);
      setMessage({ type: 'success', text: 'Đã sao chép link vào clipboard.' });
    } catch {
      setMessage({ type: 'error', text: 'Không thể sao chép tự động. Vui lòng copy thủ công.' });
    }
  };

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

        {message && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} mt-3 mb-0`} role="alert">
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}

export default ShareLinkModal;
