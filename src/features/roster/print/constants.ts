import { PrintMeta } from '../core/shell/types';
import { PrintComponentKey, PrintHeaderConfig, PrintHeaderTemplateOption } from './types';

export const PRINT_COMPONENT_LABELS: Record<PrintComponentKey, string> = {
  classCode: 'Mã lớp',
  studentCount: 'Sĩ số',
  examDate: 'Ngày thi',
  instructor: 'GV',
  proctor: 'Giám thị',
  examRoom: 'Phòng thi',
  examShift: 'Kíp thi',
  examTime: 'Giờ thi',
};

export const DEFAULT_PRINT_COMPONENT_ORDER: PrintComponentKey[] = [
  'classCode',
  'studentCount',
  'examDate',
  'instructor',
  'examRoom',
  'proctor',
  'examShift',
  'examTime',
];

export const PRINT_HEADER_TEMPLATE_OPTIONS: PrintHeaderTemplateOption[] = [
  {
    id: 'classic',
    title: 'Classic biểu mẫu',
    description: 'Bố cục đầy đủ thông tin theo biểu mẫu thi.',
  },
  {
    id: 'compact',
    title: 'Compact gọn',
    description: 'Tiêu đề + học phần + mã lớp/sĩ số/ngày thi/phòng/giám thị/kíp thi.',
  },
  {
    id: 'minimal',
    title: 'Minimal tối giản',
    description: 'Chỉ giữ tiêu đề, học phần, mã lớp và sĩ số.',
  },
];

/**
 * Tạo cấu hình header in mặc định từ dữ liệu lớp học hiện tại.
 * @param meta Dữ liệu header in lấy từ lớp đang chọn.
 * @returns Cấu hình header mặc định cho modal và renderer.
 */
export const createDefaultPrintHeaderConfig = (meta: PrintMeta): PrintHeaderConfig => {
  return {
    mode: 'template',
    templateId: 'classic',
    components: {
      showSchool: true,
      showDepartment: true,
      showTitle: true,
      showCourse: true,
      showClassCode: true,
      showStudentCount: true,
      showExamDate: true,
      showInstructor: true,
      showProctor: true,
      showExamRoom: true,
      showExamShift: true,
      showExamTime: true,
    },
    componentOrder: [...DEFAULT_PRINT_COMPONENT_ORDER],
    fields: {
      schoolText: 'ĐẠI HỌC BÁCH KHOA HÀ NỘI',
      titleText: 'DANH SÁCH THÍ SINH DỰ THI',
      department: meta.printDepartment || '',
      courseLabel: meta.printCourseLabel || '',
      examDate: meta.printExamDate || '',
      instructor: meta.printInstructor || '',
      proctor: meta.printProctor || '',
      examRoom: meta.printExamRoom || '',
      examShift: meta.printExamShift || '',
      examTime: meta.printExamTime || '',
      classCode: meta.printClassCode || '',
      studentCount: meta.printStudentCount || '',
    },
    image: {
      imageDataUrl: '',
      fitMode: 'cover',
      align: 'center',
      zoomPercent: 100,
    },
  };
};
