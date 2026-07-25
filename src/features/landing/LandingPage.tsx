import React, { useState } from 'react';

interface LandingPageProps {
  onSubmit: (credentials: { email: string; password: string }) => Promise<void>;
}

function LandingPage({ onSubmit }: LandingPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setSubmitting(false); // only reset on error
    }
  };

  return (
    <div className="login-page-layout">
      <div className="login-card">
        <div className="login-badge">S</div>
        <h2>Đăng nhập</h2>
        <p className="login-subtitle">Dùng tài khoản HUST để truy cập hệ thống Sổ Ảnh.</p>

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

export default LandingPage;
