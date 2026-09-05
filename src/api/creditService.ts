import { authService } from './auth';
import { getApiUrl } from './apiConfig';

export const creditService = {
  // ══════════════════════════════════════════════════════════════════
  // MỤC 527 (05/09/2026) — THAM SỐ `classification` TÁCH HAI LUỒNG
  //
  // s68: *"Tách luồng data từ đầu luôn."* Tham số gửi THẲNG lên máy chủ,
  // máy chủ lọc rồi mới trả về. Không tải hết rồi giấu bớt: số tổng tiền
  // phải tính trên đúng luồng đang xem.
  //
  // ⚠️ Khai kiểu ở CẢ BA hàm. Thiếu một chỗ là `vue-tsc` chặn build với
  // lỗi TS2339/TS2353 — đúng thứ đã làm hỏng build ngày 05/09.
  // ══════════════════════════════════════════════════════════════════
  async getCreditCustomers(params?: { customer_id?: string; classification?: string }): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const queryParams = new URLSearchParams();
    if (params?.customer_id) queryParams.append('customer_id', params.customer_id);
    if (params?.classification) queryParams.append('classification', params.classification);   // MỤC 527
    const queryString = queryParams.toString();
    const url = `${BASE_URL}/credit/get-credit-customers${queryString ? '?' + queryString : ''}`;

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
      console.error('getCreditCustomers API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to fetch credit customers`);
    }

    return await response.json();
  },

  async addCreditCustomers(customers: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/credit/add-credit-customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(customers)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('addCreditCustomers API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to add credit customers`);
    }

    return await response.json();
  },

  async updateCreditCustomers(customers: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/credit/update-credit-customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(customers)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('updateCreditCustomers API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to update credit customers`);
    }

    return await response.json();
  },

  async deleteCreditCustomers(ids: string[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/credit/delete-credit-customers`, {
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
      console.error('deleteCreditCustomers API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to delete credit customers`);
    }

    return await response.json();
  },

  // MỤC 527 — xem lời ghi ở `getCreditCustomers`.
  async getCredits(params?: { status?: string; loan_type?: string; contract_id?: string; customer_id?: string; start_date?: string; end_date?: string; classification?: string }): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.loan_type) queryParams.append('loan_type', params.loan_type);
    if (params?.contract_id) queryParams.append('contract_id', params.contract_id);
    if (params?.customer_id) queryParams.append('customer_id', params.customer_id);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.classification) queryParams.append('classification', params.classification);   // MỤC 527

    const queryString = queryParams.toString();
    const url = `${BASE_URL}/credit/get-credits${queryString ? '?' + queryString : ''}`;

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
      console.error('getCredits API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to fetch credits`);
    }

    return await response.json();
  },

  async addCredits(credits: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/credit/add-credits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(credits)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('addCredits API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to add credits`);
    }

    return await response.json();
  },

  // ══════════════════════════════════════════════════════════════════
  // MỤC 428 (31/08/2026) — ĐÁNH DẤU HỢP ĐỒNG NHẬP SAI
  //
  // 🔴 MÃ XÁC NHẬN CHỈ ĐI MỘT CHIỀU: gửi lên, backend so rồi trả đúng/sai.
  // Frontend KHÔNG giữ, KHÔNG so, KHÔNG nhớ mã này ở bất cứ đâu.
  //
  // s68 lúc đầu muốn để mã ngay trong mã nguồn frontend. Không được:
  // frontend chạy trong trình duyệt của người dùng, nên mọi hằng số trong
  // đó nằm sẵn trong file JavaScript máy chủ gửi về — mở công cụ nhà phát
  // triển tìm chuỗi là thấy, không cần biết lập trình. Thêm nữa nó sẽ nằm
  // vĩnh viễn trong lịch sử commit GitHub, kể cả sau khi xoá.
  //
  // Nay mã nằm ở `appsettings.json` trên máy chủ và không bao giờ rời khỏi
  // đó. s68 chốt cách này ngày 31/08/2026.
  // ══════════════════════════════════════════════════════════════════
  async danhDauNhapSai(id: string, maXacNhan: string, lyDo?: string): Promise<any> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/credit/danh-dau-nhap-sai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({ id, ma_xac_nhan: maXacNhan, ly_do: lyDo || null })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        authService.handle401();
      }
      // ⚠️ Hiện NGUYÊN VĂN lý do backend trả về. Backend đã cân nhắc nói
      // gì và giấu gì — nó cố ý KHÔNG nói cửa nào hỏng khi sai mã, để
      // không chỉ đường cho người dò.
      throw new Error(errorData.detail || `Error ${response.status}: Không đánh dấu được`);
    }

    return await response.json();
  },

  async updateCredits(credits: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/credit/update-credits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(credits)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('updateCredits API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to update credits`);
    }

    return await response.json();
  },

  // MỤC 527 — xem lời ghi ở `getCreditCustomers`.
  async getCreditInterests(params?: { contract_id?: string; customer_id?: string; start_date?: string; end_date?: string; classification?: string }): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const queryParams = new URLSearchParams();
    if (params?.contract_id) queryParams.append('contract_id', params.contract_id);
    if (params?.customer_id) queryParams.append('customer_id', params.customer_id);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.classification) queryParams.append('classification', params.classification);   // MỤC 527

    const queryString = queryParams.toString();
    const url = `${BASE_URL}/credit/get-credit-interests${queryString ? '?' + queryString : ''}`;

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
      console.error('getCreditInterests API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to fetch credit interests`);
    }

    return await response.json();
  },

  async addCreditInterests(interests: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/credit/add-credit-interests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(interests)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('addCreditInterests API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to add credit interests`);
    }

    return await response.json();
  },

  async deleteCredits(ids: string[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/credit/delete-credits`, {
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
      console.error('deleteCredits API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to delete credits`);
    }

    return await response.json();
  },

  async deleteCreditInterests(ids: string[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/credit/delete-credit-interests`, {
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
      console.error('deleteCreditInterests API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to delete credit interests`);
    }

    return await response.json();
  },

  async getClassifications(): Promise<string[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const url = `${BASE_URL}/credit/get-classifications`;

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
      console.error('getClassifications API Error:', response.status, errorData);
      
      if (response.status === 401) {
        authService.handle401();
      }
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to fetch classifications`);
    }

    return await response.json();
  }
};
