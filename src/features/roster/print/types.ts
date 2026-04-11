export type PrintHeaderMode = 'template' | 'components' | 'image';

export type PrintHeaderTemplateId = 'classic' | 'compact' | 'minimal';

export type PrintImageFitMode = 'cover' | 'contain' | 'fill';

export type PrintImageAlign = 'top' | 'center' | 'bottom';

export type PrintComponentKey =
  | 'classCode'
  | 'studentCount'
  | 'examDate'
  | 'instructor'
  | 'proctor'
  | 'examRoom'
  | 'examShift'
  | 'examTime';

export interface PrintHeaderComponentsConfig {
  showSchool: boolean;
  showDepartment: boolean;
  showTitle: boolean;
  showCourse: boolean;
  showClassCode: boolean;
  showStudentCount: boolean;
  showExamDate: boolean;
  showInstructor: boolean;
  showProctor: boolean;
  showExamRoom: boolean;
  showExamShift: boolean;
  showExamTime: boolean;
}

export interface PrintHeaderFieldOverrides {
  schoolText: string;
  titleText: string;
  department: string;
  courseLabel: string;
  examDate: string;
  instructor: string;
  proctor: string;
  examRoom: string;
  examShift: string;
  examTime: string;
  classCode: string;
  studentCount: string;
}

export interface PrintHeaderImageConfig {
  imageDataUrl: string;
  fitMode: PrintImageFitMode;
  align: PrintImageAlign;
  zoomPercent: number;
}

export interface PrintHeaderConfig {
  mode: PrintHeaderMode;
  templateId: PrintHeaderTemplateId;
  components: PrintHeaderComponentsConfig;
  componentOrder: PrintComponentKey[];
  fields: PrintHeaderFieldOverrides;
  image: PrintHeaderImageConfig;
}

export interface PrintHeaderTemplateOption {
  id: PrintHeaderTemplateId;
  title: string;
  description: string;
}
