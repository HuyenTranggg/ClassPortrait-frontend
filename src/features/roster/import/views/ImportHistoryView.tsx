import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useImportHistory } from '../hooks/useImportHistory';
import { actionLabel, sourceOptions, sourceTypeLabel } from '../utils/history/constants';
import ChangesSummary from '../components/ChangesSummary';
import { formatDateTime, getClassLabel, getClassSubLabel } from '../utils/history/utils';
import ShellHeader from '../../../../layouts/ShellHeader';

function ImportHistoryView() {
  const navigate = useNavigate();
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

  const totalPages = Math.max(pagination.totalPages || 0, 1);

  const handleOpenClass = (classId: string) => {
    if (classId) {
      navigate(`/classes/${classId}`);
    }
  };

  return (
    <>
      <div className="sticky-controls no-print">
        <ShellHeader activeView="history" />
      </div>
      <section className="history-panel">
        <div className="history-toolbar">
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
                    <th>Hành động</th>
                    <th>Trùng lớp</th>
                    <th>Thay đổi</th>
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
                          onClick={() => handleOpenClass(item.classId)}
                          disabled={!item.classId}
                        >
                          {getClassLabel(item)}
                        </button>
                        <div className="history-class-meta">{getClassSubLabel(item)}</div>
                      </td>
                      <td>
                        {actionLabel[item.action || ''] || (item.action ? item.action : 'Tạo mới')}
                      </td>
                      <td>
                        {item.duplicateDetected ? 'Có' : 'Không'}
                      </td>
                      <td><ChangesSummary item={item} /></td>
                      <td>
                        <div>{sourceTypeLabel[item.sourceType] || item.sourceType}</div>
                        <small className="text-muted history-source-name">{item.sourceName || '-'}</small>
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
    </>
  );
}

export default ImportHistoryView;
