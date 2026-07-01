import React from 'react';
import { ImportStateSnapshot } from '../../types';
import { ImportProgress } from './ImportProgress';

/**
 * Bước 2: Hiển thị kết quả hệ thống tự động nhận diện các cột cần thiết.
 * Giữ nguyên bố cục UI đã báo cáo, mở rộng phần "CỘT ĐÃ NHẬN DIỆN"
 * để hiển thị tất cả các cột đã nhận diện thay vì chỉ MSSV và Họ tên.
 */
export function StepTwo(props: {
  state: ImportStateSnapshot;
  onBack: () => void;
  onManualMode: () => void;
  onSubmitAuto: () => Promise<void>;
}) {
  const { state } = props;
  const isLoading = state.isImporting || state.isPreviewLoading;

  // Danh sách các trường bắt buộc cần hiển thị đầu tiên
  const requiredFields: { label: string; value: string }[] = [
    { label: 'Cột mã số sinh viên (MSSV)', value: state.autoMssvColumn },
    { label: 'Cột họ và tên', value: state.autoNameColumn },
    { label: 'Cột học kỳ', value: state.autoSemesterColumn },
    { label: 'Cột đơn vị giảng dạy', value: state.autoDepartmentColumn },
    { label: 'Cột mã lớp', value: state.autoClassCodeColumn },
    { label: 'Cột mã học phần', value: state.autoCourseCodeColumn },
    { label: 'Cột tên học phần', value: state.autoCourseNameColumn },
    { label: 'Cột giảng viên', value: state.autoInstructorColumn },
  ];

  // Các trường tùy chọn – chỉ hiển thị nếu nhận diện được
  const optionalFields: { label: string; value: string }[] = [
    { label: 'Cột mã lớp thi', value: state.autoClassExamCodeColumn },
    { label: 'Cột ngày thi', value: state.autoExamDateColumn },
    { label: 'Cột phòng thi', value: state.autoExamRoomColumn },
    { label: 'Cột giờ thi', value: state.autoExamTimeColumn },
    { label: 'Cột kíp thi', value: state.autoExamShiftColumn },
    { label: 'Cột ngày sinh', value: state.autoDobColumn },
    { label: 'Cột giới tính', value: state.autoGenderColumn },
    { label: 'Cột email', value: state.autoEmailColumn },
    { label: 'Cột tên lớp quản lý', value: state.autoClassNameColumn },
  ];

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
        {requiredFields.map(({ label, value }) => (
          <div className="detected-mapping-row" key={label}>
            <span>{label}<span style={{ color: '#dc3545' }}> *</span></span>
            <span style={{ color: value ? undefined : '#dc3545' }}>{value || 'Chưa nhận diện'}</span>
          </div>
        ))}
        {optionalFields.map(({ label, value }) => (
          <div className="detected-mapping-row" key={label}>
            <span>{label}</span>
            <span style={{ color: value ? undefined : '#6c757d', fontStyle: value ? 'normal' : 'italic' }}>
              {value || 'Chưa nhận diện được tự động'}
            </span>
          </div>
        ))}
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
