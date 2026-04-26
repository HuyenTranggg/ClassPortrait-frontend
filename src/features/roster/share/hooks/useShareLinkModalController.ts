import { useCallback, useEffect, useMemo, useState } from 'react';
import { Class } from '../../../../types';
import {
  classService,
  CreateShareLinkPayload,
  ShareLink,
  UpdateShareLinkPayload,
} from '../../services/class.service';
import {
  buildPublicShareUrl,
  getShareLinkStatus,
  mapShareApiError,
  toDateTimeLocalValue,
  toIsoFromDateTimeLocal,
} from '../utils/shareHelpers';
import { useAutoDismissMessage } from '../../../../hooks/useAutoDismissMessage';

interface UseShareLinkModalControllerOptions {
  isOpen: boolean;
  selectedClass: Class | null;
}

/**
 * Controller quản lý trạng thái và API cho modal tạo/quản lý link chia sẻ.
 */
export const useShareLinkModalController = ({
  isOpen,
  selectedClass,
}: UseShareLinkModalControllerOptions) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [expiresInDays, setExpiresInDays] = useState('7');
  const [expiresAtInput, setExpiresAtInput] = useState('');
  const [requireLogin, setRequireLogin] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const classLabel = useMemo(() => {
    if (!selectedClass) {
      return '';
    }

    return [selectedClass.classCode, selectedClass.courseCode, selectedClass.courseName]
      .filter(Boolean)
      .join(' - ');
  }, [selectedClass]);

  const publicShareUrl = useMemo(() => buildPublicShareUrl(shareLink), [shareLink]);

  const shareStatus = useMemo(() => {
    if (!shareLink) {
      return null;
    }

    return getShareLinkStatus(shareLink);
  }, [shareLink]);

  const fetchShareLink = useCallback(async () => {
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
      setMessage({ type: 'error', text: mapShareApiError(error, 'Không thể tải thông tin link chia sẻ.') });
    } finally {
      setLoading(false);
    }
  }, [selectedClass?.id]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    fetchShareLink();
  }, [fetchShareLink, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setShareLink(null);
      setExpiresInDays('7');
      setExpiresAtInput('');
      setRequireLogin(false);
      setMessage(null);
      setLoading(false);
      setSubmitting(false);
    }
  }, [isOpen]);

  useAutoDismissMessage(isOpen ? message : null, () => setMessage(null));

  const handleCreateShareLink = async () => {
    if (!selectedClass?.id) {
      return;
    }

    const parsedDays = Number(expiresInDays);
    const payload: CreateShareLinkPayload = {
      requireLogin,
    };

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
      const errorMessage = mapShareApiError(error, 'Không thể tạo link chia sẻ.');
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
      setMessage({ type: 'error', text: mapShareApiError(error, 'Không thể cập nhật trạng thái link.') });
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
      setMessage({ type: 'error', text: mapShareApiError(error, 'Không thể cập nhật hạn sử dụng link.') });
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
      setMessage({ type: 'error', text: mapShareApiError(error, 'Không thể xóa link chia sẻ.') });
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Chuyển đổi chế độ yêu cầu đăng nhập của link chia sẻ hiện tại.
   */
  const handleToggleRequireLogin = async () => {
    if (!selectedClass?.id || !shareLink) {
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const payload: UpdateShareLinkPayload = {
      requireLogin: !shareLink.requireLogin,
    };

    try {
      const result = await classService.updateShareLink(selectedClass.id, payload);
      setShareLink(result);
      setMessage({
        type: 'success',
        text: result.requireLogin ? 'Đã bật yêu cầu đăng nhập.' : 'Đã tắt yêu cầu đăng nhập.',
      });
    } catch (error: any) {
      setMessage({ type: 'error', text: mapShareApiError(error, 'Không thể cập nhật chế độ truy cập.') });
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

  return {
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
  };
};

export default useShareLinkModalController;
