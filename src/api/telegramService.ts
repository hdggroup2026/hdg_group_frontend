import { authService } from './auth';
import { getApiUrl } from './apiConfig';

export const telegramService = {
  async getGroups() {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    
    // Use exactly what the server returned (e.g., 'bearer') or 'Bearer' as fallback
    const authHeader = `${tokenType} ${token}`;
    
    console.log('Fetching groups with header:', tokenType, token ? 'Token exists' : 'Token MISSING');

    const response = await fetch(`${BASE_URL}/telegram/get_telegram_groups`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error:', response.status, errorData);

      if (response.status === 401) {
        authService.handle401();
      }
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to fetch groups`);
    }

    return await response.json();
  },

  async addUsers(message: string, chatIds: string[]) {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/telegram/add_users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({ message, chat_ids: chatIds }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Add Users Error:', response.status, errorData);
      throw new Error(errorData.detail || `Error ${response.status}: Failed to add users`);
    }

    return await response.json();
  },

  async getNotifyConfigs(params?: { module_key?: string; project_name?: string }): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const queryParams = new URLSearchParams();
    if (params?.module_key) queryParams.append('module_key', params.module_key);
    if (params?.project_name) queryParams.append('project_name', params.project_name);

    const response = await fetch(`${BASE_URL}/telegram/get-notify-configs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) authService.handle401();
      throw new Error(errorData.detail || `Error ${response.status}: Failed to get notify configs`);
    }
    return await response.json();
  },

  async addNotifyConfigs(configs: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/telegram/add-notify-configs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(configs),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) authService.handle401();
      throw new Error(errorData.detail || `Error ${response.status}: Failed to add notify configs`);
    }
    return await response.json();
  },

  async updateNotifyConfigs(configs: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/telegram/update-notify-configs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(configs),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) authService.handle401();
      throw new Error(errorData.detail || `Error ${response.status}: Failed to update notify configs`);
    }
    return await response.json();
  },

  async deleteNotifyConfigs(configIds: string[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/telegram/delete-notify-configs`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(configIds),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) authService.handle401();
      throw new Error(errorData.detail || `Error ${response.status}: Failed to delete notify configs`);
    }
    return await response.json();
  },

  async getNotifyLogs(params?: {
    module_key?: string;
    performer?: string;
    status?: string;
    project_name?: string;
    search_query?: string;
    start_date?: string;
    end_date?: string;
    skip?: number;
    limit?: number;
  }): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const queryParams = new URLSearchParams();
    if (params?.module_key) queryParams.append('module_key', params.module_key);
    if (params?.performer) queryParams.append('performer', params.performer);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.project_name) queryParams.append('project_name', params.project_name);
    if (params?.search_query) queryParams.append('search_query', params.search_query);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.skip !== undefined) queryParams.append('skip', String(params.skip));
    if (params?.limit !== undefined) queryParams.append('limit', String(params.limit));

    const response = await fetch(`${BASE_URL}/telegram/get-notify-logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) authService.handle401();
      throw new Error(errorData.detail || `Error ${response.status}: Failed to get notify logs`);
    }
    return await response.json();
  },

  async sendMessage(chatId: string, message: string): Promise<any> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/telegram/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({ chat_id: chatId, message }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) authService.handle401();
      throw new Error(errorData.detail || `Error ${response.status}: Failed to send message`);
    }
    return await response.json();
  },

  async getMembersInGroup(chatId: string, source: string = 'telegram'): Promise<any> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/telegram/get_members_in_group?chat_id=${chatId}&source=${source}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) authService.handle401();
      throw new Error(errorData.detail || `Error ${response.status}: Failed to get members`);
    }
    return await response.json();
  },

  async sendDocument(chatId: string, file: File, caption: string = ''): Promise<any> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('caption', caption);
    formData.append('file', file);

    const response = await fetch(`${BASE_URL}/telegram/send-document`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) authService.handle401();
      throw new Error(errorData.detail || `Error ${response.status}: Failed to send document`);
    }
    return await response.json();
  },

  async getGroupMappings(params?: { mapping_type?: string; skip?: number; limit?: number }) {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const queryParams = new URLSearchParams();
    if (params?.mapping_type) queryParams.append('mapping_type', params.mapping_type);
    if (params?.skip !== undefined) queryParams.append('skip', String(params.skip));
    if (params?.limit !== undefined) queryParams.append('limit', String(params.limit));

    const response = await fetch(`${BASE_URL}/telegram-group-mappings/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) authService.handle401();
      throw new Error(errorData.detail || `Error ${response.status}: Failed to get group mappings`);
    }
    return await response.json();
  },

  async addGroupMapping(mapping: any) {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/telegram-group-mappings/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(mapping),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) authService.handle401();
      throw new Error(errorData.detail || `Error ${response.status}: Failed to create group mapping`);
    }
    return await response.json();
  },

  async updateGroupMapping(mappingId: string, mapping: any) {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/telegram-group-mappings/${mappingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(mapping),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) authService.handle401();
      throw new Error(errorData.detail || `Error ${response.status}: Failed to update group mapping`);
    }
    return await response.json();
  },

  async deleteGroupMapping(mappingId: string) {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/telegram-group-mappings/${mappingId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) authService.handle401();
      throw new Error(errorData.detail || `Error ${response.status}: Failed to delete group mapping`);
    }
    return await response.json();
  }
};
