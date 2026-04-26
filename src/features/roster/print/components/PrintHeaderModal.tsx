import React, { useState } from 'react';
import { PrintMeta } from '../../types';
import { DEFAULT_PRINT_COMPONENT_ORDER, PRINT_COMPONENT_LABELS, PRINT_HEADER_TEMPLATE_OPTIONS } from '../constants';
import { PrintComponentKey, PrintHeaderConfig, PrintHeaderMode } from '../types';
import PrintHeaderRenderer from './PrintHeaderRenderer';
import PrintTemplateTab from './tabs/PrintTemplateTab';
import PrintComponentsTab from './tabs/PrintComponentsTab';
import PrintImageTab from './tabs/PrintImageTab';

interface PrintHeaderModalProps {
  isOpen: boolean;
  draftConfig: PrintHeaderConfig;
  printMeta: PrintMeta;
  errorMessage: string | null;
  onClose: () => void;
  onApplyAndPrint: () => void;
  onUpdateDraft: (updater: (current: PrintHeaderConfig) => PrintHeaderConfig) => void;
  onUploadImage: (file: File) => Promise<void>;
  onClearImage: () => void;
}

/**
 * Cập nhật mode cấu hình header trong draft state.
 * @param mode Mode header người dùng muốn chọn.
 * @param onUpdateDraft Hàm cập nhật draft config.
 * @returns Không trả về giá trị.
 */
const setMode = (
  mode: PrintHeaderMode,
  onUpdateDraft: (updater: (current: PrintHeaderConfig) => PrintHeaderConfig) => void
) => {
  onUpdateDraft((current) => ({
    ...current,
    mode,
  }));
};

function PrintHeaderModal({
  isOpen,
  draftConfig,
  printMeta,
  errorMessage,
  onClose,
  onApplyAndPrint,
  onUpdateDraft,
  onUploadImage,
  onClearImage,
}: PrintHeaderModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="print-header-modal-backdrop no-print" role="dialog" aria-modal="true" aria-label="Cấu hình header in sổ ảnh">
      <div className="print-header-modal-card">
        <div className="print-header-modal-head">
          <div>
            <h2>Tùy chọn header khi in</h2>
            <p>Chọn template có sẵn, tự bật tắt thành phần hoặc dùng ảnh letterhead của trường.</p>
          </div>

          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Đóng</button>
        </div>

        <div className="print-header-mode-tabs">
          <button
            type="button"
            className={`btn ${draftConfig.mode === 'template' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setMode('template', onUpdateDraft)}
          >
            Template có sẵn
          </button>
          <button
            type="button"
            className={`btn ${draftConfig.mode === 'components' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setMode('components', onUpdateDraft)}
          >
            Tùy chỉnh thành phần
          </button>
          <button
            type="button"
            className={`btn ${draftConfig.mode === 'image' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setMode('image', onUpdateDraft)}
          >
            Upload ảnh header
          </button>
        </div>

        <div className="print-header-modal-content">
          <div className="print-header-form-zone">
            {draftConfig.mode === 'template' && (
              <PrintTemplateTab draftConfig={draftConfig} onUpdateDraft={onUpdateDraft} />
            )}

            {draftConfig.mode === 'components' && (
              <PrintComponentsTab draftConfig={draftConfig} onUpdateDraft={onUpdateDraft} />
            )}

            {draftConfig.mode === 'image' && (
              <PrintImageTab
                draftConfig={draftConfig}
                onUpdateDraft={onUpdateDraft}
                onUploadImage={onUploadImage}
                onClearImage={onClearImage}
              />
            )}

            {errorMessage && <div className="alert alert-danger mt-3 mb-0">{errorMessage}</div>}
          </div>

          <div className="print-header-preview-zone">
            <h3>Preview header</h3>
            <div className="print-header-preview-card">
              <PrintHeaderRenderer config={draftConfig} printMeta={printMeta} className="is-preview" />
            </div>
          </div>
        </div>

        <div className="print-header-modal-actions">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Hủy</button>
          <button type="button" className="btn btn-primary" onClick={onApplyAndPrint}>Áp dụng và in</button>
        </div>
      </div>
    </div>
  );
}

export default PrintHeaderModal;
