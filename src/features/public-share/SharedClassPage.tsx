import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { classService, SharedClassResponse } from '../roster/services/class/service';
import StudentCard from '../roster/core/StudentCard';
import { useAuth } from '../auth';

interface SharedClassPageProps {
  id: string;
  exp: string;
  sig: string;
}

/**
 * Ánh xạ lỗi HTTP thành thông báo tiếng Việt cho người dùng cuối.
 * Trả về chuỗi đặc biệt 'LOGIN_REQUIRED' thay vì throw khi gặp 401.
 * @param error Lỗi axios hoặc lỗi bất kỳ từ API call.
 * @returns Chuỗi mô tả lỗi hoặc 'LOGIN_REQUIRED' sentinel.
 */
const mapPublicError = (error: any): string => {
  const status = error?.response?.status;

  if (status === 401) {
    return 'LOGIN_REQUIRED';
  }

  if (status === 400) {
    return 'Link chia sẻ thiếu tham số hoặc sai định dạng.';
  }

  if (status === 403) {
    return 'Link chia sẻ đã hết hạn, bị vô hiệu hoặc đã bị chỉnh sửa.';
  }

  if (status === 404) {
    return 'Link chia sẻ không tồn tại.';
  }

  return 'Không thể tải dữ liệu sổ ảnh. Vui lòng thử lại sau.';
};

const AVAILABLE_LAYOUTS = [4, 5, 6] as const;

/**
 * Lấy layout ban đầu từ query param hoặc mặc định 5 cột.
 * @returns Số cột hợp lệ trong AVAILABLE_LAYOUTS.
 */
const getInitialLayout = (): (typeof AVAILABLE_LAYOUTS)[number] => {
  const params = new URLSearchParams(window.location.search);
  const value = Number(params.get('layout'));

  return AVAILABLE_LAYOUTS.includes(value as (typeof AVAILABLE_LAYOUTS)[number])
    ? (value as (typeof AVAILABLE_LAYOUTS)[number])
    : 5;
};

function SharedClassPage({ id, exp, sig }: SharedClassPageProps) {
  const { isAuthenticated, login } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [payload, setPayload] = useState<SharedClassResponse | null>(null);
  const [layout, setLayout] = useState<(typeof AVAILABLE_LAYOUTS)[number]>(getInitialLayout);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  /**
   * Gọi API lấy dữ liệu sổ ảnh chia sẻ.
   * Nếu nhận 401, chuyển sang màn hình yêu cầu đăng nhập thay vì hiện lỗi.
   */
  const fetchSharedClass = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!id || !exp || !sig) {
      setError('Link chia sẻ thiếu tham số bắt buộc.');
      setLoading(false);
      return;
    }

    try {
      const data = await classService.getSharedClass({ id, exp, sig });
      setPayload(data);
      setRequiresLogin(false);
    } catch (fetchError: any) {
      const mapped = mapPublicError(fetchError);
      if (mapped === 'LOGIN_REQUIRED') {
        setRequiresLogin(true);
      } else {
        setError(mapped);
      }
    } finally {
      setLoading(false);
    }
  }, [id, exp, sig]);

  useEffect(() => {
    fetchSharedClass();
  }, [fetchSharedClass]);

  // Khi user vừa đăng nhập (isAuthenticated thay đổi true), re-fetch tự động.
  // api instance đã gắn Bearer token nên backend sẽ cho phép nếu requireLogin=true.
  useEffect(() => {
    if (isAuthenticated && requiresLogin) {
      fetchSharedClass();
    }
  }, [isAuthenticated, requiresLogin, fetchSharedClass]);

  const courseLabel = useMemo(() => {
    const classInfo = payload?.classInfo;
    if (!classInfo) {
      return 'Không có dữ liệu';
    }

    return [classInfo.courseCode, classInfo.courseName].filter(Boolean).join(' - ') || 'Không có dữ liệu';
  }, [payload]);

  useEffect(() => {
    document.body.setAttribute('data-layout', String(layout));

    return () => {
      document.body.removeAttribute('data-layout');
    };
  }, [layout]);

  const handleLayoutChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const next = Number(event.target.value);
    const nextLayout = AVAILABLE_LAYOUTS.includes(next as (typeof AVAILABLE_LAYOUTS)[number])
      ? (next as (typeof AVAILABLE_LAYOUTS)[number])
      : 5;

    setLayout(nextLayout);

    const params = new URLSearchParams(window.location.search);
    params.set('layout', String(nextLayout));
    const query = params.toString();
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState(null, '', nextUrl);
  };

  /**
   * Xử lý submit form đăng nhập nhanh ngay trong trang chia sẻ.
   * @param event Sự kiện submit form.
   */
  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError(null);

    const isValidHustEmail = /.+@hust\.edu\.vn$/i.test(loginEmail);
    if (!isValidHustEmail) {
      setLoginError('Vui lòng dùng email HUST có định dạng @hust.edu.vn.');
      return;
    }

    if (loginPassword.length < 6) {
      setLoginError('Mật khẩu cần có ít nhất 6 ký tự.');
      return;
    }

    setLoginSubmitting(true);

    try {
      await login({ email: loginEmail, password: loginPassword });
      setIsLoginOpen(false);
      setLoginEmail('');
      setLoginPassword('');
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        setLoginError('Sai email hoặc mật khẩu. Vui lòng kiểm tra lại.');
      } else if (!err?.response) {
        setLoginError('Không thể kết nối tới server. Vui lòng thử lại sau.');
      } else {
        setLoginError('Đăng nhập thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoginSubmitting(false);
    }
  };

  return (
    <div className="shared-page">
      <header className="shared-header">
        <div>
          <p className="shared-school">ĐẠI HỌC BÁCH KHOA HÀ NỘI</p>
          <h1>SỔ ẢNH THÍ SINH DỰ THI (CHIA SẺ)</h1>
        </div>
        {!loading && !error && !requiresLogin && (
          <div className="shared-header-actions">
            <select className="form-select shared-layout-select" value={String(layout)} onChange={handleLayoutChange}>
              <option value="4">Lưới 4 cột</option>
              <option value="5">Lưới 5 cột</option>
              <option value="6">Lưới 6 cột</option>
            </select>

            <button type="button" className="btn btn-outline-primary" onClick={() => window.print()}>
              In sổ ảnh
            </button>
          </div>
        )}
      </header>

      {loading && (
        <div className="state-panel">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p>Đang tải dữ liệu sổ ảnh được chia sẻ...</p>
        </div>
      )}

      {!loading && requiresLogin && (
        <div className="shared-login-required">
          <div className="shared-login-card">
            <h2 className="shared-login-title">Yêu cầu đăng nhập</h2>
            <p className="shared-login-desc">
              Sổ ảnh này chỉ dành cho tài khoản HUST. Vui lòng đăng nhập để xem.
            </p>

            {!isLoginOpen ? (
              <button
                type="button"
                className="btn btn-primary shared-login-btn"
                onClick={() => setIsLoginOpen(true)}
              >
                Đăng nhập bằng tài khoản HUST
              </button>
            ) : (
              <form className="shared-login-form" onSubmit={handleLoginSubmit} noValidate>
                <div className="shared-login-field">
                  <label htmlFor="shared-email" className="form-label">Email HUST</label>
                  <input
                    id="shared-email"
                    type="email"
                    className="form-control"
                    placeholder="name@hust.edu.vn"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    disabled={loginSubmitting}
                    autoComplete="email"
                  />
                </div>
                <div className="shared-login-field">
                  <label htmlFor="shared-password" className="form-label">Mật khẩu</label>
                  <input
                    id="shared-password"
                    type="password"
                    className="form-control"
                    placeholder="Mật khẩu"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    disabled={loginSubmitting}
                    autoComplete="current-password"
                  />
                </div>
                {loginError && (
                  <div className="alert alert-danger" role="alert">{loginError}</div>
                )}
                <div className="shared-login-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loginSubmitting}
                  >
                    {loginSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => { setIsLoginOpen(false); setLoginError(null); }}
                    disabled={loginSubmitting}
                  >
                    Hủy
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="alert alert-danger" role="alert">
          <strong>Lỗi!</strong> {error}
        </div>
      )}

      {!loading && !error && !requiresLogin && payload && (
        <>
          <section className="shared-meta-card">
            <div className="shared-meta-grid" role="list" aria-label="Thông tin lớp học">
              <div className="shared-meta-item" role="listitem"><span>Học phần:</span><strong>{courseLabel}</strong></div>
              <div className="shared-meta-item" role="listitem"><span>Mã lớp:</span><strong>{payload.classInfo.classCode || '-'}</strong></div>
              <div className="shared-meta-item" role="listitem"><span>Học kỳ:</span><strong>{payload.classInfo.semester || '-'}</strong></div>
              <div className="shared-meta-item" role="listitem"><span>Đơn vị:</span><strong>{payload.classInfo.department || '-'}</strong></div>
              <div className="shared-meta-item" role="listitem"><span>Loại lớp:</span><strong>{payload.classInfo.classType || '-'}</strong></div>
              <div className="shared-meta-item" role="listitem"><span>Giảng viên:</span><strong>{payload.classInfo.instructor || '-'}</strong></div>
              <div className="shared-meta-item" role="listitem"><span>Sĩ số:</span><strong>{payload.students.length}</strong></div>
            </div>
          </section>

          {payload.students.length === 0 ? (
            <div className="empty-state-card mt-3">
              <h2>Lớp hiện tại chưa có sinh viên</h2>
            </div>
          ) : (
            <section className="gallery-panel mt-3">
              <div className="student-gallery">
                {payload.students.map((student) => (
                  <StudentCard
                    key={student.mssv}
                    mssv={student.mssv}
                    name={student.name}
                    photoUrl={student.photoUrl}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default SharedClassPage;
