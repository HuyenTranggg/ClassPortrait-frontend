// src/App.tsx
import React, { useEffect } from 'react';
import './App.css';
import StudentCard from './components/StudentCard';
import { useStudents, usePagination } from './hooks';

/**
 * Component chính của ứng dụng Sổ ảnh sinh viên
 */
function App() {
  // Custom hooks để tách logic
  const { students, loading, error } = useStudents();
  const { photosPerRow, photosPerPage, totalPages, paginatedPages } = usePagination(students);

  // Set layout attribute vào body để CSS sử dụng
  useEffect(() => {
    document.body.setAttribute('data-layout', photosPerRow.toString());
    return () => {
      document.body.removeAttribute('data-layout');
    };
  }, [photosPerRow]);

  // Set CSS variable cho tổng số trang
  useEffect(() => {
    document.documentElement.style.setProperty('--total-pages', totalPages.toString());
  }, [totalPages]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container mt-4">
      {/* Header - compact */}
      <div className="no-print mb-3">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h3 className="mb-1">Sổ ảnh Sinh viên - IT-E6 04 K67</h3>
            <small className="text-muted">
              {students.length} sinh viên | Layout {photosPerRow} ảnh/hàng | In: {photosPerPage} ảnh/trang ({totalPages} trang)
            </small>
          </div>
          <div className="d-flex gap-2 align-items-center">
            <div className="btn-group btn-group-sm" role="group">
              <a 
                href="?layout=4" 
                className={`btn ${photosPerRow === 4 ? 'btn-primary' : 'btn-outline-secondary'}`}
                title="4 ảnh/hàng (Web & In)"
              >
                4×4
              </a>
              <a 
                href="?layout=5" 
                className={`btn ${photosPerRow === 5 ? 'btn-primary' : 'btn-outline-secondary'}`}
                title="5 ảnh/hàng (Web & In)"
              >
                5×4
              </a>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={handlePrint}
            >
              🖨️ In
            </button>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p className="mt-2">Đang tải danh sách sinh viên...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="alert alert-danger" role="alert">
          <strong>Lỗi!</strong> {error}
          <br />
          <small>Đảm bảo backend đang chạy tại http://localhost:3000</small>
        </div>
      )}

      {/* Student gallery với số trang ở cuối mỗi nhóm */}
      {!loading && !error && (
        <>
          {paginatedPages.map(({ pageIndex, students: pageStudents }) => (
            <React.Fragment key={pageIndex}>
              {pageIndex === 0 && (
                <div className="print-only print-first-header">
                  <h2>SỔ ẢNH SINH VIÊN - IT-E6 04 K67</h2>
                  <p>Tổng số: {students.length} sinh viên</p>
                </div>
              )}

              <div className={`page-content ${pageIndex > 0 ? 'page-break-before' : ''}`}>
                <div className="student-gallery">
                  {pageStudents.map((student) => (
                    <StudentCard
                      key={student.mssv}
                      mssv={student.mssv}
                      name={student.name}
                    />
                  ))}
                </div>

                <div className="print-only page-number-fixed">
                  {pageIndex + 1}/{totalPages}
                </div>
              </div>
            </React.Fragment>
          ))}
        </>
      )}
    </div>
  );
}

export default App;
