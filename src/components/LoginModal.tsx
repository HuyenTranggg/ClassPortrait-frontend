import React, { useEffect, useState } from 'react';

interface LoginModalProps {
  isOpen: boolean;
  contextLabel?: string;
  onClose: () => void;
  onSubmit: (credentials: { email: string; password: string }) => Promise<void>;
}

function LoginModal({ isOpen, contextLabel, onClose, onSubmit }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setPassword('');
      setSubmitting(false);
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose, submitting]);

  if (!isOpen) {
    return null;
  }

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({ email: email.trim(), password });
    } catch (submitError: any) {
      setError(submitError?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
      setSubmitting(false);
    }
  };

  return (
    <div className="login-modal-backdrop" role="presentation" onClick={!submitting ? onClose : undefined}>
      <div
        className="login-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="modal-close" onClick={onClose} disabled={submitting} aria-label="Đóng">
          ×
        </button>

        <div className="login-badge">S</div>
        <h2 id="login-modal-title">Đăng nhập</h2>
        <p className="login-subtitle">
          {contextLabel ? `Đăng nhập để sử dụng ${contextLabel}.` : 'Dùng tài khoản HUST để truy cập hệ thống.'}
        </p>

        <form className="login-form" onSubmit={handleFormSubmit}>
          <label>
            <span>Email HUST</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@hust.edu.vn"
              autoComplete="email"
            />
          </label>

          <label>
            <span>Mật khẩu</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Nhập mật khẩu"
              autoComplete="current-password"
            />
          </label>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="btn btn-primary btn-login-submit" disabled={submitting}>
            {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginModal;