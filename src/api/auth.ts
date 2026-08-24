import { getApiUrl } from './apiConfig';


export const authService = {
  async login(username: string, password: string): Promise<any> {
    const baseUrl = await getApiUrl();
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // MỤC 278 (24/08/2026) — GIỮ LẠI MÃ HTTP, KHÔNG CHỈ GIỮ CÂU CHỮ.
      //
      // Trước: chỉ ném câu chữ, nên màn đăng nhập phải ĐOÁN xem lỗi gì
      // bằng cách dò chữ "khoá" trong câu. Máy chủ thêm chữ "khoá" vào
      // câu đếm số lần sai là màn hình hiện nhầm "Tài khoản đã bị khoá"
      // ngay lần sai đầu tiên.
      //
      // Nay: kèm mã. 401 = sai mật khẩu, 423 = tài khoản bị khoá.
      // Máy chủ đổi câu chữ thế nào cũng không ảnh hưởng.
      const loi: any = new Error(errorData.detail || 'Đăng nhập thất bại');
      loi.status = response.status;
      throw loi;
    }

    const data = await response.json();
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('token_type', data.token_type);
    }
    if (data.employee_id) {
      localStorage.setItem('employee_id', data.employee_id);
    }
    // MỤC 259 (23/08/2026) — máy chủ trả cờ này khi tài khoản chưa đổi
    // thông tin đăng nhập lần đầu. Router đọc nó để chặn ở màn đổi.
    //
    // ⚠️ Máy chủ CŨ không trả trường này. Dùng `=== true` chứ không dùng
    // giá trị thô: thiếu trường thì undefined, và undefined phải hiểu là
    // "không phải đổi" chứ không được chặn cả công ty ở màn đổi.
    localStorage.setItem('phai_doi_dang_nhap',
      data.phai_doi_dang_nhap === true ? '1' : '0');
    return data;
  },

  async register(params: { username: string; password?: string; employee_id: string; role?: string }): Promise<any> {
    const baseUrl = await getApiUrl();
    const response = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({
        username: params.username,
        password: params.password,
        employee_id: params.employee_id,
        role: params.role || 'employee'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Parse FastAPI validation errors
      if (errorData.detail && Array.isArray(errorData.detail)) {
        const errorMsg = errorData.detail
          .map((err: any) => {
            const field = err.loc ? err.loc[err.loc.length - 1] : '';
            return `${field ? field + ': ' : ''}${err.msg}`;
          })
          .join(', ');
        throw new Error(errorMsg);
      }
      
      throw new Error(errorData.detail || 'Registration failed');
    }

    const data = await response.json();
    return data;
  },

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    // MỤC 259 — không xoá thì người đăng nhập sau trên cùng máy thừa
    // hưởng cờ của người trước.
    localStorage.removeItem('phai_doi_dang_nhap');
    localStorage.removeItem('employee_id');
    localStorage.removeItem('user_permissions');
    // MỤC 260 — xoá dấu thời gian dùng cuối. Không xoá thì người đăng
    // nhập sau thừa hưởng đồng hồ của người trước, và có thể bị đá ra
    // ngay sau khi vừa vào.
    try {
      localStorage.removeItem('lan_dung_cuoi');
    } catch {
      // không xoá được thì thôi
    }
  },

  handle401(): void {
    this.logout();
    const currentPath = window.location.pathname + window.location.search;
    window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
  },

  getToken(): string | null {
    return localStorage.getItem('access_token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  async getPermissions(employeeId: string): Promise<string[]> {
    const baseUrl = await getApiUrl();
    const token = this.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${baseUrl}/auth/get-permissions/${employeeId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch permissions');
    }
    return await response.json();
  },

  async getAllCredentials(): Promise<any[]> {
    const baseUrl = await getApiUrl();
    const token = this.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${baseUrl}/auth/get-all-credentials`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch credentials');
    }
    return await response.json();
  },

  async updatePermissions(employeeId: string, permissions: string[]): Promise<string[]> {
    const baseUrl = await getApiUrl();
    const token = this.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${baseUrl}/auth/update-permissions/${employeeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ permissions }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to update permissions');
    }
    return await response.json();
  },

  async updateCredential(employeeId: string, payload: { username?: string; password?: string; role?: string; is_active?: boolean }): Promise<any> {
    const baseUrl = await getApiUrl();
    const token = this.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${baseUrl}/auth/update-credential/${employeeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to update credential');
    }
    return await response.json();
  },

  async deleteCredential(employeeId: string): Promise<any> {
    const baseUrl = await getApiUrl();
    const token = this.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${baseUrl}/auth/delete-credential/${employeeId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to delete credential');
    }
    return await response.json();
  },

  /** MỤC 259 — tài khoản này có đang bị bắt đổi thông tin đăng nhập không. */
  phaiDoiDangNhap(): boolean {
    return localStorage.getItem('phai_doi_dang_nhap') === '1';
  },

  /**
   * MỤC 259 — đổi login name + mật khẩu ở lần đăng nhập đầu.
   *
   * Máy chủ đổi xong thì THẺ PHIÊN CŨ HẾT DÙNG ĐƯỢC, vì thẻ mang tên
   * đăng nhập cũ. Nên hàm này tự dọn sạch phiên và người dùng phải đăng
   * nhập lại — chứ không để họ bấm loạn rồi bị văng ra mà không hiểu.
   */
  async doiDangNhapLanDau(loginNameMoi: string, matKhauMoi: string): Promise<any> {
    const baseUrl = await getApiUrl();
    const token = this.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';

    const response = await fetch(`${baseUrl}/auth/doi-dang-nhap-lan-dau`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${tokenType} ${token}`,
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({
        login_name_moi: loginNameMoi,
        mat_khau_moi: matKhauMoi,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      // Máy chủ trả câu tiếng Việt cụ thể (trùng tên, mật khẩu thiếu gì).
      // Ném nguyên câu đó ra chứ không thay bằng câu chung chung.
      throw new Error(data.detail || 'Không đổi được thông tin đăng nhập.');
    }

    this.logout();
    return data;
  },

  async checkIsAdmin(): Promise<boolean> {
    let employeeId = localStorage.getItem('employee_id');
    const token = this.getToken();
    if (!token) return false;

    // Decode username from JWT
    let username = '';
    try {
      const base64Url = token.split('.')[1];
      if (base64Url) {
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        if (payload && payload.sub) {
          username = payload.sub;
        }
      }
    } catch (e) {
      console.error('Failed to decode JWT:', e);
    }

    // If employee_id is missing, let's fetch credentials list and find current user
    if (!employeeId && username) {
      try {
        const credentials = await this.getAllCredentials();
        const me = credentials.find((c: any) => c.username === username);
        if (me) {
          employeeId = me.employee_id;
          localStorage.setItem('employee_id', employeeId || '');
          localStorage.setItem('user_permissions', JSON.stringify(me.permissions || []));
        }
      } catch (e) {
        // If they are not admin, getAllCredentials will throw 403, which is expected
      }
    }

    if (!employeeId) return false;

    const cached = localStorage.getItem('user_permissions');
    if (cached) {
      try {
        const perms = JSON.parse(cached);
        if (Array.isArray(perms)) {
          return perms.includes('admin');
        }
      } catch (e) {}
    }
    try {
      const perms = await this.getPermissions(employeeId);
      localStorage.setItem('user_permissions', JSON.stringify(perms));
      return perms.includes('admin');
    } catch {
      return false;
    }
  }
};

