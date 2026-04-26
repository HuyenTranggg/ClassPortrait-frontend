import React from 'react';
import { SOURCE_OPTIONS } from '../utils/parsers';
import { ImportStateSnapshot, SourceType } from '../types';

export const ImportProgress = ({ step }: { step: 1 | 2 | 3 | 4 }) => (
  <div className="import-stepper">
    <div className={`import-step ${step >= 1 ? 'is-active' : ''}`}>
      <span className="step-dot">{step > 1 ? '✓' : '1'}</span>
      <span>Chọn nguồn</span>
    </div>
    <div className="step-line" />
    <div className={`import-step ${step >= 2 ? 'is-active' : ''}`}>
      <span className="step-dot">2</span>
      <span>Xác nhận cột</span>
    </div>
    <div className="step-line" />
    <div className={`import-step ${step >= 3 ? 'is-active' : ''}`}>
      <span className="step-dot">3</span>
      <span>Hoàn tất</span>
    </div>
  </div>
);

export function StepOne(props: {
  state: ImportStateSnapshot;
  onSelectSource: (value: SourceType) => void;
  onOpenFilePicker: () => void;
  onMoveSheetToConfirmStep: () => Promise<void>;
  onGoogleSheetUrlChange: (value: string) => void;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDropFile: (file: File) => Promise<void>;
}) {
  const { state } = props;

  return (
    <>
      <p className="import-modal-subtitle">Chọn nguồn dữ liệu</p>
      <ImportProgress step={state.step} />

      <div className="import-source-grid">
        {SOURCE_OPTIONS.map((source) => (
          <button
            key={source.key}
            type="button"
            className={`import-source-card ${state.selectedSource === source.key ? 'is-selected' : ''}`}
            onClick={() => source.isEnabled && props.onSelectSource(source.key)}
            disabled={!source.isEnabled}
          >
            <span className="source-icon">{source.icon}</span>
            <strong>{source.title}</strong>
            <small>{source.subtitle}</small>
          </button>
        ))}
      </div>

      {state.selectedSource === 'excel' && (
        <div
          className={`import-drop-zone ${state.isDragOver ? 'is-drag-over' : ''}`}
          onDragOver={(event) => {
            event.preventDefault();
            props.onDragOver();
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            props.onDragLeave();
          }}
          onDrop={async (event) => {
            event.preventDefault();
            const file = event.dataTransfer.files?.[0];
            if (file) {
              await props.onDropFile(file);
            }
          }}
        >
          <h4>Kéo thả file vào đây</h4>
          <button type="button" className="import-link-button" onClick={props.onOpenFilePicker} disabled={state.isParsing}>
            hoặc click để chọn file
          </button>
          <span className="drop-hint">.xlsx, .xls - tối đa 10MB</span>
        </div>
      )}

      {state.selectedSource === 'gsheet' && (
        <>
          <h5 className="import-section-title">GOOGLE SHEET URL</h5>
          <div className="manual-field-group">
            <label htmlFor="google-sheet-url-input">Link Google Sheet *</label>
            <input
              id="google-sheet-url-input"
              type="url"
              className="form-control"
              value={state.googleSheetUrl}
              onChange={(event) => props.onGoogleSheetUrlChange(event.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              disabled={state.isImporting}
            />
          </div>
          <div className="import-actions">
            <button type="button" className="btn btn-primary" onClick={props.onMoveSheetToConfirmStep} disabled={state.isImporting || state.isParsing}>
              {state.isParsing ? 'Đang kiểm tra...' : 'Tiếp tục'}
            </button>
          </div>
        </>
      )}
    </>
  );
}

export function StepTwo(props: {
  state: ImportStateSnapshot;
  onBack: () => void;
  onManualMode: () => void;
  onSubmitAuto: () => Promise<void>;
}) {
  const { state } = props;

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
        <button type="button" className="btn btn-outline-secondary" onClick={props.onBack} disabled={state.isImporting}>Quay lại</button>
        <button type="button" className="btn btn-primary" onClick={props.onSubmitAuto} disabled={state.selectedSource === 'excel' ? !state.isAutoDetected || state.isImporting : state.isImporting}>
          {state.isImporting ? 'Đang import...' : 'Xác nhận và Import'}
        </button>
      </div>
    </>
  );
}

export function StepThree(props: {
  state: ImportStateSnapshot;
  onClose: () => void;
  onBack: () => void;
  onSubmitManual: () => Promise<void>;
  onManualMssvChange: (value: string) => void;
  onManualNameChange: (value: string) => void;
  onStartRowChange: (value: number) => void;
}) {
  const { state } = props;

  if (state.stepThreeMode === 'success') {
    return (
      <>
        <p className="import-modal-subtitle">Hoàn tất import</p>
        <ImportProgress step={state.step} />
        <div className="import-detection-box is-success"><div><strong>Import thành công</strong><p>{state.message?.text || 'Dữ liệu đã được import thành công.'}</p></div></div>
        <div className="import-actions import-actions-center"><button type="button" className="btn btn-primary" onClick={props.onClose}>Đóng</button></div>
      </>
    );
  }

  return (
    <>
      <p className="import-modal-subtitle">Cấu hình cột thủ công</p>
      <ImportProgress step={state.step} />
      <h5 className="import-section-title">CHỈ ĐỊNH CỘT</h5>

      <div className="manual-field-group">
        <label htmlFor="mssv-column-select">Cột mã số sinh viên (MSSV) *</label>
        <select id="mssv-column-select" className="form-select" value={state.manualMssvColumn} onChange={(event) => props.onManualMssvChange(event.target.value)}>
          <option value="">-- Chọn cột --</option>
          {state.columns.map((column) => <option key={column} value={column}>{column}</option>)}
        </select>
      </div>

      <div className="manual-field-group">
        <label htmlFor="name-column-select">Cột họ và tên</label>
        <select id="name-column-select" className="form-select" value={state.manualNameColumn} onChange={(event) => props.onManualNameChange(event.target.value)}>
          <option value="">-- Chọn cột --</option>
          {state.columns.map((column) => <option key={column} value={column}>{column}</option>)}
        </select>
      </div>

      <div className="manual-field-group">
        <label htmlFor="start-row-select">Dữ liệu bắt đầu từ hàng</label>
        <select id="start-row-select" className="form-select" value={state.startRow} onChange={(event) => props.onStartRowChange(Number(event.target.value))}>
          {Array.from({ length: 10 }, (_, index) => index + 1).map((rowNumber) => <option key={rowNumber} value={rowNumber}>Hàng {rowNumber}</option>)}
        </select>
      </div>

      <div className="import-actions">
        <button type="button" className="btn btn-outline-secondary" onClick={props.onBack} disabled={state.isImporting}>Quay lại</button>
        <button type="button" className="btn btn-primary" onClick={props.onSubmitManual} disabled={!state.manualMssvColumn || !state.manualNameColumn || state.isImporting}>
          {state.isImporting ? 'Đang import...' : 'Xác nhận và Import'}
        </button>
      </div>
    </>
  );
}

export function StepFour(props: {
  state: ImportStateSnapshot;
  onCreateNew: () => Promise<void>;
  onPrepareUpdate: () => void;
  onBackToChoose: () => void;
  onConfirmUpdate: () => Promise<void>;
}) {
  const conflict = props.state.duplicateConflict;
  if (!conflict) return null;

  return (
    <>
      <p className="import-modal-subtitle">Lớp đã tồn tại trong hệ thống</p>
      <ImportProgress step={props.state.step} />
      <div className="import-detection-box is-warning"><div><strong>{conflict.message}</strong><p>Lớp trùng: {conflict.existingClassLabel}</p></div></div>

      {props.state.duplicateStepMode === 'choose' ? (
        <div className="import-actions mt-3">
          <button type="button" className="btn btn-outline-secondary" onClick={props.onCreateNew} disabled={props.state.isImporting}>{props.state.isImporting ? 'Đang xử lý...' : 'Vẫn tạo lớp mới'}</button>
          <button type="button" className="btn btn-primary" onClick={props.onPrepareUpdate} disabled={props.state.isImporting}>Cập nhật lớp đã có</button>
        </div>
      ) : (
        <>
          <h5 className="import-section-title">THAY ĐỔI PHÁT HIỆN</h5>
          {conflict.classFieldChanges.length > 0 && <div className="detected-mapping-card mb-3">{conflict.classFieldChanges.map((change) => <div className="detected-mapping-row" key={`${change.field}-${change.oldValue}-${change.newValue}`}><span>{change.field}</span><strong>{change.oldValue}{' -> '}{change.newValue}</strong></div>)}</div>}
          {conflict.studentChanges.length > 0 && <div className="detected-mapping-card mb-3">{conflict.studentChanges.map((change) => <div className="detected-mapping-row" key={`${change.label}-${change.value}`}><span>{change.label}</span><strong>{change.value}</strong></div>)}</div>}
          {conflict.classFieldChanges.length === 0 && conflict.studentChanges.length === 0 && (
            conflict.fallbackDiffLines.length > 0
              ? <ul className="mb-0">{conflict.fallbackDiffLines.map((line) => <li key={line}>{line}</li>)}</ul>
              : <p className="mb-0 text-muted">Backend không trả về diff chi tiết, hệ thống sẽ cập nhật metadata và danh sách sinh viên của lớp hiện có.</p>
          )}
          <div className="import-actions mt-3">
            <button type="button" className="btn btn-outline-secondary" onClick={props.onBackToChoose} disabled={props.state.isImporting}>Quay lại</button>
            <button type="button" className="btn btn-primary" onClick={props.onConfirmUpdate} disabled={props.state.isImporting}>{props.state.isImporting ? 'Đang cập nhật...' : 'Xác nhận cập nhật lớp'}</button>
          </div>
        </>
      )}
    </>
  );
}
