// src/App.tsx
import React, { useMemo, useState } from 'react';
import './App.scss';
import { AppShell } from './features/roster';
import { LandingPage } from './features/landing';
import { LoginModal, useAuth } from './features/auth';
import { SharedClassPage } from './features/share-public';

const loginMessages: Record<string, string> = {
  default: 'hệ thống',
  'Sổ ảnh': 'sổ ảnh',
  'Lịch sử import': 'lịch sử import',
  'Chia sẻ': 'chức năng chia sẻ',
  'Cài đặt': 'cài đặt',
  'Import nhanh': 'chức năng import nhanh',
  'Ảnh tự động': 'chức năng ảnh tự động',
  'In chuẩn format': 'chức năng in chuẩn format',
};

/**
 * Component chính của ứng dụng Sổ ảnh sinh viên
 */
function App() {
  const { isAuthenticated, login } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginContext, setLoginContext] = useState('default');
  const sharedPathMatch = window.location.pathname.match(/^\/classes\/shared\/([^/]+)$/);
  const sharedLinkId = sharedPathMatch?.[1] || null;
  const isSharedRoute = Boolean(sharedLinkId);
  const sharedParams = new URLSearchParams(window.location.search);
  const sharedExp = sharedParams.get('exp') || '';
  const sharedSig = sharedParams.get('sig') || '';

  const loginContextLabel = useMemo(() => loginMessages[loginContext] || loginMessages.default, [loginContext]);

  const openLogin = (context = 'default') => {
    setLoginContext(context);
    setIsLoginOpen(true);
  };

  const closeLogin = () => {
    setIsLoginOpen(false);
  };

  const handleLogin = async ({ email, password }: { email: string; password: string }) => {
    const isValidHustEmail = /.+@hust\.edu\.vn$/i.test(email);

    if (!isValidHustEmail) {
      throw new Error('Vui lòng dùng email HUST có định dạng @hust.edu.vn.');
    }

    if (password.length < 6) {
      throw new Error('Mật khẩu cần có ít nhất 6 ký tự.');
    }

    try {
      await login({ email, password });
    } catch (error: any) {
      const status = error?.response?.status;

      if (status === 401) {
        throw new Error('Sai email hoặc mật khẩu. Vui lòng kiểm tra lại.');
      }

      if (status === 400) {
        throw new Error('Email hoặc mật khẩu không đúng định dạng backend yêu cầu.');
      }

      if (error?.code === 'ECONNABORTED' || !error?.response) {
        throw new Error('Không thể kết nối tới server xác thực. Vui lòng thử lại sau.');
      }

      throw new Error('Đăng nhập thất bại. Vui lòng thử lại.');
    }

    setIsLoginOpen(false);
  };

  return (
    <>
      {isSharedRoute ? (
        <SharedClassPage id={sharedLinkId!} exp={sharedExp} sig={sharedSig} />
      ) : (
        <>
          {isAuthenticated ? (
            <AppShell />
          ) : (
            <LandingPage onLoginClick={() => openLogin()} onFeatureClick={openLogin} />
          )}

          <LoginModal
            isOpen={isLoginOpen}
            contextLabel={loginContextLabel}
            onClose={closeLogin}
            onSubmit={handleLogin}
          />
        </>
      )}
    </>
  );
}

export default App;
