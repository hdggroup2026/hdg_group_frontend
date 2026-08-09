import { authService } from './auth';
import { getApiUrl } from './apiConfig';

export interface UserRosca {
  id: string;
  full_name: string;
  username?: string;
  phone_number?: string;
  cccd?: string;
  role?: string;
  status?: string;
}

export interface Rosca {
  id?: string;
  code: string;
  user_id: string;
  base_amount: number;
  min_bid_amount?: number;
  max_bid_amount?: number;
  total_parts?: number;
  commission_fee?: number;
  start_date?: string | null;
  end_date?: string | null;
  payment_day?: number | null;
  bidding_time?: string | null;
  period_type?: string;
  status?: string;
  note?: string | null;
  owner_name?: string;
}

export interface RoscaMember {
  id?: string;
  rosca_id: string;
  user_id: string;
  parts_count: number;
  paid_rounds_count?: number;
  total_contributed?: number;
  total_received?: number;
  total_profit?: number;
  profit_rate?: number;
  status?: string;
  note?: string | null;
  telegram_group?: string | null;
  player_name?: string;
  rosca_code?: string;
}

export interface RoscaContribution {
  id?: string;
  rosca_id?: string;
  round_id?: string;
  round_number?: number;
  member_id?: string;
  amount?: number;
  actual_payment_date?: string | null;
  status?: string;
  note?: string | null;
  player_name?: string;
  rosca_code?: string;
}

export interface RoscaContributionQueryParams {
  id?: string;
  rosca_id?: string;
  rosca_code?: string;
  member_id?: string;
  status?: string;
  flow_type?: string;
  start_date?: string;
  end_date?: string;
}

export const roscaService = {
  async getUserRoscas(params?: { id?: string; role?: string; status?: string; phone_number?: string }): Promise<UserRosca[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const queryParams = new URLSearchParams();
    if (params?.id) queryParams.append('id', params.id);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.phone_number) queryParams.append('phone_number', params.phone_number);
    
    const queryString = queryParams.toString();
    const url = `${BASE_URL}/rosca/get-user-roscas${queryString ? '?' + queryString : ''}`;

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
      console.error('getUserRoscas API Error:', response.status, errorData);
      
      if (response.status === 401) {
        authService.handle401();
      }
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to fetch user roscas`);
    }

    return await response.json();
  },

  async addUserRoscas(users: UserRosca[]): Promise<UserRosca[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/rosca/add-user-roscas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(users)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('addUserRoscas API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to add user roscas`);
    }

    return await response.json();
  },

  async updateUserRoscas(users: UserRosca[]): Promise<UserRosca[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/rosca/update-user-roscas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(users)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('updateUserRoscas API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to update user roscas`);
    }

    return await response.json();
  },

  async deleteUserRoscas(ids: string[]): Promise<UserRosca[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/rosca/delete-user-roscas`, {
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
      console.error('deleteUserRoscas API Error:', response.status, errorData);
      
      if (response.status === 401) {
        authService.handle401();
      }
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to delete user roscas`);
    }

    return await response.json();
  },

  async getRoscas(params?: { id?: string; code?: string; user_id?: string; status?: string }): Promise<Rosca[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const queryParams = new URLSearchParams();
    if (params?.id) queryParams.append('id', params.id);
    if (params?.code) queryParams.append('code', params.code);
    if (params?.user_id) queryParams.append('user_id', params.user_id);
    if (params?.status) queryParams.append('status', params.status);
    
    const queryString = queryParams.toString();
    const url = `${BASE_URL}/rosca/get-roscas${queryString ? '?' + queryString : ''}`;

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
      console.error('getRoscas API Error:', response.status, errorData);
      
      if (response.status === 401) {
        authService.handle401();
      }
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to fetch roscas`);
    }

    return await response.json();
  },

  async addRoscas(roscas: Rosca[]): Promise<Rosca[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/rosca/add-roscas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(roscas)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('addRoscas API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to add roscas`);
    }

    return await response.json();
  },

  async updateRoscas(roscas: Rosca[]): Promise<Rosca[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/rosca/update-roscas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(roscas)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('updateRoscas API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to update roscas`);
    }

    return await response.json();
  },

  async deleteRoscas(ids: string[]): Promise<Rosca[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/rosca/delete-roscas`, {
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
      console.error('deleteRoscas API Error:', response.status, errorData);
      
      if (response.status === 401) {
        authService.handle401();
      }
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to delete roscas`);
    }

    return await response.json();
  },

  async getRoscaMembers(params?: { id?: string; rosca_id?: string; user_id?: string; status?: string }): Promise<RoscaMember[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const queryParams = new URLSearchParams();
    if (params?.id) queryParams.append('id', params.id);
    if (params?.rosca_id) queryParams.append('rosca_id', params.rosca_id);
    if (params?.user_id) queryParams.append('user_id', params.user_id);
    if (params?.status) queryParams.append('status', params.status);
    
    const queryString = queryParams.toString();
    const url = `${BASE_URL}/rosca/get-rosca-members${queryString ? '?' + queryString : ''}`;

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
      console.error('getRoscaMembers API Error:', response.status, errorData);
      
      if (response.status === 401) {
        authService.handle401();
      }
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to fetch rosca members`);
    }

    return await response.json();
  },

  async addRoscaMembers(members: RoscaMember[]): Promise<RoscaMember[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/rosca/add-rosca-members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(members)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('addRoscaMembers API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to add rosca members`);
    }

    return await response.json();
  },

  async updateRoscaMembers(members: RoscaMember[]): Promise<RoscaMember[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/rosca/update-rosca-members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(members)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('updateRoscaMembers API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to update rosca members`);
    }

    return await response.json();
  },

  async deleteRoscaMembers(ids: string[]): Promise<RoscaMember[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/rosca/delete-rosca-members`, {
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
      console.error('deleteRoscaMembers API Error:', response.status, errorData);
      
      if (response.status === 401) {
        authService.handle401();
      }
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to delete rosca members`);
    }

    return await response.json();
  },

  async getRoscaContributions(params?: RoscaContributionQueryParams): Promise<RoscaContribution[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const queryParams: string[] = [];
    if (params) {
      if (params.id) queryParams.push(`id=${encodeURIComponent(params.id)}`);
      if (params.rosca_id) queryParams.push(`rosca_id=${encodeURIComponent(params.rosca_id)}`);
      if (params.rosca_code) queryParams.push(`rosca_code=${encodeURIComponent(params.rosca_code)}`);
      if (params.member_id) queryParams.push(`member_id=${encodeURIComponent(params.member_id)}`);
      if (params.status) queryParams.push(`status=${encodeURIComponent(params.status)}`);
      if (params.flow_type) queryParams.push(`flow_type=${encodeURIComponent(params.flow_type)}`);
      if (params.start_date) queryParams.push(`start_date=${encodeURIComponent(params.start_date)}`);
      if (params.end_date) queryParams.push(`end_date=${encodeURIComponent(params.end_date)}`);
    }
    const queryString = queryParams.join('&');
    const url = `${BASE_URL}/rosca/get-rosca-contributions${queryString ? '?' + queryString : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('getRoscaContributions API Error:', response.status, errorData);
      if (response.status === 401) {
        authService.handle401();
      }
      throw new Error(errorData.detail || `Error ${response.status}: Failed to get rosca contributions`);
    }

    return await response.json();
  },

  async addRoscaContributions(contribs: RoscaContribution[]): Promise<RoscaContribution[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/rosca/add-rosca-contributions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(contribs)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('addRoscaContributions API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to add rosca contributions`);
    }

    return await response.json();
  },

  async updateRoscaContributions(contribs: RoscaContribution[]): Promise<RoscaContribution[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/rosca/update-rosca-contributions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(contribs)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('updateRoscaContributions API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to update rosca contributions`);
    }

    return await response.json();
  },

  async deleteRoscaContributions(ids: string[]): Promise<RoscaContribution[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/rosca/delete-rosca-contributions`, {
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
      console.error('deleteRoscaContributions API Error:', response.status, errorData);
      
      if (response.status === 401) {
        authService.handle401();
      }
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to delete rosca contributions`);
    }

    return await response.json();
  },

  async withdrawRoscas(withdraws: RoscaContribution[]): Promise<RoscaContribution[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/rosca/withdraw-roscas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(withdraws)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('withdrawRoscas API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to process withdraw roscas`);
    }

    return await response.json();
  }
};
