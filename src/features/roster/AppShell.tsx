import React, { useEffect, useRef } from 'react';
import StudentCard from './StudentCard';
import ImportButton from './ImportButton';
import { useClasses, usePagination } from './hooks';
import { useAuth } from '../auth';

function AppShell() {
  const headerRef = useRef<HTMLElement | null>(null);
  const { logout, userEmail } = useAuth();
  const { classes, selectedClass, students, loading, error, selectClass, refetchClasses } = useClasses();
  const { photosPerRow, photosPerPage, totalPages, paginatedPages } = usePagination(students);

  const getDisplayNameFromEmail = (email: string | null) => {
    if (!email) {
      return 'Giangvien';
    }

    const localPart = email.split('@')[0]?.trim() || '';
    const firstPart = localPart.split('.')[0]?.trim() || '';
    const baseName = firstPart || localPart;

    if (!baseName) {
      return 'Giangvien';
    }

    return baseName.charAt(0).toUpperCase() + baseName.slice(1).toLowerCase();
  };

  const getClassDisplayName = (cls: typeof selectedClass) => {
    if (!cls) return '';

    const parts = [];
    if (cls.classCode) parts.push(cls.classCode);
    if (cls.courseCode) parts.push(cls.courseCode);
    if (cls.courseName) parts.push(cls.courseName);
    return parts.join(' - ') || cls.id;
  };

  useEffect(() => {
    document.body.setAttribute('data-layout', photosPerRow.toString());

    return () => {
      document.body.removeAttribute('data-layout');
    };
  }, [photosPerRow]);

  useEffect(() => {
    document.documentElement.style.setProperty('--total-pages', totalPages.toString());
  }, [totalPages]);

  useEffect(() => {
    const updateHeaderHeight = () => {
      const headerHeight = headerRef.current?.offsetHeight || 0;
      document.documentElement.style.setProperty('--shell-header-height', `${headerHeight}px`);
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);

    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleClassChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const classId = event.target.value;

    if (classId) {
      selectClass(classId);
    }
  };

  const handleLayoutChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const layout = event.target.value === '5' ? '5' : '4';
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('layout', layout);
    window.location.search = urlParams.toString();
  };

  const lecturerDisplayName = getDisplayNameFromEmail(userEmail);
  const courseLabel = selectedClass
    ? [selectedClass.courseCode, selectedClass.courseName].filter(Boolean).join(' - ') || 'Chưa có dữ liệu học phần'
    : 'Chưa import dữ liệu';
  const classCodeLabel = selectedClass?.classCode || 'Chưa import dữ liệu';
  const semesterLabel = selectedClass?.semester || 'Chưa import dữ liệu';
  const studentCountLabel = selectedClass ? `${students.length}` : '0';

  return (
    <div className="app-shell">
      <aside className="app-sidebar no-print">
        <div className="brand-block">
          <div className="brand-mark">S</div>
          <div>
            <strong>Sổ ảnh</strong>
            <span>Thi sinh dự thi</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button type="button" className="sidebar-link is-active">
            <span>Sổ ảnh</span>
            <small>Quản lý danh sách ảnh</small>
          </button>
          <button type="button" className="sidebar-link">
            <span>Lịch sử import</span>
            <small>Theo dõi các lần nhập file</small>
          </button>
          <button type="button" className="sidebar-link">
            <span>Chia sẻ</span>
            <small>Chuẩn bị cho bước chia sẻ nội bộ</small>
          </button>
          <button type="button" className="sidebar-link">
            <span>Cài đặt</span>
            <small>Tùy chỉnh layout và in ấn</small>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-avatar" aria-hidden="true">GV</div>
          <div className="sidebar-user-meta">
            <strong>{lecturerDisplayName}</strong>
            <span>Giảng viên</span>
          </div>
          <button type="button" className="sidebar-logout" onClick={logout}>Đăng xuất</button>
        </div>
      </aside>

      <main className="app-main">
        <header className="shell-header no-print" ref={headerRef}>
          <div className="shell-header-content">
            <p className="roster-school">ĐẠI HỌC BÁCH KHOA HÀ NỘI</p>
            <h1>DANH SÁCH THÍ SINH DỰ THI</h1>

            <div className="roster-meta" role="list" aria-label="Thông tin lớp học">
              <div className="roster-meta-item" role="listitem">
                <span>Học phần:</span>
                <strong>{courseLabel}</strong>
              </div>
              <div className="roster-meta-item" role="listitem">
                <span>Mã lớp:</span>
                <strong>{classCodeLabel}</strong>
              </div>
              <div className="roster-meta-item" role="listitem">
                <span>Học kỳ:</span>
                <strong>{semesterLabel}</strong>
              </div>
              <div className="roster-meta-item" role="listitem">
                <span>Sĩ số:</span>
                <strong>{studentCountLabel}</strong>
              </div>
            </div>
          </div>

          <div className="shell-actions">
            <button type="button" className="btn btn-outline-secondary btn-share" disabled={!selectedClass}>
              Chia sẻ
            </button>
            <ImportButton onImportSuccess={refetchClasses} />
          </div>
        </header>

        <section className="workspace-panel no-print">
          <div className="workspace-toolbar">
            <select
              className="form-select"
              value={selectedClass?.id || ''}
              onChange={handleClassChange}
              disabled={loading || classes.length === 0}
            >
              {classes.length === 0 ? (
                <option value="">Chưa có lớp</option>
              ) : (
                classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {getClassDisplayName(cls)}
                  </option>
                ))
              )}
            </select>

            <select
              className="form-select layout-select"
              value={String(photosPerRow)}
              onChange={handleLayoutChange}
              aria-label="Chọn layout"
            >
              <option value="4">Lưới 4 cột</option>
              <option value="5">Lưới 5 cột</option>
            </select>

            <button type="button" className="btn btn-primary btn-print" onClick={handlePrint}>
              In sổ ảnh
            </button>

            <span className="workspace-student-count">{students.length} sinh viên</span>
          </div>
        </section>

        {loading && (
          <div className="state-panel">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
            <p>Đang tải danh sách sinh viên...</p>
          </div>
        )}

        {error && (
          <div className="alert alert-danger" role="alert">
            <strong>Lỗi!</strong> {error}
            <br />
            <small>Đảm bảo backend đang chạy tại http://localhost:3000</small>
          </div>
        )}

        {!loading && !error && (
          <section className="gallery-panel">
            {paginatedPages.length === 0 ? (
              <div className="empty-state-card">
                <h2>Chưa có dữ liệu để hiển thị</h2>
                <p>Hãy import danh sách lớp để hệ thống tự động lấy ảnh và tạo sổ ảnh chuẩn định dạng.</p>
              </div>
            ) : (
              paginatedPages.map(({ pageIndex, students: pageStudents }) => (
                <React.Fragment key={pageIndex}>
                  <div className={`page-content ${pageIndex > 0 ? 'page-break-before' : ''}`}>
                    {pageIndex === 0 && (
                      <div className="print-only print-first-header">
                        <h2>SỔ ẢNH SINH VIÊN</h2>
                        {selectedClass && <p>Lớp: {getClassDisplayName(selectedClass)}</p>}
                        <p>Tổng số: {students.length} sinh viên</p>
                      </div>
                    )}

                    <div className="student-gallery">
                      {pageStudents.map((student) => (
                        <StudentCard
                          key={student.mssv}
                          mssv={student.mssv}
                          name={student.name}
                          photoUrl={student.photoUrl}
                        />
                      ))}
                    </div>

                    <div className="print-only page-number-fixed">
                      {pageIndex + 1}/{totalPages}
                    </div>
                  </div>
                </React.Fragment>
              ))
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default AppShell;
