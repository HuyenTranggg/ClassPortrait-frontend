import React from 'react';
import { ImportStateSnapshot } from '../../types';
import { ImportProgress } from './ImportProgress';

const IGNORE_OPTION = '';

function ColSelect({
  id,
  label,
  value,
  columns,
  onChange,
  required,
}: {
  id: string;
  label: string;
  value: string;
  columns: string[];
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="manual-mapping-row">
      <label htmlFor={id}>
        {label}{required && <span style={{ color: '#dc3545' }}> *</span>}
      </label>
      <select
        id={id}
        className="form-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {!required && <option value={IGNORE_OPTION}>-- Bỏ qua trường này --</option>}
        {required && <option value="">-- Chọn cột --</option>}
        {columns.map((col) => (
          <option key={col} value={col}>{col}</option>
        ))}
      </select>
    </div>
  );
}

/**
 * Bước 3: Cho phép người dùng tự cấu hình mapping cột.
 * MSSV và Họ tên đặt đầu tiên (bắt buộc), tiếp theo là các trường thông tin lớp
 * (bắt buộc), rồi các trường tùy chọn.
 */
export function StepThree(props: {
  state: ImportStateSnapshot;
  onClose: () => void;
  onBack: () => void;
  onSubmitManual: () => Promise<void>;
  onManualMssvChange: (value: string) => void;
  onManualNameChange: (value: string) => void;
  onManualSemesterChange: (value: string) => void;
  onManualDepartmentChange: (value: string) => void;
  onManualClassCodeChange: (value: string) => void;
  onManualCourseCodeChange: (value: string) => void;
  onManualCourseNameChange: (value: string) => void;
  onManualClassNameChange: (value: string) => void;
  onManualClassExamCodeChange: (value: string) => void;
  onManualExamDateChange: (value: string) => void;
  onManualExamRoomChange: (value: string) => void;
  onManualExamTimeChange: (value: string) => void;
  onManualExamShiftChange: (value: string) => void;
  onManualInstructorChange: (value: string) => void;
  onManualDobChange: (value: string) => void;
  onManualGenderChange: (value: string) => void;
  onManualEmailChange: (value: string) => void;
  onStartRowChange: (value: number) => void;
  onExportPDF?: () => void;
  isExportingPDF?: boolean;
}) {
  const { state } = props;
  const isLoading = state.isImporting || state.isPreviewLoading;
  const cols = state.columns;

  if (state.stepThreeMode === 'success') {
    const classCount = state.lastImportedClassIds?.length ?? 0;
    return (
      <>
        <p className="import-modal-subtitle">Hoàn tất import</p>
        <ImportProgress step={state.step} />
        <div className="import-detection-box is-success"><div><strong>Import thành công</strong><p>{state.message?.text || 'Dữ liệu đã được import thành công.'}</p></div></div>
        <div className="import-actions import-actions-center" style={{ gap: '10px', flexWrap: 'wrap' }}>
          {props.onExportPDF && classCount > 0 && (
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={props.onExportPDF}
              disabled={props.isExportingPDF}
              title="Tải về file PDF danh sách thí sinh dự thi cho tất cả lớp thi"
            >
              {props.isExportingPDF ? (
                <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />Đang xuất PDF...</>
              ) : (
                <><i className="bi bi-file-earmark-pdf me-1" />Xuất PDF danh sách dự thi</>
              )}
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={props.onClose}>Đóng</button>
        </div>
      </>
    );
  }

  const canSubmit = !!state.manualMssvColumn && !!state.manualNameColumn && !isLoading;

  return (
    <>
      <p className="import-modal-subtitle">Cấu hình cột thủ công</p>
      <ImportProgress step={state.step} />

      <div className="manual-field-group mb-3 mt-3">
        <label htmlFor="start-row-select">Dữ liệu bắt đầu từ hàng</label>
        <select id="start-row-select" className="form-select" value={state.startRow} onChange={(e) => props.onStartRowChange(Number(e.target.value))}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>Hàng {n}</option>
          ))}
        </select>
      </div>

      <h5 className="import-section-title">CHỈ ĐỊNH CỘT</h5>
      <div className="manual-mapping-container detected-mapping-card">

        <ColSelect id="mssv-column-select" label="Cột mã số sinh viên (MSSV)" value={state.manualMssvColumn} columns={cols} onChange={props.onManualMssvChange} required />
        <ColSelect id="name-column-select" label="Cột họ và tên" value={state.manualNameColumn} columns={cols} onChange={props.onManualNameChange} required />
        <ColSelect id="semester-column-select" label="Cột học kỳ" value={state.manualSemesterColumn} columns={cols} onChange={props.onManualSemesterChange} required />
        <ColSelect id="department-column-select" label="Cột đơn vị giảng dạy" value={state.manualDepartmentColumn} columns={cols} onChange={props.onManualDepartmentChange} required />
        <ColSelect id="classcode-column-select" label="Cột mã lớp" value={state.manualClassCodeColumn} columns={cols} onChange={props.onManualClassCodeChange} required />
        <ColSelect id="coursecode-column-select" label="Cột mã học phần" value={state.manualCourseCodeColumn} columns={cols} onChange={props.onManualCourseCodeChange} required />
        <ColSelect id="coursename-column-select" label="Cột tên học phần" value={state.manualCourseNameColumn} columns={cols} onChange={props.onManualCourseNameChange} required />
        <ColSelect id="instructor-column-select" label="Cột giảng viên" value={state.manualInstructorColumn} columns={cols} onChange={props.onManualInstructorChange} required />

        <ColSelect id="classexamcode-column-select" label="Cột mã lớp thi" value={state.manualClassExamCodeColumn} columns={cols} onChange={props.onManualClassExamCodeChange} />
        <ColSelect id="examdate-column-select" label="Cột ngày thi" value={state.manualExamDateColumn} columns={cols} onChange={props.onManualExamDateChange} />
        <ColSelect id="examroom-column-select" label="Cột phòng thi" value={state.manualExamRoomColumn} columns={cols} onChange={props.onManualExamRoomChange} />
        <ColSelect id="examtime-column-select" label="Cột giờ thi" value={state.manualExamTimeColumn} columns={cols} onChange={props.onManualExamTimeChange} />
        <ColSelect id="examshift-column-select" label="Cột kíp thi" value={state.manualExamShiftColumn} columns={cols} onChange={props.onManualExamShiftChange} />
        <ColSelect id="classname-column-select" label="Cột tên lớp quản lý" value={state.manualClassNameColumn} columns={cols} onChange={props.onManualClassNameChange} />
        <ColSelect id="dob-column-select" label="Cột ngày sinh" value={state.manualDobColumn} columns={cols} onChange={props.onManualDobChange} />
        <ColSelect id="gender-column-select" label="Cột giới tính" value={state.manualGenderColumn} columns={cols} onChange={props.onManualGenderChange} />
        <ColSelect id="email-column-select" label="Cột email" value={state.manualEmailColumn} columns={cols} onChange={props.onManualEmailChange} />
      </div>

      <div className="import-actions mt-4">
        <button type="button" className="btn btn-outline-secondary" onClick={props.onBack} disabled={isLoading}>Quay lại</button>
        <button type="button" className="btn btn-primary" onClick={props.onSubmitManual} disabled={!canSubmit}>
          {isLoading ? 'Đang phân tích...' : 'Tiếp tục →'}
        </button>
      </div>
    </>
  );
}
