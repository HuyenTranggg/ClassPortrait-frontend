import React from 'react';

interface AppToastProps {
  message: { type: 'success' | 'error'; text: string } | null;
  onClose: () => void;
  className?: string;
}

/**
 * Hiển thị toast thông báo trạng thái chung cho các màn hình trong roster.
 * @param message Nội dung thông báo cần hiển thị.
 * @param onClose Callback đóng toast thủ công.
 * @param className Class CSS bổ sung nếu cần tùy biến vị trí.
 * @returns Component toast hoặc null nếu không có message.
 */
function AppToast({ message, onClose, className }: AppToastProps) {
  if (!message) {
    return null;
  }

  return (
    <div className={`attendance-toast-wrap ${className || ''}`.trim()} aria-live="polite" aria-atomic="true">
      <div className={`attendance-toast ${message.type === 'success' ? 'is-success' : 'is-error'}`} role="alert">
        <span className="attendance-toast-text">{message.text}</span>
        <button type="button" className="attendance-toast-close" aria-label="Đóng thông báo" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
}

export default AppToast;
