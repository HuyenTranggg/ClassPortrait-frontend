import React from 'react';
import { useImportHistory } from './hooks';
import { ImportHistoryItem } from './classService';

const sourceOptions = [
  { value: 'all', label: 'Tất cả nguồn' },
  { value: 'excel', label: 'Excel' },
  { value: 'google_sheet', label: 'Google Sheet' },
  { value: 'onedrive', label: 'OneDrive' },
] as const;

const sourceTypeLabel: Record<string, string> = {
  excel: 'Excel',
  google_sheet: 'Google Sheet',
  onedrive: 'OneDrive',
};

interface ImportHistoryViewProps {
  onOpenClass?: (classId: string) => void;
}

function getClassLabel(item: ImportHistoryItem): string {
  const classCode = String(item.classCode || '').trim();

  if (classCode) {
    return classCode;
  }


  return 'Lớp không xác định';
}

  function getClassSubLabel(item: ImportHistoryItem): string {
    const courseParts = [item.courseCode, item.courseName].filter((value) => String(value || '').trim());
    const courseLabel = courseParts.join(' - ');
    const semesterLabel = item.semester ? `HK ${item.semester}` : '';

    if (courseLabel && semesterLabel) {
      return `${courseLabel} • ${semesterLabel}`;
    }

    return courseLabel || semesterLabel || 'Chưa có thông tin học phần';
  }

function ImportHistoryView({ onOpenClass }: ImportHistoryViewProps) {
  const {
    historyItems,
    pagination,
    page,
    sourceType,
    loading,
    error,
    setPage,
    setSourceType,
    refetch,
  } = useImportHistory();

  const formatDateTime = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString('vi-VN');
  };

  const totalPages = Math.max(pagination.totalPages || 0, 1);

  return (
    <section className="history-panel">
      <div className="history-toolbar">
        <div>
          <h2 className="history-title">Lịch sử import</h2>
        </div>

        <div className="history-filter-group">
          {/* <label htmlFor="history-source-type" className="form-label mb-1">Nguồn dữ liệu</label> */}
          <select
            id="history-source-type"
            className="form-select"
            value={sourceType}
            onChange={(event) => setSourceType(event.target.value as 'all' | 'excel' | 'google_sheet' | 'onedrive')}
            disabled={loading}
          >
            {sourceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="state-panel">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p>Đang tải lịch sử import...</p>
        </div>
      )}

      {!loading && error && (
        <div className="alert alert-danger" role="alert">
          <strong>Lỗi!</strong> {error}
          <div className="mt-2">
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={refetch}>
              Thử lại
            </button>
          </div>
        </div>
      )}

      {!loading && !error && historyItems.length === 0 && (
        <div className="empty-state-card">
          <h2>Chưa có lịch sử import</h2>
          <p>Hiện chưa có dữ liệu import phù hợp với bộ lọc đã chọn.</p>
        </div>
      )}

      {!loading && !error && historyItems.length > 0 && (
        <>
          <div className="table-responsive history-table-wrap">
            <table className="table table-bordered table-hover align-middle history-table mb-0">
              <thead>
                <tr>
                  <th>Lớp</th>
                  <th>Nguồn</th>
                  <th>Tổng dòng</th>
                  <th>Import</th>
                  <th>Bỏ qua</th>
                  <th>Mapping</th>
                  <th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {historyItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <button
                        type="button"
                        className="history-class-link"
                        onClick={() => onOpenClass?.(item.classId)}
                        disabled={!item.classId}
                      >
                        {getClassLabel(item)}
                      </button>
                      <div className="history-class-meta">{getClassSubLabel(item)}</div>
                    </td>
                    <td>
                      <div>{sourceTypeLabel[item.sourceType] || item.sourceType}</div>
                      <small className="text-muted">{item.sourceName || '-'}</small>
                    </td>
                    <td>{item.totalCount}</td>
                    <td>{item.importedRows}</td>
                    <td>{item.skippedRows}</td>
                    <td>{item.mappingModeUsed || '-'}</td>
                    <td>{formatDateTime(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="history-pagination">
            <span className="history-total">Tổng: {pagination.total} bản ghi</span>

            <div className="btn-group" role="group" aria-label="Phân trang lịch sử import">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                Trước
              </button>
              <button type="button" className="btn btn-outline-secondary" disabled>
                Trang {page}/{totalPages}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                Sau
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default ImportHistoryView;
