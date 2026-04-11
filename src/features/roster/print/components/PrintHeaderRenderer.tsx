import React from 'react';
import { PrintMeta } from '../../core/shell/types';
import { PrintComponentKey, PrintHeaderConfig } from '../types';
import { DEFAULT_PRINT_COMPONENT_ORDER, PRINT_COMPONENT_LABELS } from '../constants';

interface PrintHeaderRendererProps {
  config: PrintHeaderConfig;
  printMeta: PrintMeta;
  className?: string;
}

/**
 * Trả về chuỗi hiển thị ưu tiên giá trị override rồi đến dữ liệu print meta.
 * @param override Giá trị do người dùng tùy chỉnh.
 * @param fallback Giá trị mặc định từ metadata lớp.
 * @returns Chuỗi dùng để render ra header in.
 */
const pickFieldValue = (override: string, fallback: string): string => {
  return override.trim() || fallback.trim();
};

interface FieldItem {
  key: PrintComponentKey;
  label: string;
  value: string;
}

/**
 * Render danh sách field dưới dạng các item độc lập để dùng cho compact/custom.
 * @param items Danh sách item cần hiển thị.
 * @returns Khối JSX dạng grid item.
 */
const renderFieldItems = (items: FieldItem[]) => {
  return (
    <div className="print-form-grid print-form-grid-custom" role="list" aria-label="Danh sách thành phần header">
      {items.map((item) => (
        <div className="print-field" role="listitem" key={item.key}>
          <span className="print-field-label">{item.label}:</span>
          <span className="print-field-value">{item.value || '\u00A0'}</span>
        </div>
      ))}
    </div>
  );
};

/**
 * Chuẩn hóa thứ tự component để đảm bảo luôn đủ key hợp lệ khi render.
 * @param order Thứ tự lưu trong config.
 * @returns Mảng thứ tự đã loại trùng và bổ sung key thiếu.
 */
const normalizeComponentOrder = (order: PrintComponentKey[]): PrintComponentKey[] => {
  const deduped = order.filter((key, index) => order.indexOf(key) === index);
  const missing = DEFAULT_PRINT_COMPONENT_ORDER.filter((key) => !deduped.includes(key));
  return [...deduped, ...missing];
};

/**
 * Render phần header in theo cấu hình người dùng chọn trong modal.
 * @param props Dữ liệu cần thiết để render header in.
 * @returns Khối JSX header tương ứng template/components/image.
 */
function PrintHeaderRenderer({ config, printMeta, className }: PrintHeaderRendererProps) {
  const schoolText = pickFieldValue(config.fields.schoolText, 'ĐẠI HỌC BÁCH KHOA HÀ NỘI');
  const titleText = pickFieldValue(config.fields.titleText, 'DANH SÁCH THÍ SINH DỰ THI');
  const department = pickFieldValue(config.fields.department, printMeta.printDepartment || '');
  const courseLabel = pickFieldValue(config.fields.courseLabel, printMeta.printCourseLabel || '');
  const examDate = pickFieldValue(config.fields.examDate, printMeta.printExamDate || '');
  const instructor = pickFieldValue(config.fields.instructor, printMeta.printInstructor || '');
  const proctor = pickFieldValue(config.fields.proctor, printMeta.printProctor || '');
  const examRoom = pickFieldValue(config.fields.examRoom, printMeta.printExamRoom || '');
  const examShift = pickFieldValue(config.fields.examShift, printMeta.printExamShift || '');
  const examTime = pickFieldValue(config.fields.examTime, printMeta.printExamTime || '');
  const classCode = pickFieldValue(config.fields.classCode, printMeta.printClassCode || '');
  const studentCount = pickFieldValue(config.fields.studentCount, printMeta.printStudentCount || '');

  if (config.mode === 'image' && config.image.imageDataUrl) {
    const objectFit = config.image.fitMode;
    const objectPosition =
      config.image.align === 'top'
        ? 'center top'
        : config.image.align === 'bottom'
          ? 'center bottom'
          : 'center center';

    return (
      <div className={`print-first-header print-header-image ${className || ''}`.trim()}>
        <div className="print-header-image-frame">
          <img
            src={config.image.imageDataUrl}
            alt="Header in tùy chỉnh"
            style={{
              objectFit,
              objectPosition,
              transform: `scale(${config.image.zoomPercent / 100})`,
            }}
          />
        </div>
      </div>
    );
  }

  const isTemplateMode = config.mode === 'template';
  const useClassicTemplate = isTemplateMode && config.templateId === 'classic';
  const useCompactTemplate = isTemplateMode && config.templateId === 'compact';
  const useMinimalTemplate = isTemplateMode && config.templateId === 'minimal';
  const orderedKeys = normalizeComponentOrder(config.componentOrder || DEFAULT_PRINT_COMPONENT_ORDER);
  const fieldValueMap: Record<PrintComponentKey, string> = {
    classCode,
    studentCount,
    examDate,
    instructor,
    proctor,
    examRoom,
    examShift,
    examTime,
  };

  const showSchool = useClassicTemplate || (!isTemplateMode && config.components.showSchool);
  const showDepartment = useClassicTemplate || (!isTemplateMode && config.components.showDepartment);
  const showTitle = isTemplateMode || config.components.showTitle;
  const showCourse = isTemplateMode || config.components.showCourse;

  const compactTemplateKeys: PrintComponentKey[] = [
    'classCode',
    'studentCount',
    'examDate',
    'examRoom',
    'proctor',
    'examShift',
  ];

  const compactTemplateItems: FieldItem[] = compactTemplateKeys.map((key) => ({
    key,
    label: PRINT_COMPONENT_LABELS[key],
    value: fieldValueMap[key],
  }));

  const minimalTemplateKeys: PrintComponentKey[] = ['classCode', 'studentCount'];

  const minimalTemplateItems: FieldItem[] = minimalTemplateKeys.map((key) => ({
    key,
    label: PRINT_COMPONENT_LABELS[key],
    value: fieldValueMap[key],
  }));

  const visibleCustomKeys = orderedKeys.filter((key) => {
    if (key === 'classCode') return config.components.showClassCode;
    if (key === 'studentCount') return config.components.showStudentCount;
    if (key === 'examDate') return config.components.showExamDate;
    if (key === 'instructor') return config.components.showInstructor;
    if (key === 'proctor') return config.components.showProctor;
    if (key === 'examRoom') return config.components.showExamRoom;
    if (key === 'examShift') return config.components.showExamShift;
    if (key === 'examTime') return config.components.showExamTime;
    return false;
  });

  const customComponentItems: FieldItem[] = visibleCustomKeys.map((key) => ({
    key,
    label: PRINT_COMPONENT_LABELS[key],
    value: fieldValueMap[key],
  }));

  return (
    <div
      className={[
        'print-first-header',
        'print-header-composed',
        useCompactTemplate ? 'is-compact' : '',
        useMinimalTemplate ? 'is-minimal' : '',
        className || '',
      ].filter(Boolean).join(' ')}
    >
      <div className="print-form-top">
        <div className="print-form-org">
          {showSchool && <p>{schoolText || '\u00A0'}</p>}
          {showDepartment && <p>{department || '\u00A0'}</p>}
        </div>

        <div className="print-form-title">
          {showTitle && <h2>{titleText || '\u00A0'}</h2>}
          {showCourse && <p>Học phần: {courseLabel || '\u00A0'}</p>}
        </div>
      </div>

      {useClassicTemplate && (
        <div className="print-form-grid">
          <div className="print-field"><span className="print-field-label">Ngày thi:</span><span className="print-field-value">{examDate || '\u00A0'}</span></div>
          <div className="print-field"><span className="print-field-label">GV:</span><span className="print-field-value">{instructor || '\u00A0'}</span></div>
          <div className="print-field"><span className="print-field-label">Sĩ số:</span><span className="print-field-value">{studentCount || '\u00A0'}</span></div>
          <div className="print-field"><span className="print-field-label">Phòng thi:</span><span className="print-field-value">{examRoom || '\u00A0'}</span></div>
          <div className="print-field"><span className="print-field-label">Mã lớp học:</span><span className="print-field-value">{classCode || '\u00A0'}</span></div>
          <div className="print-field"><span className="print-field-label">Giám thị:</span><span className="print-field-value">{proctor || '\u00A0'}</span></div>
          <div className="print-field"><span className="print-field-label">Kíp thi:</span><span className="print-field-value">{examShift || '\u00A0'}</span></div>
          <div className="print-field"><span className="print-field-label">Giờ thi:</span><span className="print-field-value">{examTime || '\u00A0'}</span></div>
        </div>
      )}

      {useCompactTemplate && renderFieldItems(compactTemplateItems)}

      {useMinimalTemplate && renderFieldItems(minimalTemplateItems)}

      {!isTemplateMode && customComponentItems.length > 0 && renderFieldItems(customComponentItems)}
    </div>
  );
}

export default PrintHeaderRenderer;
