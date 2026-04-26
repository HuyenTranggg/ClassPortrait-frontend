import { useEffect, useState } from 'react';
import { PrintMeta } from '../../types';
import { createDefaultPrintHeaderConfig, DEFAULT_PRINT_COMPONENT_ORDER } from '../constants';
import { PrintHeaderConfig } from '../types';

/**
 * Đọc file ảnh thành chuỗi data URL để hiển thị trực tiếp trên frontend.
 * @param file File ảnh người dùng tải lên.
 * @returns Chuỗi data URL dùng cho preview và in.
 */
const readImageAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Không đọc được dữ liệu ảnh.'));
      }
    };

    reader.onerror = () => reject(new Error('Không thể đọc file ảnh.'));
    reader.readAsDataURL(file);
  });
};

/**
 * Quản lý trạng thái modal cấu hình header in và dữ liệu draft.
 * @param meta Dữ liệu in của lớp đang chọn.
 * @returns Trạng thái và action cho modal cấu hình header in.
 */
export const usePrintHeaderController = (meta: PrintMeta) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [activeConfig, setActiveConfig] = useState<PrintHeaderConfig>(() => createDefaultPrintHeaderConfig(meta));
  const [draftConfig, setDraftConfig] = useState<PrintHeaderConfig>(() => createDefaultPrintHeaderConfig(meta));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setActiveConfig((prev) => ({
      ...prev,
      fields: {
        ...prev.fields,
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
    }));
  }, [
    meta.printClassCode,
    meta.printCourseLabel,
    meta.printDepartment,
    meta.printExamDate,
    meta.printExamRoom,
    meta.printExamShift,
    meta.printExamTime,
    meta.printInstructor,
    meta.printProctor,
    meta.printStudentCount,
  ]);

  /**
   * Mở modal và khởi tạo dữ liệu draft từ cấu hình đang áp dụng.
   * @returns Không trả về giá trị.
   */
  const openModal = () => {
    setDraftConfig({
      ...activeConfig,
      componentOrder: activeConfig.componentOrder?.length
        ? activeConfig.componentOrder
        : [...DEFAULT_PRINT_COMPONENT_ORDER],
    });
    setErrorMessage(null);
    setModalOpen(true);
  };

  /**
   * Đóng modal cấu hình header in.
   * @returns Không trả về giá trị.
   */
  const closeModal = () => {
    setModalOpen(false);
  };

  /**
   * Cập nhật một phần cấu hình draft khi người dùng thao tác trong modal.
   * @param updater Hàm nhận cấu hình hiện tại và trả về cấu hình mới.
   * @returns Không trả về giá trị.
   */
  const updateDraftConfig = (updater: (current: PrintHeaderConfig) => PrintHeaderConfig) => {
    setDraftConfig((current) => updater(current));
  };

  /**
   * Nạp ảnh header người dùng tải lên vào draft config.
   * @param file File ảnh cần dùng làm header.
   * @returns Không trả về giá trị.
   */
  const uploadImage = async (file: File) => {
    const isSupported = ['image/png', 'image/jpeg', 'image/webp'].includes(file.type);
    if (!isSupported) {
      setErrorMessage('Chỉ hỗ trợ ảnh PNG, JPG hoặc WEBP.');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setErrorMessage('Ảnh tối đa 3MB để đảm bảo hiệu năng khi in.');
      return;
    }

    try {
      const dataUrl = await readImageAsDataUrl(file);
      setErrorMessage(null);
      setDraftConfig((current) => ({
        ...current,
        mode: 'image',
        image: {
          ...current.image,
          imageDataUrl: dataUrl,
        },
      }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể xử lý ảnh.');
    }
  };

  /**
   * Xóa ảnh header custom ở draft config.
   * @returns Không trả về giá trị.
   */
  const clearDraftImage = () => {
    setDraftConfig((current) => ({
      ...current,
      image: {
        ...current.image,
        imageDataUrl: '',
      },
    }));
  };

  /**
   * Áp dụng cấu hình draft làm cấu hình chính để render khi in.
   * @returns Cấu hình header đã được áp dụng.
   */
  const applyDraftConfig = (): PrintHeaderConfig => {
    const normalizedConfig: PrintHeaderConfig = {
      ...draftConfig,
      componentOrder: draftConfig.componentOrder?.length
        ? draftConfig.componentOrder
        : [...DEFAULT_PRINT_COMPONENT_ORDER],
    };

    setActiveConfig(normalizedConfig);
    return normalizedConfig;
  };

  return {
    isModalOpen,
    activeConfig,
    draftConfig,
    errorMessage,
    openModal,
    closeModal,
    updateDraftConfig,
    uploadImage,
    clearDraftImage,
    applyDraftConfig,
  };
};

export default usePrintHeaderController;
