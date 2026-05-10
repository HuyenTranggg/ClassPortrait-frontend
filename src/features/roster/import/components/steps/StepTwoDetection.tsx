import React from 'react';
import { ImportStateSnapshot } from '../../types';
import { ImportProgress } from './ImportProgress';

/**
 * Bước 2: Hiển thị kết quả hệ thống tự động nhận diện các cột cần thiết (MSSV, Họ tên).
 * Cung cấp tùy chọn cho người dùng xác nhận hoặc chuyển sang chế độ tự chọn (thủ công).
 * 
 * @param props.state Trạng thái hiện tại của quá trình import, chứa kết quả nhận diện tự động.
 * @param props.onBack Callback để quay lại bước trước đó.
 * @param props.onManualMode Callback để chuyển sang chế độ cấu hình cột thủ công (Bước 3).
 * @param props.onSubmitAuto Callback để xác nhận sử dụng cấu hình tự động và tiếp tục.
 * @returns React Element giao diện bước 2.
 */
export function StepTwo(props: {
  state: ImportStateSnapshot;
  onBack: () => void;
  onManualMode: () => void;
  onSubmitAuto: () => Promise<void>;
}) {
  const { state } = props;
  const isLoading = state.isImporting || state.isPreviewLoading;

  return (
    <>
      <p className="import-modal-subtitle">Xác nhận cấu hình cột - nhận diện tự động</p>
      <ImportProgress step={state.step} />
      <div className={`import-detection-box ${state.isAutoDetected ? 'is-success' : 'is-warning'}`}>
        <div>
          <strong>{state.isAutoDetected ? 'Nhận diện tự động thành công' : 'Chưa nhận diện đầy đủ cột, vui lòng chỉnh thủ công'}</strong>
          <p>
            {state.isAutoDetected
              ? `Cột MSSV: ${state.autoMssvColumn} - Cột Họ và tên: ${state.autoNameColumn}`
              : 'Hệ thống chưa xác định chính xác cột MSSV hoặc Họ và tên.'}
          </p>
        </div>
        <button type="button" className="btn btn-outline-secondary" onClick={props.onManualMode}>Chỉnh lại thủ công</button>
      </div>

      <h5 className="import-section-title">CỘT ĐÃ NHẬN DIỆN</h5>
      <div className="detected-mapping-card">
        <div className="detected-mapping-row"><span>Mã số sinh viên (MSSV)</span><strong>{state.autoMssvColumn || 'Chưa nhận diện'}</strong></div>
        <div className="detected-mapping-row"><span>Họ và tên</span><strong>{state.autoNameColumn || 'Chưa nhận diện'}</strong></div>
      </div>

      <div className="import-actions">
        <button type="button" className="btn btn-outline-secondary" onClick={props.onBack} disabled={isLoading}>Quay lại</button>
        <button type="button" className="btn btn-primary" onClick={props.onSubmitAuto} disabled={state.selectedSource === 'excel' ? !state.isAutoDetected || isLoading : isLoading}>
          {isLoading ? 'Đang phân tích...' : 'Tiếp tục →'}
        </button>
      </div>
    </>
  );
}
