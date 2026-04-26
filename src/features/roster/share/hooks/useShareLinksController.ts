import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Class } from '../../../../types';
import { classService, ShareLink } from '../../services/class.service';
import {
  getShareLinkStatus,
  mapShareApiError,
  toDateTimeLocalValue,
  toIsoFromDateTimeLocal,
} from '../utils/shareHelpers';
import { useAutoDismissMessage } from '../../../../hooks/useAutoDismissMessage';

export interface ShareLinkRow {
  classInfo: Class;
  shareLink: ShareLink | null;
}

export type ShareStatusFilter = 'all' | 'active' | 'inactive' | 'expired';

interface AppMessage {
  type: 'success' | 'error';
  text: string;
}

interface UseShareLinksControllerOptions {
  classes: Class[];
}

/**
 * Controller quản lý dữ liệu, bộ lọc và thao tác API cho màn danh sách link chia sẻ.
 */
export const useShareLinksController = ({ classes }: UseShareLinksControllerOptions) => {
  const [rows, setRows] = useState<ShareLinkRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<ShareStatusFilter>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingMap, setActionLoadingMap] = useState<Record<string, boolean>>({});
  const [expiryEditorMap, setExpiryEditorMap] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<AppMessage | null>(null);
  const classesRef = useRef<Class[]>(classes);

  const classIdsKey = useMemo(() => {
    return classes.map((item) => item.id).join('|');
  }, [classes]);

  useEffect(() => {
    classesRef.current = classes;
  }, [classes]);

  const fetchShareLinks = useCallback(async () => {
    const activeClasses = classesRef.current;

    if (activeClasses.length === 0) {
      setRows([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await Promise.all(
        activeClasses.map(async (classInfo) => {
          const shareLink = await classService.getShareLink(classInfo.id);
          return { classInfo, shareLink };
        })
      );

      setRows(result);
    } catch (fetchError: any) {
      setError(mapShareApiError(fetchError, 'Không thể tải danh sách link chia sẻ.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShareLinks();
  }, [classIdsKey, fetchShareLinks]);

  useAutoDismissMessage(message, () => setMessage(null));

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
      setMessage({ type: 'error', text: mapShareApiError(toggleError, 'Không thể cập nhật trạng thái link.') });
    } finally {
      setActionLoading(classId, false);
    }
  };

  /**
   * Chuyển đổi chế độ yêu cầu đăng nhập của link chia sẻ.
   * @param row Bản ghi chứa thông tin lớp và link chia sẻ hiện tại.
   */
  const handleToggleRequireLogin = async (row: ShareLinkRow) => {
    if (!row.shareLink) {
      return;
    }

    const classId = row.classInfo.id;
    setActionLoading(classId, true);
    setMessage(null);

    try {
      const updated = await classService.updateShareLink(classId, { requireLogin: !row.shareLink.requireLogin });
      updateRow(classId, updated);
      setMessage({
        type: 'success',
        text: updated.requireLogin ? 'Đã bật yêu cầu đăng nhập.' : 'Đã tắt yêu cầu đăng nhập.',
      });
    } catch (toggleError: any) {
      setMessage({ type: 'error', text: mapShareApiError(toggleError, 'Không thể cập nhật chế độ truy cập.') });
    } finally {
      setActionLoading(classId, false);
    }
  };

  const handleCopySuccess = () => {
    setMessage({ type: 'success', text: 'Đã sao chép link chia sẻ.' });
  };

  const handleCopyFailure = () => {
    setMessage({ type: 'error', text: 'Không thể sao chép tự động. Vui lòng copy thủ công.' });
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
      setMessage({ type: 'error', text: mapShareApiError(saveError, 'Không thể cập nhật hạn sử dụng.') });
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
      setMessage({ type: 'error', text: mapShareApiError(revokeError, 'Không thể xóa link chia sẻ.') });
    } finally {
      setActionLoading(classId, false);
    }
  };

  return {
    rows,
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
  };
};

export default useShareLinksController;
