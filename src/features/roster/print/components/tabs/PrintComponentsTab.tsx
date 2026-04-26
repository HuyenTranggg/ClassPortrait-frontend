import React, { useState } from 'react';
import { PrintComponentKey, PrintHeaderConfig } from '../../types';
import { DEFAULT_PRINT_COMPONENT_ORDER, PRINT_COMPONENT_LABELS } from '../../constants';

interface PrintComponentsTabProps {
  draftConfig: PrintHeaderConfig;
  onUpdateDraft: (updater: (current: PrintHeaderConfig) => PrintHeaderConfig) => void;
}

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

function PrintComponentsTab({ draftConfig, onUpdateDraft }: PrintComponentsTabProps) {
  const [draggingKey, setDraggingKey] = useState<PrintComponentKey | null>(null);

  const orderedComponentKeys = draftConfig.componentOrder?.length
    ? draftConfig.componentOrder
    : DEFAULT_PRINT_COMPONENT_ORDER;

  return (
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
  );
}

export default PrintComponentsTab;
