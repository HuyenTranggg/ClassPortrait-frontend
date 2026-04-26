import { Class, Student } from '../../types';

export type ActiveView = 'roster' | 'history' | 'share' | 'dashboard';

export interface RosterMeta {
  courseLabel: string;
  classCodeLabel: string;
  semesterLabel: string;
  studentCountLabel: string;
}

export interface PrintMeta {
  printCourseLabel: string;
  printDepartment: string;
  printExamDate: string;
  printInstructor: string;
  printProctor: string;
  printExamRoom: string;
  printExamShift: string;
  printExamTime: string;
  printClassCode: string;
  printStudentCount: string;
}

export interface ToolbarClassOption extends Class {}

export interface RosterBodyProps {
  loading: boolean;
  error: string | null;
  students: Student[];
  printMeta: PrintMeta;
}
