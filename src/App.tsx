import React, { useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import './App.scss';
import AppLayout from './layouts/AppLayout';
import RosterView from './features/roster/views/RosterView';
import TeacherDashboardView from './features/roster/dashboard/views/TeacherDashboardView';
import ImportHistoryView from './features/roster/import/views/ImportHistoryView';
import ShareLinksView from './features/roster/share/views/ShareLinksView';
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

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  children: React.ReactElement;
}

/**
 * Bảo vệ route yêu cầu đăng nhập trước khi truy cập.
 * @param isAuthenticated Trạng thái đăng nhập hiện tại.
 * @param children Nội dung route cần bảo vệ.
 * @returns Component con nếu đã đăng nhập, ngược lại chuyển về trang landing.
 */
function ProtectedRoute({ isAuthenticated, children }: ProtectedRouteProps) {
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

/**
 * Đọc tham số route/query để hiển thị trang chia sẻ công khai.
 * @returns Component trang chia sẻ với id/exp/sig lấy từ URL hiện tại.
 */
function SharedClassRoute() {
  const { id = '' } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  return <SharedClassPage id={id} exp={searchParams.get('exp') || ''} sig={searchParams.get('sig') || ''} />;
}

/**
 * Component chính của ứng dụng Sổ ảnh sinh viên
 */
function App() {
  const { isAuthenticated, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginContext, setLoginContext] = useState('default');
  const isSharedRoute = location.pathname.startsWith('/classes/shared/');

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
    navigate('/classes', { replace: true });
  };

  return (
    <>
      <Routes>
        <Route path="/classes/shared/:id" element={<SharedClassRoute />} />

        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/classes" replace />
            ) : (
              <LandingPage onLoginClick={() => openLogin()} onFeatureClick={openLogin} />
            )
          }
        />

        <Route element={<ProtectedRoute isAuthenticated={isAuthenticated}><AppLayout /></ProtectedRoute>}>
          <Route path="/classes" element={<RosterView />} />
          <Route path="/classes/:classId" element={<RosterView />} />
          <Route path="/dashboard" element={<TeacherDashboardView />} />
          <Route path="/import-history" element={<ImportHistoryView />} />
          <Route path="/share" element={<ShareLinksView />} />
        </Route>

        <Route path="*" element={<Navigate to={isAuthenticated ? '/classes' : '/'} replace />} />
      </Routes>

      {!isSharedRoute && (
        <LoginModal
          isOpen={isLoginOpen}
          contextLabel={loginContextLabel}
          onClose={closeLogin}
          onSubmit={handleLogin}
        />
      )}
    </>
  );
}

export default App;
