import { authService } from './auth';
import { getApiUrl } from './apiConfig';

export const employeeService = {
  async getEmployees(preId?: string, status?: string): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const queryParams = new URLSearchParams();
    if (preId) queryParams.append('pre_id', preId);
    if (status) queryParams.append('status', status);

    const queryString = queryParams.toString();
    const url = `${BASE_URL}/employee/get-employee${queryString ? `?${queryString}` : ''}`;

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
      console.error('getEmployees API Error:', response.status, errorData);

      if (response.status === 401) {
        authService.handle401();
      }

      throw new Error(errorData.detail || `Error ${response.status}: Failed to fetch employees`);
    }

    return await response.json();
  },

  async addEmployee(employeeData: any): Promise<any> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/employee/add-employee`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(employeeData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('addEmployee API Error:', response.status, errorData);

      if (response.status === 401) {
        authService.handle401();
      }

      // Format FastAPI validation errors if they exist
      if (errorData.detail && Array.isArray(errorData.detail)) {
        const errorMsg = errorData.detail
          .map((err: any) => {
            const field = err.loc ? err.loc[err.loc.length - 1] : '';
            return `${field ? field + ': ' : ''}${err.msg}`;
          })
          .join(', ');
        throw new Error(errorMsg);
      }

      throw new Error(errorData.detail || `Error ${response.status}: Failed to add employee`);
    }

    return await response.json();
  },

  async updateEmployee(employeeData: any): Promise<any> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/employee/update-employee`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(employeeData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('updateEmployee API Error:', response.status, errorData);

      if (response.status === 401) {
        authService.handle401();
      }

      if (errorData.detail && Array.isArray(errorData.detail)) {
        const errorMsg = errorData.detail
          .map((err: any) => {
            const field = err.loc ? err.loc[err.loc.length - 1] : '';
            return `${field ? field + ': ' : ''}${err.msg}`;
          })
          .join(', ');
        throw new Error(errorMsg);
      }

      throw new Error(errorData.detail || `Error ${response.status}: Failed to update employee`);
    }

    return await response.json();
  },

  async deleteEmployees(ids: string[]): Promise<any> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/employee/delete-employee`, {
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
      console.error('deleteEmployees API Error:', response.status, errorData);

      if (response.status === 401) {
        authService.handle401();
      }

      throw new Error(errorData.detail || `Error ${response.status}: Failed to delete employee`);
    }

    return await response.json();
  },

  async getAttendance(employeeId: string, date: string): Promise<any> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const queryParams = new URLSearchParams();
    queryParams.append('employee_id', employeeId);
    queryParams.append('date', date);

    const response = await fetch(`${BASE_URL}/get-attendance?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('getAttendance API Error:', response.status, errorData);

      if (response.status === 401) {
        authService.handle401();
      }

      if (errorData.detail && Array.isArray(errorData.detail)) {
        const errorMsg = errorData.detail
          .map((err: any) => {
            const field = err.loc ? err.loc[err.loc.length - 1] : '';
            return `${field ? field + ': ' : ''}${err.msg}`;
          })
          .join(', ');
        throw new Error(errorMsg);
      }

      throw new Error(errorData.detail || `Error ${response.status}: Failed to fetch attendance`);
    }

    return await response.json();
  },

  async addAttendance(attendanceData: any): Promise<any> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/add-attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(attendanceData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('addAttendance API Error:', response.status, errorData);

      if (response.status === 401) {
        authService.handle401();
      }

      if (errorData.detail && Array.isArray(errorData.detail)) {
        const errorMsg = errorData.detail
          .map((err: any) => {
            const field = err.loc ? err.loc[err.loc.length - 1] : '';
            return `${field ? field + ': ' : ''}${err.msg}`;
          })
          .join(', ');
        throw new Error(errorMsg);
      }

      throw new Error(errorData.detail || `Error ${response.status}: Failed to add attendance`);
    }

    return await response.json();
  },

  async updateAttendance(attendanceData: any): Promise<any> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/update-attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(attendanceData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('updateAttendance API Error:', response.status, errorData);

      if (response.status === 401) {
        authService.handle401();
      }

      if (errorData.detail && Array.isArray(errorData.detail)) {
        const errorMsg = errorData.detail
          .map((err: any) => {
            const field = err.loc ? err.loc[err.loc.length - 1] : '';
            return `${field ? field + ': ' : ''}${err.msg}`;
          })
          .join(', ');
        throw new Error(errorMsg);
      }

      throw new Error(errorData.detail || `Error ${response.status}: Failed to update attendance`);
    }

    return await response.json();
  },

  async deleteAttendance(ids: string[]): Promise<any> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/delete-attendance`, {
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
      console.error('deleteAttendance API Error:', response.status, errorData);

      if (response.status === 401) {
        authService.handle401();
      }

      if (errorData.detail && Array.isArray(errorData.detail)) {
        const errorMsg = errorData.detail
          .map((err: any) => {
            const field = err.loc ? err.loc[err.loc.length - 1] : '';
            return `${field ? field + ': ' : ''}${err.msg}`;
          })
          .join(', ');
        throw new Error(errorMsg);
      }

      throw new Error(errorData.detail || `Error ${response.status}: Failed to delete attendance`);
    }

    return await response.json();
  },

  async getPayrolls(employeeId?: string, date?: string, startDate?: string, endDate?: string): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const queryParams = new URLSearchParams();
    if (employeeId) queryParams.append('employee_id', employeeId);
    // start_date/end_date take precedence over date on the backend
    if (startDate && endDate) {
      queryParams.append('start_date', startDate);
      queryParams.append('end_date', endDate);
    } else if (date) {
      queryParams.append('date', date);
    }

    const response = await fetch(`${BASE_URL}/get-payrolls?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('getPayrolls API Error:', response.status, errorData);

      if (response.status === 401) {
        authService.handle401();
      }

      if (errorData.detail && Array.isArray(errorData.detail)) {
        const errorMsg = errorData.detail
          .map((err: any) => {
            const field = err.loc ? err.loc[err.loc.length - 1] : '';
            return `${field ? field + ': ' : ''}${err.msg}`;
          })
          .join(', ');
        throw new Error(errorMsg);
      }

      throw new Error(errorData.detail || `Error ${response.status}: Failed to fetch payrolls`);
    }

    return await response.json();
  },

  /**
   * Fetch calculated salaries for a whole month (`date` as mm/yyyy), for a day
   * range (`startDate`/`endDate` as yyyy-mm-dd), or both — the month then says
   * which month the period is filed under and the range says which days it covers.
   */
  async getSalaries(preId?: string, date?: string, startDate?: string, endDate?: string): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const queryParams = new URLSearchParams();
    if (preId) queryParams.append('pre_id', preId);
    if (date) queryParams.append('date', date);
    if (startDate && endDate) {
      queryParams.append('start_date', startDate);
      queryParams.append('end_date', endDate);
    }

    const response = await fetch(`${BASE_URL}/get-salaries?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('getSalaries API Error:', response.status, errorData);

      if (response.status === 401) {
        authService.handle401();
      }

      if (errorData.detail && Array.isArray(errorData.detail)) {
        const errorMsg = errorData.detail
          .map((err: any) => {
            const field = err.loc ? err.loc[err.loc.length - 1] : '';
            return `${field ? field + ': ' : ''}${err.msg}`;
          })
          .join(', ');
        throw new Error(errorMsg);
      }

      throw new Error(errorData.detail || `Error ${response.status}: Failed to fetch salaries`);
    }

    return await response.json();
  },

  async addPayrolls(payrolls: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/add-payrolls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(payrolls)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('addPayrolls API Error:', response.status, errorData);

      if (response.status === 401) {
        authService.handle401();
      }

      if (errorData.detail && Array.isArray(errorData.detail)) {
        const errorMsg = errorData.detail
          .map((err: any) => {
            const field = err.loc ? err.loc[err.loc.length - 1] : '';
            return `${field ? field + ': ' : ''}${err.msg}`;
          })
          .join(', ');
        throw new Error(errorMsg);
      }

      throw new Error(errorData.detail || `Error ${response.status}: Failed to add payrolls`);
    }

    return await response.json();
  },

  async deletePayrolls(ids: string[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/delete-payrolls`, {
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
      console.error('deletePayrolls API Error:', response.status, errorData);

      if (response.status === 401) {
        authService.handle401();
      }

      if (errorData.detail && Array.isArray(errorData.detail)) {
        const errorMsg = errorData.detail
          .map((err: any) => {
            const field = err.loc ? err.loc[err.loc.length - 1] : '';
            return `${field ? field + ': ' : ''}${err.msg}`;
          })
          .join(', ');
        throw new Error(errorMsg);
      }

      throw new Error(errorData.detail || `Error ${response.status}: Failed to delete payrolls`);
    }

    return await response.json();
  }
};
