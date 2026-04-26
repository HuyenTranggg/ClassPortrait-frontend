import React from 'react';
import { PrintHeaderConfig } from '../../types';

interface PrintImageTabProps {
  draftConfig: PrintHeaderConfig;
  onUpdateDraft: (updater: (current: PrintHeaderConfig) => PrintHeaderConfig) => void;
  onUploadImage: (file: File) => Promise<void>;
  onClearImage: () => void;
}

function PrintImageTab({ draftConfig, onUpdateDraft, onUploadImage, onClearImage }: PrintImageTabProps) {
  return (
    <section className="print-header-image-editor">
      <label className="form-label">Tải ảnh header (PNG/JPG/WEBP, tối đa 3MB)</label>
      <input
        type="file"
        className="form-control"
        accept="image/png,image/jpeg,image/webp"
        onChange={async (event) => {
          const inputElement = event.currentTarget;
          const file = inputElement.files?.[0];

          if (file) {
            await onUploadImage(file);
            inputElement.value = '';
          }
        }}
      />

      {draftConfig.image.imageDataUrl && (
        <button type="button" className="btn btn-outline-secondary mt-2" onClick={onClearImage}>
          Xóa ảnh
        </button>
      )}

      <div className="print-image-controls">
        <label className="form-label">Fit mode
          <select
            className="form-select"
            value={draftConfig.image.fitMode}
            onChange={(event) => onUpdateDraft((current) => ({
              ...current,
              image: {
                ...current.image,
                fitMode: event.target.value as PrintHeaderConfig['image']['fitMode'],
              },
            }))}
          >
            <option value="cover">Cover (crop vừa khung)</option>
            <option value="contain">Contain (giữ toàn ảnh)</option>
            <option value="fill">Stretch (kéo giãn)</option>
          </select>
        </label>

        <label className="form-label">Căn dọc
          <select
            className="form-select"
            value={draftConfig.image.align}
            onChange={(event) => onUpdateDraft((current) => ({
              ...current,
              image: {
                ...current.image,
                align: event.target.value as PrintHeaderConfig['image']['align'],
              },
            }))}
          >
            <option value="top">Top</option>
            <option value="center">Center</option>
            <option value="bottom">Bottom</option>
          </select>
        </label>

        <label className="form-label">Zoom/Crop: {draftConfig.image.zoomPercent}%
          <input
            type="range"
            className="form-range"
            min={100}
            max={200}
            step={5}
            value={draftConfig.image.zoomPercent}
            onChange={(event) => onUpdateDraft((current) => ({
              ...current,
              image: {
                ...current.image,
                zoomPercent: Number(event.target.value),
              },
            }))}
          />
        </label>
      </div>
    </section>
  );
}

export default PrintImageTab;
