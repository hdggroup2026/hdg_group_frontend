import { authService } from './auth';
import { getApiUrl } from './apiConfig';

export const otherService = {
  // ══════════════════════════════════════════════════════════════════
  // MỤC 436 (31/08/2026) — QUẢN LÝ APP VÀ LIÊN KẾT APP ↔ THIẾT BỊ
  //
  // Hai bảng `applications` và `installed_apps` đã có trong database từ
  // lâu nhưng chưa có đường API nào. MỤC 436 mở ra, đây là phía web gọi.
  // ══════════════════════════════════════════════════════════════════
  async _goi(duong: string, tuyChon: any = {}): Promise<any> {
    // Gom phần lặp lại của 6 hàm bên dưới. Sáu bản chép tay của cùng một
    // đoạn là sáu chỗ có thể lệch nhau ở lần sửa sau.
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
      // Hiện nguyên văn lý do backend trả về.
      throw new Error(loi.detail || `Error ${response.status}`);
    }
    return await response.json();
  },

  // ══════════════════════════════════════════════════════════════════
  // MỤC 440 (01/09/2026) — PHỤ KIỆN VÀ SIM
  //
  // ⚠️ `deviceId = '__kho__'` để lấy riêng thứ đang trong kho. Chuỗi
  // rỗng bị backend hiểu là "không lọc" — hai ý nghĩa khác hẳn nhau.
  // ══════════════════════════════════════════════════════════════════
  async getAccessories(deviceId?: string, status?: string): Promise<any[]> {
    const q = new URLSearchParams()
    if (deviceId) q.append('device_id', deviceId)
    if (status) q.append('status', status)
    const duoi = q.toString() ? `?${q.toString()}` : ''
    return await this._goi(`/other/get-accessories${duoi}`, { method: 'GET' });
  },

  // ══════════════════════════════════════════════════════════════════
  // MỤC 521 (05/09/2026) — MỘT NGƯỜI ĐANG GIỮ NHỮNG GÌ
  //
  // 🔴 MỘT lời gọi, không phải chín. Backend đã gộp sẵn thiết bị + phụ
  // kiện + SIM theo từng người. Gọi rời rồi tự gộp ở đây là chép lại
  // luật quy đổi hai bộ từ vựng `phone`/`smartphone` sang phía web —
  // hai nơi cùng một luật là có ngày lệch nhau.
  // ══════════════════════════════════════════════════════════════════
  async getNguoiSuDung(username?: string): Promise<any[]> {
    const duoi = username ? `?username=${encodeURIComponent(username)}` : ''
    return await this._goi(`/other/get-nguoi-su-dung${duoi}`, { method: 'GET' });
  },

  async addAccessories(items: any[]): Promise<any[]> {
    return await this._goi('/other/add-accessories',
      { method: 'POST', body: JSON.stringify(items) });
  },

  async updateAccessories(items: any[]): Promise<any[]> {
    return await this._goi('/other/update-accessories',
      { method: 'POST', body: JSON.stringify(items) });
  },

  async deleteAccessories(ids: string[]): Promise<any> {
    return await this._goi('/other/delete-accessories',
      { method: 'DELETE', body: JSON.stringify(ids) });
  },

  /** Gắn phụ kiện vào máy. `deviceId` để trống = trả về kho. */
  async ganPhuKien(maPhuKien: string[], deviceId?: string, deviceType?: string): Promise<any> {
    return await this._goi('/other/gan-phu-kien', {
      method: 'POST',
      body: JSON.stringify({
        ma_phu_kien: maPhuKien,
        device_id: deviceId || null,
        device_type: deviceType || null,
      })
    });
  },

  async getSimCards(deviceId?: string): Promise<any[]> {
    const duoi = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : ''
    return await this._goi(`/other/get-sim-cards${duoi}`, { method: 'GET' });
  },

  async addSimCards(items: any[]): Promise<any[]> {
    return await this._goi('/other/add-sim-cards',
      { method: 'POST', body: JSON.stringify(items) });
  },

  async updateSimCards(items: any[]): Promise<any[]> {
    return await this._goi('/other/update-sim-cards',
      { method: 'POST', body: JSON.stringify(items) });
  },

  async deleteSimCards(ids: string[]): Promise<any> {
    return await this._goi('/other/delete-sim-cards',
      { method: 'DELETE', body: JSON.stringify(ids) });
  },

  /** Phụ kiện THƯỜNG và SIM của một máy, gộp cùng khuôn (MỤC 441). */
  async getPhuKienCuaMay(deviceId: string): Promise<any[]> {
    return await this._goi(
      `/other/get-phu-kien-cua-may?device_id=${encodeURIComponent(deviceId)}`,
      { method: 'GET' });
  },

  async getApplications(): Promise<any[]> {
    return await this._goi('/other/get-applications', { method: 'GET' });
  },

  async addApplications(apps: any[]): Promise<any[]> {
    return await this._goi('/other/add-applications',
      { method: 'POST', body: JSON.stringify(apps) });
  },

  async updateApplications(apps: any[]): Promise<any[]> {
    return await this._goi('/other/update-applications',
      { method: 'POST', body: JSON.stringify(apps) });
  },

  async deleteApplications(ids: string[]): Promise<any> {
    return await this._goi('/other/delete-applications',
      { method: 'DELETE', body: JSON.stringify(ids) });
  },

  /** Hồ sơ đầy đủ của mọi app đang gắn vào MỘT thiết bị (MỤC 438). */
  async getAppsOfDevice(deviceId: string): Promise<any[]> {
    return await this._goi(
      `/other/get-apps-of-device?device_id=${encodeURIComponent(deviceId)}`,
      { method: 'GET' });
  },

  /** Danh sách máy đang gắn một app (dùng để tick sẵn lúc mở form gán). */
  async getInstalledAppsByApp(appId: string): Promise<any[]> {
    return await this._goi(
      `/other/get-installed-apps?app_id=${encodeURIComponent(appId)}`,
      { method: 'GET' });
  },

  /**
   * ĐẶT LẠI danh sách thiết bị của một app.
   *
   * ⚠️ Gửi lên trạng thái CUỐI CÙNG người dùng muốn, không phải phần
   * thêm. Bỏ tick một máy trên web là máy đó bị gỡ ở máy chủ.
   */
  async setDevicesOfApp(appId: string, thietBi: any[]): Promise<any> {
    return await this._goi('/other/set-devices-of-app',
      { method: 'POST', body: JSON.stringify({ app_id: appId, thiet_bi: thietBi }) });
  },

  // ===================== SMARTPHONES =====================
  async getSmartphones(params?: { classification?: string }): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const queryParams = new URLSearchParams();
    if (params?.classification) queryParams.append('classification', params.classification);
    const queryString = queryParams.toString();
    const url = `${BASE_URL}/other/get-smartphones${queryString ? '?' + queryString : ''}`;

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
      console.error('getSmartphones API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to fetch smartphones`);
    }

    return await response.json();
  },

  async addSmartphones(smartphones: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/other/add-smartphones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(smartphones)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('addSmartphones API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to add smartphones`);
    }

    return await response.json();
  },

  async updateSmartphones(smartphones: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/other/update-smartphones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(smartphones)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('updateSmartphones API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to update smartphones`);
    }

    return await response.json();
  },

  async deleteSmartphones(ids: string[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/other/delete-smartphones`, {
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
      console.error('deleteSmartphones API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to delete smartphones`);
    }

    return await response.json();
  },

  // ===================== TABLETS =====================
  async getTablets(params?: { classification?: string }): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const queryParams = new URLSearchParams();
    if (params?.classification) queryParams.append('classification', params.classification);
    const queryString = queryParams.toString();
    const url = `${BASE_URL}/other/get-tablets${queryString ? '?' + queryString : ''}`;

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
      console.error('getTablets API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to fetch tablets`);
    }

    return await response.json();
  },

  async addTablets(tablets: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/other/add-tablets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(tablets)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('addTablets API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to add tablets`);
    }

    return await response.json();
  },

  async updateTablets(tablets: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/other/update-tablets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(tablets)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('updateTablets API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to update tablets`);
    }

    return await response.json();
  },

  async deleteTablets(ids: string[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/other/delete-tablets`, {
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
      console.error('deleteTablets API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to delete tablets`);
    }

    return await response.json();
  },

  // ===================== LAPTOPS =====================
  async getLaptops(params?: { classification?: string }): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const queryParams = new URLSearchParams();
    if (params?.classification) queryParams.append('classification', params.classification);
    const queryString = queryParams.toString();
    const url = `${BASE_URL}/other/get-laptops${queryString ? '?' + queryString : ''}`;

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
      console.error('getLaptops API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to fetch laptops`);
    }

    return await response.json();
  },

  async addLaptops(laptops: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/other/add-laptops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(laptops)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('addLaptops API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to add laptops`);
    }

    return await response.json();
  },

  async updateLaptops(laptops: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/other/update-laptops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(laptops)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('updateLaptops API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to update laptops`);
    }

    return await response.json();
  },

  async deleteLaptops(ids: string[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/other/delete-laptops`, {
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
      console.error('deleteLaptops API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to delete laptops`);
    }

    return await response.json();
  },

  // ===================== SCREENS =====================
  async getScreens(params?: { classification?: string }): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const queryParams = new URLSearchParams();
    if (params?.classification) queryParams.append('classification', params.classification);
    const queryString = queryParams.toString();
    const url = `${BASE_URL}/other/get-screens${queryString ? '?' + queryString : ''}`;

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
      console.error('getScreens API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to fetch screens`);
    }

    return await response.json();
  },

  async addScreens(screens: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/other/add-screens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(screens)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('addScreens API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to add screens`);
    }

    return await response.json();
  },

  async updateScreens(screens: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/other/update-screens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(screens)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('updateScreens API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to update screens`);
    }

    return await response.json();
  },

  async deleteScreens(ids: string[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/other/delete-screens`, {
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
      console.error('deleteScreens API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to delete screens`);
    }

    return await response.json();
  },

  // ===================== CAMERAS =====================
  async getCameras(params?: { classification?: string }): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const queryParams = new URLSearchParams();
    if (params?.classification) queryParams.append('classification', params.classification);
    const queryString = queryParams.toString();
    const url = `${BASE_URL}/other/get-cameras${queryString ? '?' + queryString : ''}`;

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
      console.error('getCameras API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to fetch cameras`);
    }

    return await response.json();
  },

  async addCameras(cameras: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/other/add-cameras`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(cameras)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('addCameras API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to add cameras`);
    }

    return await response.json();
  },

  async updateCameras(cameras: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/other/update-cameras`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(cameras)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('updateCameras API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to update cameras`);
    }

    return await response.json();
  },

  async deleteCameras(ids: string[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/other/delete-cameras`, {
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
      console.error('deleteCameras API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to delete cameras`);
    }

    return await response.json();
  },

  // ===================== OTHER DEVICES =====================
  async getOtherDevices(params?: { classification?: string }): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const queryParams = new URLSearchParams();
    if (params?.classification) queryParams.append('classification', params.classification);
    const queryString = queryParams.toString();
    const url = `${BASE_URL}/other/get-other-devices${queryString ? '?' + queryString : ''}`;

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
      console.error('getOtherDevices API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to fetch other devices`);
    }

    return await response.json();
  },

  async addOtherDevices(devices: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/other/add-other-devices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(devices)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('addOtherDevices API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to add other devices`);
    }

    return await response.json();
  },

  async updateOtherDevices(devices: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/other/update-other-devices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(devices)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('updateOtherDevices API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to update other devices`);
    }

    return await response.json();
  },

  async deleteOtherDevices(ids: string[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/other/delete-other-devices`, {
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
      console.error('deleteOtherDevices API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to delete other devices`);
    }

    return await response.json();
  },

  // ===================== DEVICE ASSIGNMENTS =====================
  async getDeviceAssignments(params?: { username?: string, device_id?: string, assigned_at?: string, returned_at?: string }): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const queryParams = new URLSearchParams();
    if (params?.username) queryParams.append('username', params.username);
    if (params?.device_id) queryParams.append('device_id', params.device_id);
    if (params?.assigned_at) queryParams.append('assigned_at', params.assigned_at);
    if (params?.returned_at) queryParams.append('returned_at', params.returned_at);
    const queryString = queryParams.toString();
    const url = `${BASE_URL}/other/get-device-assignments${queryString ? '?' + queryString : ''}`;

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
      console.error('getDeviceAssignments API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to fetch device assignments`);
    }

    return await response.json();
  },

  async addDeviceAssignments(assignments: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/other/add-device-assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(assignments)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('addDeviceAssignments API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to add device assignments`);
    }

    return await response.json();
  },

  async updateDeviceAssignments(assignments: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/other/update-device-assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(assignments)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('updateDeviceAssignments API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to update device assignments`);
    }

    return await response.json();
  },

  async deleteDeviceAssignments(ids: string[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/other/delete-device-assignments`, {
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
      console.error('deleteDeviceAssignments API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to delete device assignments`);
    }

    return await response.json();
  }
};
