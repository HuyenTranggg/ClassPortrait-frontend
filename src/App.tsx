// src/App.tsx
import React, { useEffect } from 'react';
import './App.scss';
import StudentCard from './components/StudentCard';
import ImportButton from './components/ImportButton';
import { useClasses, usePagination } from './hooks';

/**
 * Component chính của ứng dụng Sổ ảnh sinh viên
 */
function App() {
  // Custom hooks để tách logic
  const { classes, selectedClass, students, loading, error, selectClass, refetchClasses } = useClasses();
  const { photosPerRow, photosPerPage, totalPages, paginatedPages } = usePagination(students);

  // Helper function để hiển thị tên lớp
  const getClassDisplayName = (cls: typeof selectedClass) => {
    if (!cls) return '';
    const parts = [];
    if (cls.classCode) parts.push(cls.classCode);
    if (cls.courseCode) parts.push(cls.courseCode);
    if (cls.courseName) parts.push(cls.courseName);
    return parts.join(' - ') || cls.id;
  };

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

  const handleClassChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const classId = event.target.value;
    if (classId) {
      selectClass(classId);
    }
  };

  return (
    <div className="container mt-4">
      {/* Header - compact */}
      <div className="no-print mb-3">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h3 className="mb-1">Sổ ảnh Sinh viên {selectedClass && `- ${getClassDisplayName(selectedClass)}`}</h3>
            <small className="text-muted">
              {students.length} sinh viên | Layout {photosPerRow} ảnh/hàng | In: {photosPerPage} ảnh/trang ({totalPages} trang)
            </small>
          </div>
          <div className="d-flex gap-2 align-items-center flex-wrap">
            {/* Dropdown chọn lớp */}
            <select 
              className="form-select form-select-sm"
              value={selectedClass?.id || ''}
              onChange={handleClassChange}
              disabled={loading || classes.length === 0}
              style={{ width: 'auto', minWidth: '150px' }}
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
              In
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
