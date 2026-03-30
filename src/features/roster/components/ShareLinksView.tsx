import React, { useEffect, useMemo, useState } from 'react';
import { Class } from '../../../types';
import { classService, ShareLink } from '../services/classService';

interface ShareLinksViewProps {
  classes: Class[];
}

interface ShareLinkRow {
  classInfo: Class;
  shareLink: ShareLink | null;
}

type ShareStatusFilter = 'all' | 'active' | 'inactive' | 'expired';

const shareStatusOptions: Array<{ value: ShareStatusFilter; label: string }> = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'inactive', label: 'Đã tắt' },
  { value: 'expired', label: 'Hết hạn' },
];

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

const formatDate = (value?: string | null): string => {
  if (!value) {
    return 'Không giới hạn';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('vi-VN');
};

const buildPublicShareUrl = (shareLink: ShareLink | null): string => {
  if (!shareLink?.token) {
    return '';
  }

  return `${window.location.origin}/classes/shared/${shareLink.token}`;
};

const mapApiError = (error: any, fallback: string): string => {
  const status = error?.response?.status;

  if (status === 401) {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  }

  if (status === 404) {
    return 'Không tìm thấy lớp hoặc link chia sẻ.';
  }

  return String(error?.response?.data?.message || error?.message || fallback);
};

const getShareLinkStatus = (shareLink: ShareLink): { key: 'inactive' | 'expired' | 'active'; label: string } => {
  if (!shareLink.isActive) {
    return { key: 'inactive', label: 'Đã tắt' };
  }

  if (shareLink.expiresAt) {
    const expiresAtTime = new Date(shareLink.expiresAt).getTime();
    if (!Number.isNaN(expiresAtTime) && Date.now() > expiresAtTime) {
      return { key: 'expired', label: 'Hết hạn' };
    }
  }

  return { key: 'active', label: 'Đang hoạt động' };
};

function ShareLinksView({ classes }: ShareLinksViewProps) {
  const [rows, setRows] = useState<ShareLinkRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<ShareStatusFilter>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingMap, setActionLoadingMap] = useState<Record<string, boolean>>({});
  const [expiryEditorMap, setExpiryEditorMap] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchShareLinks = async () => {
    if (classes.length === 0) {
      setRows([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await Promise.all(
        classes.map(async (classInfo) => {
          const shareLink = await classService.getShareLink(classInfo.id);
          return { classInfo, shareLink };
        })
      );

      setRows(result);
    } catch (fetchError: any) {
      setError(mapApiError(fetchError, 'Không thể tải danh sách link chia sẻ.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShareLinks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classes.map((item) => item.id).join('|')]);

  const filteredRows = useMemo(() => {
    return [...rows]
      .filter((row) => Boolean(row.shareLink))
      .filter((row) => {
        if (!row.shareLink) {
          return false;
        }

        if (statusFilter === 'all') {
          return true;
        }

        return getShareLinkStatus(row.shareLink).key === statusFilter;
      })
      .sort((a, b) => {
        const aTime = a.shareLink?.createdAt ? new Date(a.shareLink.createdAt).getTime() : 0;
        const bTime = b.shareLink?.createdAt ? new Date(b.shareLink.createdAt).getTime() : 0;
        return bTime - aTime;
      });
  }, [rows, statusFilter]);

  const setActionLoading = (classId: string, value: boolean) => {
    setActionLoadingMap((prev) => ({ ...prev, [classId]: value }));
  };

  const updateRow = (classId: string, shareLink: ShareLink | null) => {
    setRows((prev) => prev.map((row) => (row.classInfo.id === classId ? { ...row, shareLink } : row)));
  };

  const handleToggleLink = async (row: ShareLinkRow) => {
    if (!row.shareLink) {
      return;
    }

    const classId = row.classInfo.id;
    setActionLoading(classId, true);
    setMessage(null);

    try {
      const updated = await classService.updateShareLink(classId, { isActive: !row.shareLink.isActive });
      updateRow(classId, updated);
      setMessage({ type: 'success', text: updated.isActive ? 'Đã bật link.' : 'Đã tắt link.' });
    } catch (toggleError: any) {
      setMessage({ type: 'error', text: mapApiError(toggleError, 'Không thể cập nhật trạng thái link.') });
    } finally {
      setActionLoading(classId, false);
    }
  };

  const handleCopyLink = async (shareLink: ShareLink | null) => {
    const publicUrl = buildPublicShareUrl(shareLink);
    if (!publicUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(publicUrl);
      setMessage({ type: 'success', text: 'Đã sao chép link chia sẻ.' });
    } catch {
      setMessage({ type: 'error', text: 'Không thể sao chép tự động. Vui lòng copy thủ công.' });
    }
  };

  const handleOpenExpiryEditor = (row: ShareLinkRow) => {
    if (!row.shareLink) {
      return;
    }

    setExpiryEditorMap((prev) => ({
      ...prev,
      [row.classInfo.id]: toDateTimeLocalValue(row.shareLink?.expiresAt),
    }));
  };

  const handleCloseExpiryEditor = (classId: string) => {
    setExpiryEditorMap((prev) => {
      const next = { ...prev };
      delete next[classId];
      return next;
    });
  };

  const handleExpiryInputChange = (classId: string, value: string) => {
    setExpiryEditorMap((prev) => ({
      ...prev,
      [classId]: value,
    }));
  };

  const handleSaveExpiry = async (row: ShareLinkRow) => {
    if (!row.shareLink) {
      return;
    }

    const classId = row.classInfo.id;
    const editorValue = expiryEditorMap[classId] ?? '';
    const nextExpiresAt = toIsoFromDateTimeLocal(editorValue);

    if (editorValue.trim() && !nextExpiresAt) {
      setMessage({ type: 'error', text: 'Thời gian hết hạn không hợp lệ.' });
      return;
    }

    setActionLoading(classId, true);
    setMessage(null);

    try {
      const updated = await classService.updateShareLink(classId, { expiresAt: nextExpiresAt });
      updateRow(classId, updated);
      handleCloseExpiryEditor(classId);
      setMessage({ type: 'success', text: 'Đã cập nhật thời gian hết hạn.' });
    } catch (saveError: any) {
      setMessage({ type: 'error', text: mapApiError(saveError, 'Không thể cập nhật hạn sử dụng.') });
    } finally {
      setActionLoading(classId, false);
    }
  };

  const handleDeleteLink = async (row: ShareLinkRow) => {
    if (!row.shareLink) {
      return;
    }

    const classId = row.classInfo.id;
    const confirmed = window.confirm('Bạn chắc chắn muốn xóa link chia sẻ của lớp này?');
    if (!confirmed) {
      return;
    }

    setActionLoading(classId, true);
    setMessage(null);

    try {
      await classService.deleteShareLink(classId);
      updateRow(classId, null);
      handleCloseExpiryEditor(classId);
      setMessage({ type: 'success', text: 'Đã xóa link chia sẻ.' });
    } catch (revokeError: any) {
      setMessage({ type: 'error', text: mapApiError(revokeError, 'Không thể xóa link chia sẻ.') });
    } finally {
      setActionLoading(classId, false);
    }
  };

  if (loading) {
    return (
      <section className="share-links-panel">
        <div className="state-panel">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p>Đang tải danh sách link chia sẻ...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
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
    );
  }

  return (
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

      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} mb-3`} role="alert">
          {message.text}
        </div>
      )}

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
                    className={`btn ${row.shareLink?.isActive ? 'btn-outline-danger' : 'btn-outline-success'}`}
                    onClick={() => handleToggleLink(row)}
                    disabled={isBusy}
                  >
                    {row.shareLink?.isActive ? 'Tắt link' : 'Bật link'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={() => handleDeleteLink(row)}
                    disabled={isBusy}
                  >
                    Xóa link
                  </button>
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

                <div className="share-link-item-meta">
                  Tạo ngày {row.shareLink ? formatDate(row.shareLink.createdAt) : '--'} - Hết hạn {row.shareLink ? formatDate(row.shareLink.expiresAt) : '--'}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default ShareLinksView;
