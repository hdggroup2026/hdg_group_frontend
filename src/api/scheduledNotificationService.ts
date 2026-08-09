import { authService } from './auth';
import { getApiUrl } from './apiConfig';

export interface ScheduledNotifyConfigPayload {
  module_key: string;
  module_name: string;
  notify_type: string;
  chat_id: string;
  group_name?: string;
  schedule_type: string;
  schedule_hour: number;
  schedule_minute: number;
  schedule_day_of_week?: number | null;
  schedule_day_of_month?: number | null;
  schedule_month?: number | null;
  schedule_specific_date?: string | null;
  message_template?: string | null;
  is_enabled?: boolean;
  max_retry_days?: number;
  escalate_to_chat_id?: string | null;
  escalate_after_days?: number;
  filter_conditions?: string | null;
  reference_id?: string | null;
  reference_name?: string | null;
}

export interface ScheduledNotifyConfig extends ScheduledNotifyConfigPayload {
  id: string;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduledNotifyLog {
  id: string;
  config_id: string;
  module_key: string;
  notify_type: string;
  chat_id: string;
  group_name?: string | null;
  reference_id?: string | null;
  reference_name?: string | null;
  message_id?: number | null;
  message_content?: string | null;
  status: string;
  error_message?: string | null;
  scheduled_at?: string | null;
  sent_at: string;
}

async function apiRequest(method: string, path: string, body?: any): Promise<any> {
  const BASE_URL = await getApiUrl();
  const token = authService.getToken();
  const tokenType = localStorage.getItem('token_type') || 'Bearer';
  const authHeader = `${tokenType} ${token}`;

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader,
      'ngrok-skip-browser-warning': 'true'
    },
  };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`scheduledNotificationService ${method} ${path} Error:`, response.status, errorData);

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

    throw new Error(errorData.detail || errorData.message || `Error ${response.status}`);
  }

  return await response.json();
}

export const scheduledNotificationService = {
  // ── Configs CRUD ──────────────────────────────────

  async getConfigs(params?: {
    module_key?: string;
    is_enabled?: boolean | string;
    notify_type?: string;
  }): Promise<ScheduledNotifyConfig[]> {
    const queryParams = new URLSearchParams();
    if (params?.module_key) queryParams.append('module_key', params.module_key);
    if (params?.is_enabled !== undefined && params.is_enabled !== '') {
      queryParams.append('is_enabled', String(params.is_enabled));
    }
    if (params?.notify_type) queryParams.append('notify_type', params.notify_type);
    const qs = queryParams.toString();
    return apiRequest('GET', `/scheduled-notifications/configs${qs ? '?' + qs : ''}`);
  },

  async getConfigById(id: string): Promise<ScheduledNotifyConfig> {
    return apiRequest('GET', `/scheduled-notifications/configs/${id}`);
  },

  async createConfig(data: ScheduledNotifyConfigPayload): Promise<ScheduledNotifyConfig> {
    return apiRequest('POST', '/scheduled-notifications/configs', data);
  },

  async updateConfig(id: string, data: Partial<ScheduledNotifyConfigPayload>): Promise<ScheduledNotifyConfig> {
    return apiRequest('PUT', `/scheduled-notifications/configs/${id}`, { id, ...data });
  },

  async deleteConfig(id: string): Promise<any> {
    return apiRequest('DELETE', `/scheduled-notifications/configs/${id}`);
  },

  async toggleConfig(id: string): Promise<ScheduledNotifyConfig> {
    return apiRequest('PATCH', `/scheduled-notifications/configs/${id}/toggle`);
  },

  async testConfig(id: string): Promise<any> {
    return apiRequest('POST', `/scheduled-notifications/configs/${id}/test`);
  },

  // ── Logs ──────────────────────────────────────────

  async getLogs(params?: {
    config_id?: string;
    module_key?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    search_query?: string;
  }): Promise<ScheduledNotifyLog[]> {
    const queryParams = new URLSearchParams();
    if (params?.config_id) queryParams.append('config_id', params.config_id);
    if (params?.module_key) queryParams.append('module_key', params.module_key);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.search_query) queryParams.append('search_query', params.search_query);
    const qs = queryParams.toString();
    return apiRequest('GET', `/scheduled-notifications/logs${qs ? '?' + qs : ''}`);
  },
};
