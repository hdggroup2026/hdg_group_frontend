import { authService } from './auth';
import { getApiUrl } from './apiConfig';

export const vehicleService = {
  async getVehicles(params?: { license_plate?: string; status?: string }): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const queryParams = new URLSearchParams();
    if (params?.license_plate) queryParams.append('license_plate', params.license_plate);
    if (params?.status) queryParams.append('status', params.status);
    const queryString = queryParams.toString();
    const url = `${BASE_URL}/vehicle/get-vehicles${queryString ? '?' + queryString : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('getVehicles API Error:', response.status, errorData);
      
      if (errorData.detail && Array.isArray(errorData.detail)) {
        const errorMsg = errorData.detail
          .map((err: any) => {
            const field = err.loc ? err.loc[err.loc.length - 1] : '';
            return `${field ? field + ': ' : ''}${err.msg}`;
          })
          .join(', ');
        throw new Error(errorMsg);
      }

      if (response.status === 401) {
        authService.handle401();
      }
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to fetch vehicles`);
    }

    return await response.json();
  },

  async addVehicles(vehicles: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/vehicle/add-vehicles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(vehicles)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('addVehicles API Error:', response.status, errorData);
      
      if (errorData.detail && Array.isArray(errorData.detail)) {
        const errorMsg = errorData.detail
          .map((err: any) => {
            const field = err.loc ? err.loc[err.loc.length - 1] : '';
            return `${field ? field + ': ' : ''}${err.msg}`;
          })
          .join(', ');
        throw new Error(errorMsg);
      }

      if (response.status === 401) {
        authService.handle401();
      }
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to add vehicles`);
    }

    return await response.json();
  },

  async updateVehicles(vehicles: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/vehicle/update-vehicles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(vehicles)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('updateVehicles API Error:', response.status, errorData);
      
      if (errorData.detail && Array.isArray(errorData.detail)) {
        const errorMsg = errorData.detail
          .map((err: any) => {
            const field = err.loc ? err.loc[err.loc.length - 1] : '';
            return `${field ? field + ': ' : ''}${err.msg}`;
          })
          .join(', ');
        throw new Error(errorMsg);
      }

      if (response.status === 401) {
        authService.handle401();
      }
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to update vehicles`);
    }

    return await response.json();
  },

  async deleteVehicles(ids: string[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/vehicle/delete-vehicles`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(ids)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('deleteVehicles API Error:', response.status, errorData);
      
      if (errorData.detail && Array.isArray(errorData.detail)) {
        const errorMsg = errorData.detail
          .map((err: any) => {
            const field = err.loc ? err.loc[err.loc.length - 1] : '';
            return `${field ? field + ': ' : ''}${err.msg}`;
          })
          .join(', ');
        throw new Error(errorMsg);
      }

      if (response.status === 401) {
        authService.handle401();
      }
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to delete vehicles`);
    }

    return await response.json();
  },

  // ══════════════════════════════════════════════════════════════════
  // MỤC 529 · 530 · 531 · 532 (05/09/2026) — PHƯƠNG TIỆN MỞ RỘNG
  //
  // Gom phần lặp lại của bốn hàm bên trên vào `_goi`. Bốn bản chép tay
  // của cùng một đoạn là bốn chỗ có thể lệch nhau ở lần sửa sau — cùng
  // lý do `otherService.ts` đã gom ở MỤC 436.
  // ══════════════════════════════════════════════════════════════════
  async _goi(duong: string, tuyChon: any = {}): Promise<any> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';

    const response = await fetch(`${BASE_URL}${duong}`, {
      ...tuyChon,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${tokenType} ${token}`,
        'ngrok-skip-browser-warning': 'true'
      }
    });

    if (!response.ok) {
      const loi = await response.json().catch(() => ({}));
      if (response.status === 401) authService.handle401();
      // Hiện NGUYÊN VĂN lý do máy chủ trả về. Lỗi hay gặp nhất của mảng
      // này là "bot chưa ở trong nhóm" — nuốt đi thì người dùng bấm mãi
      // không hiểu vì sao.
      throw new Error(loi.detail || `Error ${response.status}`);
    }
    return await response.json();
  },

  // ── MỤC 529 — danh mục 5 loại xe ─────────────────────────────────
  // 🔴 Lấy từ máy chủ, KHÔNG khai lại ở web. Khai hai nơi là có ngày
  // thêm loại thứ sáu ở một nơi mà quên nơi kia, và mã xe sinh ra sai
  // tiền tố. Nguồn duy nhất: `LOAI_XE` trong `app/models/vehicle.py`.
  async getLoaiXe(): Promise<any[]> {
    return await this._goi('/vehicle/get-loai-xe', { method: 'GET' });
  },

  // ── MỤC 530, sửa ở MỤC 533 — nhóm liên kết theo TỪNG XE ─────────
  // 🔴 s68 chốt 05/09: *"Mỗi nhóm 1 xe."*
  async getNhomXe(vehicleId?: string): Promise<any[]> {
    const duoi = vehicleId ? `?vehicle_id=${encodeURIComponent(vehicleId)}` : '';
    return await this._goi(`/vehicle/get-nhom-xe${duoi}`, { method: 'GET' });
  },

  async addNhomXe(duLieu: any): Promise<any> {
    return await this._goi('/vehicle/add-nhom-xe',
      { method: 'POST', body: JSON.stringify(duLieu) });
  },

  async guiLaiLoiMoiNhom(nhomId: string): Promise<any> {
    return await this._goi(
      `/vehicle/gui-lai-loi-moi-nhom?nhom_id=${encodeURIComponent(nhomId)}`,
      { method: 'POST' });
  },

  async deleteNhomXe(nhomId: string): Promise<any> {
    return await this._goi(
      `/vehicle/delete-nhom-xe?nhom_id=${encodeURIComponent(nhomId)}`,
      { method: 'DELETE' });
  },

  // ── MỤC 531 — hợp đồng bảo hiểm ──────────────────────────────────
  async getBaoHiemXe(vehicleId?: string): Promise<any[]> {
    const duoi = vehicleId ? `?vehicle_id=${encodeURIComponent(vehicleId)}` : '';
    return await this._goi(`/vehicle/get-bao-hiem-xe${duoi}`, { method: 'GET' });
  },

  async addBaoHiemXe(duLieu: any): Promise<any> {
    return await this._goi('/vehicle/add-bao-hiem-xe',
      { method: 'POST', body: JSON.stringify(duLieu) });
  },

  async updateBaoHiemXe(duLieu: any): Promise<any> {
    return await this._goi('/vehicle/update-bao-hiem-xe',
      { method: 'POST', body: JSON.stringify(duLieu) });
  },

  async deleteBaoHiemXe(baoHiemId: string): Promise<any> {
    return await this._goi(
      `/vehicle/delete-bao-hiem-xe?bao_hiem_id=${encodeURIComponent(baoHiemId)}`,
      { method: 'DELETE' });
  },

  // ── MỤC 532 — lịch bảo trì, bảo dưỡng ────────────────────────────
  async getBaoTriXe(params?: { vehicle_id?: string; trang_thai?: string }): Promise<any[]> {
    const q = new URLSearchParams();
    if (params?.vehicle_id) q.append('vehicle_id', params.vehicle_id);
    if (params?.trang_thai) q.append('trang_thai', params.trang_thai);
    const duoi = q.toString() ? `?${q.toString()}` : '';
    return await this._goi(`/vehicle/get-bao-tri-xe${duoi}`, { method: 'GET' });
  },

  async addBaoTriXe(duLieu: any): Promise<any> {
    return await this._goi('/vehicle/add-bao-tri-xe',
      { method: 'POST', body: JSON.stringify(duLieu) });
  },

  async updateBaoTriXe(duLieu: any): Promise<any> {
    return await this._goi('/vehicle/update-bao-tri-xe',
      { method: 'POST', body: JSON.stringify(duLieu) });
  },

  // Đánh dấu xong VÀ hẹn lần tới trong CÙNG một lời gọi. Tách làm hai
  // lời gọi thì lời thứ hai hỏng là lịch mới không bao giờ được đặt, mà
  // người dùng đã thấy "đã xong" rồi.
  async xongBaoTriXe(duLieu: any): Promise<any> {
    return await this._goi('/vehicle/xong-bao-tri-xe',
      { method: 'POST', body: JSON.stringify(duLieu) });
  },

  async deleteBaoTriXe(baoTriId: string): Promise<any> {
    return await this._goi(
      `/vehicle/delete-bao-tri-xe?bao_tri_id=${encodeURIComponent(baoTriId)}`,
      { method: 'DELETE' });
  },
};
