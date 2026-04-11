import React, { useEffect, useMemo, useState } from 'react';
import { classService, SharedClassResponse } from '../roster/services/class/service';
import StudentCard from '../roster/core/StudentCard';

interface SharedClassPageProps {
  id: string;
  exp: string;
  sig: string;
}

const mapPublicError = (error: any): string => {
  const status = error?.response?.status;

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

const getInitialLayout = (): (typeof AVAILABLE_LAYOUTS)[number] => {
  const params = new URLSearchParams(window.location.search);
  const value = Number(params.get('layout'));

  return AVAILABLE_LAYOUTS.includes(value as (typeof AVAILABLE_LAYOUTS)[number])
    ? (value as (typeof AVAILABLE_LAYOUTS)[number])
    : 5;
};

function SharedClassPage({ id, exp, sig }: SharedClassPageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<SharedClassResponse | null>(null);
  const [layout, setLayout] = useState<(typeof AVAILABLE_LAYOUTS)[number]>(getInitialLayout);

  useEffect(() => {
    const fetchSharedClass = async () => {
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
      } catch (fetchError: any) {
        setError(mapPublicError(fetchError));
      } finally {
        setLoading(false);
      }
    };

    fetchSharedClass();
  }, [id, exp, sig]);

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

  return (
    <div className="shared-page">
      <header className="shared-header">
        <div>
          <p className="shared-school">ĐẠI HỌC BÁCH KHOA HÀ NỘI</p>
          <h1>SỔ ẢNH THÍ SINH DỰ THI (CHIA SẺ)</h1>
        </div>
        {!loading && !error && (
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

      {!loading && error && (
        <div className="alert alert-danger" role="alert">
          <strong>Lỗi!</strong> {error}
        </div>
      )}

      {!loading && !error && payload && (
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
