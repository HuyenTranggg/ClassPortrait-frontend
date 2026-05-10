import React from 'react';
import { SOURCE_OPTIONS } from '../../utils/parsers';
import { ImportStateSnapshot, SourceType } from '../../types';
import { ImportProgress } from './ImportProgress';

/**
 * Bước 1: Cho phép người dùng chọn nguồn dữ liệu (File Excel hoặc Link Google Sheet).
 * Xử lý việc tải file hoặc nhập link tương ứng.
 * 
 * @param props.state Trạng thái hiện tại của quá trình import.
 * @param props.onSelectSource Callback khi người dùng chọn loại nguồn dữ liệu.
 * @param props.onOpenFilePicker Callback mở hộp thoại chọn file trên máy tính.
 * @param props.onMoveSheetToConfirmStep Callback chuyển sang bước 2 sau khi nhập link Google Sheet.
 * @param props.onGoogleSheetUrlChange Callback cập nhật link Google Sheet do người dùng nhập.
 * @param props.onDragOver Callback xử lý hiệu ứng khi kéo file vào vùng drop zone.
 * @param props.onDragLeave Callback xử lý hiệu ứng khi bỏ kéo file ra khỏi vùng drop zone.
 * @param props.onDropFile Callback xử lý file khi người dùng thả vào drop zone.
 * @returns React Element giao diện bước 1.
 */
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
          onDragOver={(event) => { event.preventDefault(); props.onDragOver(); }}
          onDragLeave={(event) => { event.preventDefault(); props.onDragLeave(); }}
          onDrop={async (event) => {
            event.preventDefault();
            const file = event.dataTransfer.files?.[0];
            if (file) await props.onDropFile(file);
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
