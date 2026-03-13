import React, { useEffect } from 'react';
import StudentCard from './StudentCard';
import ImportButton from './ImportButton';
import { useClasses, usePagination } from '../hooks';
import { useAuth } from '../contexts/AuthContext';

function AppShell() {
  const { logout } = useAuth();
  const { classes, selectedClass, students, loading, error, selectClass, refetchClasses } = useClasses();
  const { photosPerRow, photosPerPage, totalPages, paginatedPages } = usePagination(students);

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

  const handlePrint = () => {
    window.print();
  };

  const handleClassChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const classId = event.target.value;

    if (classId) {
      selectClass(classId);
    }
  };

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
          <div className="user-dot" aria-hidden="true" />
          <div>
            <strong>Đã đăng nhập</strong>
            <span>Sẵn sàng quản lý sổ ảnh</span>
          </div>
        </div>
      </aside>

      <main className="app-main">
        <header className="shell-header no-print">
          <div>
            <p className="shell-eyebrow">Không gian làm việc</p>
            <h1>Sổ ảnh thí sinh dự thi</h1>
            <span>
              {selectedClass ? getClassDisplayName(selectedClass) : 'Chọn lớp để xem và in danh sách ảnh'}
            </span>
          </div>

          <div className="shell-actions">
            <button type="button" className="btn btn-outline-secondary" onClick={logout}>
              Đăng xuất
            </button>
          </div>
        </header>

        <section className="workspace-panel no-print">
          <div className="workspace-overview">
            <strong>Tổng quan</strong>
            <span>
              {students.length} sinh viên | Layout {photosPerRow} ảnh/hàng | In {photosPerPage} ảnh/trang ({totalPages} trang)
            </span>
          </div>

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

            <ImportButton onImportSuccess={refetchClasses} />

            <div className="btn-group" role="group" aria-label="Chọn layout">
              <a
                href="?layout=4"
                className={`btn ${photosPerRow === 4 ? 'btn-primary' : 'btn-outline-secondary'}`}
                title="4 ảnh/hàng"
              >
                4x4
              </a>
              <a
                href="?layout=5"
                className={`btn ${photosPerRow === 5 ? 'btn-primary' : 'btn-outline-secondary'}`}
                title="5 ảnh/hàng"
              >
                5x4
              </a>
            </div>

            <button type="button" className="btn btn-primary" onClick={handlePrint}>
              In sổ ảnh
            </button>
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
                        <StudentCard key={student.mssv} mssv={student.mssv} name={student.name} />
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