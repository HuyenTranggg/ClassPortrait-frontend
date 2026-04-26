import { useEffect } from 'react';

interface MessagePayload {
  type: 'success' | 'error';
  text: string;
}

/**
 * Tự động đóng message sau một khoảng thời gian cố định để tránh UI bị lưu thông báo quá lâu.
 * @param message Đối tượng message hiện tại.
 * @param onClear Hàm callback reset message về null.
 * @param timeoutMs Thời gian tự đóng toast theo mili giây.
 * @returns Không trả về giá trị.
 */
export const useAutoDismissMessage = (
  message: MessagePayload | null,
  onClear: () => void,
  timeoutMs = 3500
): void => {
  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      onClear();
    }, timeoutMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [message, onClear, timeoutMs]);
};

export default useAutoDismissMessage;
