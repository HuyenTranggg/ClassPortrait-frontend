import { useState, useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { classApi } from '../../services/class.api';
import { ExamSessionPDFData, ExamCandidateStudent } from '../types/examPdf.types';
import { formatExamDateVi, formatDob, formatExamTime, buildPdfFileName } from '../utils/examPdfFormatter';
import { Student } from '../../../../types/Student';
import { Class } from '../../../../types/Class';

export interface UseExportExamPDFResult {
  isExporting: boolean;
  exportError: string | null;
  exportPDF: (classIds: string[], fileNameHint?: string) => Promise<void>;
}

/**
 * Hook xuất file PDF danh sách thí sinh dự thi.
 * 
 * Nhận vào mảng classIds → fetch thông tin lớp + sinh viên →
 * render HTML → chụp canvas từng trang → ghép jsPDF → download.
 * 
 * @returns Trạng thái đang xuất, lỗi (nếu có), và hàm kích hoạt xuất PDF.
 */
export function useExportExamPDF(): UseExportExamPDFResult {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const exportPDF = useCallback(async (classIds: string[], fileNameHint?: string) => {
    if (!classIds || classIds.length === 0) {
      setExportError('Không có lớp thi nào để xuất PDF.');
      return;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      // 1. Fetch thông tin lớp + danh sách sinh viên song song
      const sessionDataList = await fetchAllSessionData(classIds);

      if (sessionDataList.length === 0) {
        setExportError('Không lấy được dữ liệu lớp thi.');
        return;
      }

      // 2. Tách sub-session theo mã lớp học (mỗi classCode = 1 trang PDF riêng)
      //    Mục đích: sau thi, bó danh sách theo lớp để nộp ban đào tạo
      //    Không ảnh hưởng DB: 1 phòng = 1 lớp thi, chỉ tách khi in PDF
      const splitSessions = splitSessionsByClassCode(sessionDataList);

      // 3. Sắp xếp theo đúng thứ tự của thầy: MaHP → MaLopHoc → MaKip → PhongThi
      const sortedSessions = sortSessionsForPDF(splitSessions);

      // 4. Render từng trang PDF
      await renderAndDownloadPDF(sortedSessions, fileNameHint);
    } catch (err: any) {
      console.error('[useExportExamPDF] Error:', err);
      setExportError(err?.message || 'Có lỗi xảy ra khi xuất PDF.');
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { isExporting, exportError, exportPDF };
}

// ─── Private helpers ──────────────────────────────────────────────────────────

/**
 * Trích xuất số thứ tự kíp thi từ chuỗi (ví dụ: "Kíp 2" → 2, "3" → 3).
 * Trả về Infinity nếu không có số, để đẩy các session không có kíp xuống cuối.
 */
function extractShiftNumber(shift: string | undefined): number {
  if (!shift) return Infinity;
  const match = shift.match(/\d+/);
  return match ? parseInt(match[0], 10) : Infinity;
}

/**
 * Tách 1 session có nhiều mã lớp học thành nhiều sub-sessions.
 * Mục đích: mỗi mã lớp học = 1 trang PDF riêng (Force New Page).
 * Sinh viên không có mã lớp (SV bù) được gom vào 1 trang riêng ở cuối phòng đó.
 *
 * Logic:
 *   - Nếu session chỉ có 1 classCode (hoặc không có) → giữ nguyên
 *   - Nếu session có nhiều classCodes → tách thành N sub-sessions
 *   - SV không có classCode trong 1 session đa-lớp → 1 sub-session riêng (cuối)
 */
function splitSessionsByClassCode(sessions: ExamSessionPDFData[]): ExamSessionPDFData[] {
  const result: ExamSessionPDFData[] = [];

  for (const session of sessions) {
    // Phân nhóm SV theo classCode
    const groupedByCode = new Map<string, ExamCandidateStudent[]>();
    const noCodeStudents: ExamCandidateStudent[] = [];

    for (const student of session.students) {
      const code = student.classCode?.trim() || '';
      if (!code) {
        noCodeStudents.push(student);
      } else {
        if (!groupedByCode.has(code)) groupedByCode.set(code, []);
        groupedByCode.get(code)!.push(student);
      }
    }

    const hasMultipleCodes = groupedByCode.size > 1 || (groupedByCode.size === 1 && noCodeStudents.length > 0);

    if (!hasMultipleCodes) {
      // Chỉ có 1 nhóm (hoặc không có classCode) → giữ nguyên, không tách
      result.push(session);
      continue;
    }

    // Tạo 1 sub-session cho mỗi classCode (sắp xếp mã lớp tăng dần)
    const sortedCodes = Array.from(groupedByCode.keys()).sort((a, b) =>
      a.localeCompare(b, 'vi', { sensitivity: 'base' })
    );
    for (const code of sortedCodes) {
      const students = groupedByCode.get(code)!;
      const renumbered = students.map((s, idx) => ({ ...s, order: idx + 1 }));
      // Lấy instructor theo thứ tự: instructors map của lớp (từ DB), rồi student.instructor, rồi session.instructor
      const subInstructor =
        session.instructors?.[code] ??
        renumbered[0]?.instructor ??
        session.instructor;
      result.push({
        ...session,
        instructor: subInstructor,
        classCodes: [code],
        students: renumbered,
      });
    }

    // SV không có mã lớp → 1 sub-session riêng ở cuối
    if (noCodeStudents.length > 0) {
      const renumbered = noCodeStudents.map((s, idx) => ({ ...s, order: idx + 1 }));
      result.push({
        ...session,
        classCodes: [],   // Không có mã lớp → hiển thị trống
        students: renumbered,
      });
    }
  }

  return result;
}

/**
 * Sắp xếp danh sách lớp thi theo thứ tự của thầy (Access Report):
 *   1. Mã học phần (courseCode)  → tăng dần
 *   2. Mã lớp học (classCode)    → tăng dần
 *   3. Kíp thi (examShift)       → tăng dần (theo số)
 *   4. Phòng thi (examRoom)      → tăng dần
 */
function sortSessionsForPDF(sessions: ExamSessionPDFData[]): ExamSessionPDFData[] {
  return [...sessions].sort((a, b) => {
    // 1. Mã học phần
    const cmp1 = (a.courseCode ?? '').localeCompare(b.courseCode ?? '', 'vi', { sensitivity: 'base' });
    if (cmp1 !== 0) return cmp1;

    // 2. Mã lớp học (dùng classCode đầu tiên trong mảng)
    const aCode = a.classCodes[0] ?? '';
    const bCode = b.classCodes[0] ?? '';
    const cmp2 = aCode.localeCompare(bCode, 'vi', { sensitivity: 'base' });
    if (cmp2 !== 0) return cmp2;

    // 3. Kíp thi (sort theo số để "Kíp 2" < "Kíp 10")
    const shiftDiff = extractShiftNumber(a.examShift) - extractShiftNumber(b.examShift);
    if (shiftDiff !== 0) return shiftDiff;

    // 4. Phòng thi
    return (a.examRoom ?? '').localeCompare(b.examRoom ?? '', 'vi', { sensitivity: 'base' });
  });
}

/**
 * Fetch thông tin lớp và sinh viên cho tất cả classIds.
 * Thực hiện song song để giảm thời gian chờ.
 */
async function fetchAllSessionData(classIds: string[]): Promise<ExamSessionPDFData[]> {
  const results = await Promise.allSettled(
    classIds.map(async (classId) => {
      const [classInfo, students] = await Promise.all([
        classApi.getById(classId),
        classApi.getStudents(classId),
      ]);
      return buildSessionData(classInfo, students);
    })
  );

  const sessions: ExamSessionPDFData[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      sessions.push(result.value);
    } else if (result.status === 'rejected') {
      console.warn('[useExportExamPDF] Failed to fetch session:', result.reason);
    }
  }
  return sessions;
}

/**
 * Chuyển đổi ClassEntity + Students → ExamSessionPDFData.
 */
function buildSessionData(classInfo: Class, students: Student[]): ExamSessionPDFData {
  // Chuẩn bị danh sách sinh viên theo thứ tự importOrder
  const sortedStudents = [...students].sort((a, b) => (a.importOrder ?? 0) - (b.importOrder ?? 0));
  const classCodesSet = new Set<string>();

  const examStudents: ExamCandidateStudent[] = sortedStudents.map((s, idx) => {
    const code = s.classCode ?? '';
    if (code) classCodesSet.add(code);
    return {
      order: idx + 1,
      mssv: s.mssv,
      fullName: s.fullName ?? s.name ?? '',
      dob: s.dob ? formatDob(s.dob) : undefined,
      classCode: code,
      className: s.className ?? undefined,
      instructor: s.instructor ?? undefined,
    };
  });

  let invigilator: string | undefined;
  try {
    const stored = localStorage.getItem('ClassPortrait_Invigilators');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (classInfo.id && parsed[classInfo.id]) {
        invigilator = parsed[classInfo.id];
      }
    }
  } catch (e) {
    console.error('Error reading invigilator from localStorage', e);
  }

  return {
    courseCode: classInfo.courseCode ?? '',
    courseName: classInfo.courseName ?? '',
    semester: classInfo.semester ?? '',
    department: classInfo.department ?? '',
    instructor: classInfo.instructor ?? '',
    instructors: (classInfo as any).instructors ?? undefined,
    invigilator,
    classExamCode: classInfo.classExamCode,
    classCodes: Array.from(classCodesSet).sort(),
    examDateFormatted: classInfo.examDate ? formatExamDateVi(classInfo.examDate) : undefined,
    examDateRaw: classInfo.examDate ? String(classInfo.examDate) : undefined,
    examRoom: classInfo.examRoom ?? undefined,
    examTimeFormatted: classInfo.examTime ? formatExamTime(classInfo.examTime) : undefined,
    examShift: classInfo.examShift ?? undefined,
    students: examStudents,
  };
}

/**
 * Render HTML off-screen cho từng lớp thi, chụp bằng html2canvas,
 * rồi ghép vào jsPDF và download.
 */
async function renderAndDownloadPDF(sessions: ExamSessionPDFData[], fileNameHint?: string): Promise<void> {
  // Tạo container ẩn để render HTML
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '210mm';
  container.style.background = '#fff';
  container.style.zIndex = '-1';
  document.body.appendChild(container);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const A4_WIDTH_MM = 210;
  const A4_HEIGHT_MM = 297;

  try {
    for (let i = 0; i < sessions.length; i++) {
      const session = sessions[i];

      let startIndex = 0;
      let pageIndex = 0;

      while (startIndex < session.students.length) {
        // Dự đoán ban đầu tối đa 38 sinh viên/trang
        let endIndex = Math.min(startIndex + 38, session.students.length);
        let chunkStudents = session.students.slice(startIndex, endIndex);
        
        container.innerHTML = buildPageHTML({ ...session, students: chunkStudents }, session.students.length);
        
        // Buộc trình duyệt tính toán lại layout ngay lập tức
        void container.offsetHeight;

        const A4_ASPECT = 297 / 210;
        // Chừa lại 1 chút buffer an toàn (ví dụ 1px)
        const maxAllowedHeight = container.offsetWidth * A4_ASPECT - 1;

        // Nếu chiều cao vượt quá A4 (do rớt dòng), giảm số sinh viên xuống từng người một
        while (container.offsetHeight > maxAllowedHeight && endIndex > startIndex + 1) {
          endIndex--;
          chunkStudents = session.students.slice(startIndex, endIndex);
          container.innerHTML = buildPageHTML({ ...session, students: chunkStudents }, session.students.length);
          void container.offsetHeight; 
        }

        // Chờ fonts và layout thực sự ổn định trước khi chụp
        await new Promise<void>((resolve) => setTimeout(resolve, 120));

        // Chụp canvas
        const canvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          width: container.offsetWidth,
          windowWidth: container.offsetWidth,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        const canvasAspect = canvas.height / canvas.width;
        const imgHeightMM = A4_WIDTH_MM * canvasAspect;

        // Ghép vào PDF (mỗi trang HTML = 1 trang PDF)
        if (i > 0 || pageIndex > 0) {
          pdf.addPage('a4', 'portrait');
        }

        // Vẽ ảnh với chiều rộng bằng A4, chiều cao tự động theo tỷ lệ canvas
        pdf.addImage(imgData, 'JPEG', 0, 0, A4_WIDTH_MM, imgHeightMM);

        startIndex = endIndex;
        pageIndex++;
      }
    }

    // Tạo tên file
    const firstSession = sessions[0];
    const fileName = fileNameHint ?? buildPdfFileName(firstSession.courseCode, firstSession.semester);
    pdf.save(fileName);
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Sinh chuỗi HTML của 1 trang PDF cho 1 lớp thi.
 * Thiết kế bám sát mẫu IT3280_DanhSachDuThi.
 */
function buildPageHTML(session: ExamSessionPDFData, totalStudents: number): string {
  const {
    courseCode, courseName, department, instructor, invigilator,
    classExamCode, classCodes, examDateFormatted, examRoom,
    examTimeFormatted, examShift, students,
  } = session;

  const siso = totalStudents;
  const examRoomDisplay = examRoom ?? '';
  const examShiftDisplay = examShift ?? '';
  const examTimeDisplay = examTimeFormatted ?? '';
  const examDateDisplay = examDateFormatted ?? '';

  const rows = students.map((s, idx) => {
    const bgColor = idx % 2 === 1 ? 'background:#e8e8e8;' : 'background:#ffffff;';
    return `
    <tr style="${bgColor}">
      <td style="border:1px solid #000;padding:1px 4px;text-align:center;width:5%">${s.order}</td>
      <td style="border:1px solid #000;padding:1px 4px;width:12%;word-wrap:break-word">${escHtml(s.mssv)}</td>
      <td style="border:1px solid #000;padding:1px 4px;width:27%;word-wrap:break-word">${escHtml(s.fullName)}</td>
      <td style="border:1px solid #000;padding:1px 4px;text-align:center;width:12%">${escHtml(s.dob ?? '')}</td>
      <td style="border:1px solid #000;padding:1px 4px;width:29%;word-wrap:break-word">${escHtml(s.className ?? '')}</td>
      <td style="border:1px solid #000;padding:1px 4px;width:15%"></td>
    </tr>
  `}).join('');

  return `
    <div style="
      font-family: 'Calibri', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 13px;
      color: #000;
      padding: 10mm;
      width: 210mm;
      box-sizing: border-box;
      background: #fff;
    ">
      <!-- ═══ HEADER ═══ -->
      <div style="margin-bottom:12px">
        <div style="display:flex; align-items:flex-start;">
          <div style="width:48%; font-size:13px; font-weight:bold; text-transform:uppercase; word-wrap:break-word; padding-right:8px;">
            Đại học Bách Khoa Hà Nội
          </div>
          <div style="flex:1; text-align:center; font-size:17px; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; word-wrap:break-word;">
            Danh sách thí sinh dự thi
          </div>
        </div>
        <div style="display:flex; align-items:flex-start; margin-top:4px;">
          <div style="width:48%; font-size:13px; font-weight:bold; text-transform:uppercase; word-wrap:break-word; padding-right:8px;">
            ${escHtml(department)}
          </div>
          <div style="flex:1; text-align:center; font-size:13px; word-wrap:break-word;">
            <strong>Học phần: ${escHtml((courseName || '').toUpperCase())}${courseCode ? ` (${escHtml(courseCode)})` : ''}</strong>
          </div>
        </div>
      </div>

      <!-- ═══ META ═══ -->
      <table style="width:100%; font-size:13px; margin-bottom:6px; border-collapse:collapse; table-layout:fixed;">
        <tr>
          <td style="width:25%; padding: 3px 0; vertical-align: top;">
            <div style="word-wrap: break-word;">
              Ngày Thi:&nbsp;&nbsp;&nbsp;${escHtml(examDateDisplay)}
            </div>
          </td>
          <td style="width:40%; padding: 3px 0; vertical-align: top;">
            <div style="width:95%; line-height: 1.4;">
              <span style="white-space:nowrap;">GV:&nbsp;</span>
              <span style="font-style:italic;">${escHtml(instructor)}</span>
            </div>
          </td>
          <td style="width:15%; padding: 3px 0; padding-right:16px; vertical-align: top;">
            <div style="display:flex; justify-content:flex-end; align-items:center;">
              <span style="white-space:nowrap;">Sĩ số:</span>
              <strong style="margin-left:8px; min-width: 45px; text-align:left;">${siso}</strong>
            </div>
          </td>
          <td style="width:20%; padding: 3px 0; vertical-align: top;">
            <div style="display:flex; justify-content:flex-end; align-items:center;">
              <span style="white-space:nowrap;">Phòng thi:</span>
              <span style="background:#000;color:#fff;font-weight:bold;padding:1px 0;font-size:13px;display:inline-block;width:95px;text-align:center;margin-left:8px;">${escHtml(examRoomDisplay)}</span>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding: 3px 0 5px 0; vertical-align: top;">
            <div style="word-wrap: break-word;">
              Mã lớp học:&nbsp;<strong>${escHtml(classCodes.join(', ') || '')}</strong>
            </div>
          </td>
          <td style="padding: 3px 0 5px 0; vertical-align: top;">
            <div style="display:flex; align-items:flex-end; width:95%;">
              <span style="white-space:nowrap;">Giám thị:&nbsp;</span>
              ${invigilator 
                ? `<span style="font-weight:bold;">${escHtml(invigilator)}</span>`
                : `<span style="flex:1; border-bottom:1.5px dotted #000; margin-left:4px; margin-bottom:3px; min-width:20px;"></span>`
              }
            </div>
          </td>
          <td style="padding: 3px 0 5px 0; padding-right:16px; vertical-align: top;">
            <div style="display:flex; justify-content:flex-end; align-items:center;">
              <span style="white-space:nowrap;">Kíp thi:</span>
              <strong style="margin-left:8px; min-width: 45px; text-align:left;">${escHtml(examShiftDisplay)}</strong>
            </div>
          </td>
          <td style="padding: 3px 0 5px 0; vertical-align: top;">
            <div style="display:flex; justify-content:flex-end; align-items:center;">
              <span style="white-space:nowrap;">Giờ thi:</span>
              <span style="background:#000;color:#fff;font-weight:bold;padding:1px 0;font-size:13px;display:inline-block;width:95px;text-align:center;margin-left:8px;">${escHtml(examTimeDisplay)}</span>
            </div>
          </td>
        </tr>
      </table>

      <!-- ═══ TABLE ═══ -->
      <table style="
        width:100%;border-collapse:collapse;
        font-size:14px; table-layout:fixed;
      ">
        <thead>
          <tr style="background:#ffffff">
            <th style="border:1px solid #000;padding:2px;text-align:center;width:5%">STT</th>
            <th style="border:1px solid #000;padding:2px 4px;width:12%">MSSV</th>
            <th style="border:1px solid #000;padding:2px 4px;width:27%">Họ và tên</th>
            <th style="border:1px solid #000;padding:2px 4px;text-align:center;width:12%">Ngày sinh</th>
            <th style="border:1px solid #000;padding:2px 4px;width:29%">Lớp</th>
            <th style="border:1px solid #000;padding:2px 4px;width:15%;text-align:center">Ký tên</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

/** Escape HTML để tránh XSS khi chèn dữ liệu người dùng vào innerHTML */
function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
