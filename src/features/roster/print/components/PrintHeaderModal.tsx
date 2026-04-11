import React, { useState } from 'react';
import { PrintMeta } from '../../core/shell/types';
import { DEFAULT_PRINT_COMPONENT_ORDER, PRINT_COMPONENT_LABELS, PRINT_HEADER_TEMPLATE_OPTIONS } from '../constants';
import { PrintComponentKey, PrintHeaderConfig, PrintHeaderMode } from '../types';
import PrintHeaderRenderer from './PrintHeaderRenderer';

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

/**
 * Di chuyển một component key trong danh sách order sang vị trí mới.
 * @param order Mảng thứ tự hiện tại.
 * @param sourceKey Key đang được kéo.
 * @param targetKey Key đích để thả lên.
 * @returns Mảng thứ tự mới sau khi di chuyển.
 */
const moveComponentOrder = (
  order: PrintComponentKey[],
  sourceKey: PrintComponentKey,
  targetKey: PrintComponentKey
): PrintComponentKey[] => {
  if (sourceKey === targetKey) {
    return order;
  }

  const next = [...order];
  const sourceIndex = next.indexOf(sourceKey);
  const targetIndex = next.indexOf(targetKey);

  if (sourceIndex < 0 || targetIndex < 0) {
    return order;
  }

  const [moved] = next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, moved);
  return next;
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
  const [draggingKey, setDraggingKey] = useState<PrintComponentKey | null>(null);
  const orderedComponentKeys = draftConfig.componentOrder?.length
    ? draftConfig.componentOrder
    : DEFAULT_PRINT_COMPONENT_ORDER;

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
              <section className="print-header-template-grid">
                {PRINT_HEADER_TEMPLATE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`print-template-card ${draftConfig.templateId === option.id ? 'is-active' : ''}`}
                    onClick={() => {
                      onUpdateDraft((current) => ({
                        ...current,
                        templateId: option.id,
                      }));
                    }}
                  >
                    <strong>{option.title}</strong>
                    <small>{option.description}</small>
                  </button>
                ))}
              </section>
            )}

            {draftConfig.mode === 'components' && (
              <section className="print-header-components-editor">
                <div className="print-editor-grid">
                  <label><input type="checkbox" checked={draftConfig.components.showSchool} onChange={(event) => onUpdateDraft((current) => ({ ...current, components: { ...current.components, showSchool: event.target.checked } }))} /> Hiển thị tên trường</label>
                  <label><input type="checkbox" checked={draftConfig.components.showDepartment} onChange={(event) => onUpdateDraft((current) => ({ ...current, components: { ...current.components, showDepartment: event.target.checked } }))} /> Hiển thị đơn vị</label>
                  <label><input type="checkbox" checked={draftConfig.components.showTitle} onChange={(event) => onUpdateDraft((current) => ({ ...current, components: { ...current.components, showTitle: event.target.checked } }))} /> Hiển thị tiêu đề</label>
                  <label><input type="checkbox" checked={draftConfig.components.showCourse} onChange={(event) => onUpdateDraft((current) => ({ ...current, components: { ...current.components, showCourse: event.target.checked } }))} /> Hiển thị học phần</label>
                  <label><input type="checkbox" checked={draftConfig.components.showClassCode} onChange={(event) => onUpdateDraft((current) => ({ ...current, components: { ...current.components, showClassCode: event.target.checked } }))} /> Hiển thị mã lớp</label>
                  <label><input type="checkbox" checked={draftConfig.components.showStudentCount} onChange={(event) => onUpdateDraft((current) => ({ ...current, components: { ...current.components, showStudentCount: event.target.checked } }))} /> Hiển thị sĩ số</label>
                  <label><input type="checkbox" checked={draftConfig.components.showExamDate} onChange={(event) => onUpdateDraft((current) => ({ ...current, components: { ...current.components, showExamDate: event.target.checked } }))} /> Hiển thị ngày thi</label>
                  <label><input type="checkbox" checked={draftConfig.components.showInstructor} onChange={(event) => onUpdateDraft((current) => ({ ...current, components: { ...current.components, showInstructor: event.target.checked } }))} /> Hiển thị GV</label>
                  <label><input type="checkbox" checked={draftConfig.components.showExamRoom} onChange={(event) => onUpdateDraft((current) => ({ ...current, components: { ...current.components, showExamRoom: event.target.checked } }))} /> Hiển thị phòng thi</label>
                  <label><input type="checkbox" checked={draftConfig.components.showProctor} onChange={(event) => onUpdateDraft((current) => ({ ...current, components: { ...current.components, showProctor: event.target.checked } }))} /> Hiển thị giám thị</label>
                  <label><input type="checkbox" checked={draftConfig.components.showExamShift} onChange={(event) => onUpdateDraft((current) => ({ ...current, components: { ...current.components, showExamShift: event.target.checked } }))} /> Hiển thị kíp thi</label>
                  <label><input type="checkbox" checked={draftConfig.components.showExamTime} onChange={(event) => onUpdateDraft((current) => ({ ...current, components: { ...current.components, showExamTime: event.target.checked } }))} /> Hiển thị giờ thi</label>
                </div>

                <div className="print-editor-fields">
                  <label className="form-label">Tên trường
                    <input className="form-control" value={draftConfig.fields.schoolText} onChange={(event) => onUpdateDraft((current) => ({ ...current, fields: { ...current.fields, schoolText: event.target.value } }))} />
                  </label>
                  <label className="form-label">Tiêu đề
                    <input className="form-control" value={draftConfig.fields.titleText} onChange={(event) => onUpdateDraft((current) => ({ ...current, fields: { ...current.fields, titleText: event.target.value } }))} />
                  </label>
                  <label className="form-label">Học phần
                    <input className="form-control" value={draftConfig.fields.courseLabel} onChange={(event) => onUpdateDraft((current) => ({ ...current, fields: { ...current.fields, courseLabel: event.target.value } }))} />
                  </label>
                  <label className="form-label">Đơn vị
                    <input className="form-control" value={draftConfig.fields.department} onChange={(event) => onUpdateDraft((current) => ({ ...current, fields: { ...current.fields, department: event.target.value } }))} />
                  </label>
                  <label className="form-label">Mã lớp
                    <input className="form-control" value={draftConfig.fields.classCode} onChange={(event) => onUpdateDraft((current) => ({ ...current, fields: { ...current.fields, classCode: event.target.value } }))} />
                  </label>
                  <label className="form-label">Sĩ số
                    <input className="form-control" value={draftConfig.fields.studentCount} onChange={(event) => onUpdateDraft((current) => ({ ...current, fields: { ...current.fields, studentCount: event.target.value } }))} />
                  </label>
                  <label className="form-label">Ngày thi
                    <input className="form-control" value={draftConfig.fields.examDate} onChange={(event) => onUpdateDraft((current) => ({ ...current, fields: { ...current.fields, examDate: event.target.value } }))} />
                  </label>
                  <label className="form-label">GV
                    <input className="form-control" value={draftConfig.fields.instructor} onChange={(event) => onUpdateDraft((current) => ({ ...current, fields: { ...current.fields, instructor: event.target.value } }))} />
                  </label>
                  <label className="form-label">Phòng thi
                    <input className="form-control" value={draftConfig.fields.examRoom} onChange={(event) => onUpdateDraft((current) => ({ ...current, fields: { ...current.fields, examRoom: event.target.value } }))} />
                  </label>
                  <label className="form-label">Giám thị
                    <input className="form-control" value={draftConfig.fields.proctor} onChange={(event) => onUpdateDraft((current) => ({ ...current, fields: { ...current.fields, proctor: event.target.value } }))} />
                  </label>
                  <label className="form-label">Kíp thi
                    <input className="form-control" value={draftConfig.fields.examShift} onChange={(event) => onUpdateDraft((current) => ({ ...current, fields: { ...current.fields, examShift: event.target.value } }))} />
                  </label>
                  <label className="form-label">Giờ thi
                    <input className="form-control" value={draftConfig.fields.examTime} onChange={(event) => onUpdateDraft((current) => ({ ...current, fields: { ...current.fields, examTime: event.target.value } }))} />
                  </label>
                </div>

                <div className="print-order-editor">
                  <h4>Thứ tự thành phần (kéo thả)</h4>
                  <p>Kéo từng mục để đổi vị trí hiển thị ở header khi in.</p>
                  <div className="print-order-list" role="list" aria-label="Sắp xếp thứ tự thành phần">
                    {orderedComponentKeys.map((key) => (
                      <div
                        key={key}
                        className={`print-order-item ${draggingKey === key ? 'is-dragging' : ''}`}
                        role="listitem"
                        draggable
                        onDragStart={() => setDraggingKey(key)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => {
                          if (!draggingKey) {
                            return;
                          }

                          onUpdateDraft((current) => ({
                            ...current,
                            componentOrder: moveComponentOrder(
                              current.componentOrder?.length
                                ? current.componentOrder
                                : DEFAULT_PRINT_COMPONENT_ORDER,
                              draggingKey,
                              key
                            ),
                          }));

                          setDraggingKey(null);
                        }}
                        onDragEnd={() => setDraggingKey(null)}
                      >
                        <span className="drag-handle" aria-hidden="true">::</span>
                        <strong>{PRINT_COMPONENT_LABELS[key]}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {draftConfig.mode === 'image' && (
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
