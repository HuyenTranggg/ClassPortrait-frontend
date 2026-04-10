import api from '../../../../lib/api';
import {
  CreateShareLinkPayload,
  DeleteShareLinkResponse,
  ShareLink,
  SharedClassResponse,
  UpdateShareLinkPayload,
} from '../../services/class/types';

/**
 * Nhóm API quản lý link chia sẻ sổ ảnh.
 */
export const shareApi = {
  /**
   * Lấy link chia sẻ hiện có của lớp.
   * @param id UUID lớp học.
   * @returns Thông tin link chia sẻ hoặc null.
   */
  getShareLink: async (id: string): Promise<ShareLink | null> => {
    const response = await api.get<ShareLink | null>(`/classes/${id}/share-link`);
    return response.data;
  },

  /**
   * Tạo link chia sẻ mới cho lớp.
   * @param id UUID lớp học.
   * @param payload Cấu hình thời hạn chia sẻ.
   * @returns Link chia sẻ vừa tạo.
   */
  createShareLink: async (id: string, payload?: CreateShareLinkPayload): Promise<ShareLink> => {
    const response = await api.post<ShareLink>(`/classes/${id}/share-link`, payload || {});
    return response.data;
  },

  /**
   * Cập nhật trạng thái hoặc thời hạn link chia sẻ.
   * @param id UUID lớp học.
   * @param payload Dữ liệu cập nhật link.
   * @returns Link chia sẻ sau cập nhật.
   */
  updateShareLink: async (id: string, payload: UpdateShareLinkPayload): Promise<ShareLink> => {
    const response = await api.patch<ShareLink>(`/classes/${id}/share-link`, payload);
    return response.data;
  },

  /**
   * Xóa link chia sẻ của lớp.
   * @param id UUID lớp học.
   * @returns Kết quả thao tác xóa.
   */
  deleteShareLink: async (id: string): Promise<DeleteShareLinkResponse> => {
    const response = await api.delete<DeleteShareLinkResponse>(`/classes/${id}/share-link`);
    return response.data;
  },

  /**
   * Lấy dữ liệu sổ ảnh public từ link chia sẻ.
   * @param params Bộ tham số id/exp/sig từ URL chia sẻ.
   * @returns Dữ liệu lớp public và danh sách sinh viên.
   */
  getSharedClass: async (params: {
    id: string;
    exp: string;
    sig: string;
  }): Promise<SharedClassResponse> => {
    const response = await api.get<SharedClassResponse>(`/classes/shared/${params.id}`, {
      params: {
        exp: params.exp,
        sig: params.sig,
      },
    });

    return response.data;
  },
};

export default shareApi;
