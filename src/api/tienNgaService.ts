import { authService } from './auth';
import { getApiUrl } from './apiConfig';

/** Bộ lọc dùng chung cho get/count nhật ký ứng tiền. */
export interface CashAdvanceLogFilters {
  hoursehold_id?: string;
  /** UUID điểm thu mua, nhiều điểm thì nối bằng dấu phẩy. */
  collection_point_id?: string;
  /** ADVANCE (chi ứng ra) | DEDUCT (thu khấu trừ) */
  entry_type?: string;
  /** SEASON_END (ứng cuối mùa) | IN_MONTH (ứng trong tháng) */
  advance_type?: string;
  start_date?: string;
  end_date?: string;
  is_over_limit?: boolean;
}

function buildCashAdvanceQuery(params: CashAdvanceLogFilters): URLSearchParams {
  const queryParams = new URLSearchParams();
  if (params.hoursehold_id) queryParams.append('hoursehold_id', params.hoursehold_id);
  if (params.collection_point_id) queryParams.append('collection_point_id', params.collection_point_id);
  if (params.entry_type) queryParams.append('entry_type', params.entry_type);
  if (params.advance_type) queryParams.append('advance_type', params.advance_type);
  if (params.start_date) queryParams.append('start_date', params.start_date);
  if (params.end_date) queryParams.append('end_date', params.end_date);
  if (params.is_over_limit !== undefined) queryParams.append('is_over_limit', String(params.is_over_limit));
  return queryParams;
}

/** GET tới backend tien-nga, kèm auth header và parse lỗi FastAPI như các hàm khác trong file. */
async function fetchTienNga(
  path: string,
  queryParams: URLSearchParams,
  logLabel: string,
  fallbackError: string
): Promise<any> {
  const BASE_URL = await getApiUrl();
  const token = authService.getToken();
  const tokenType = localStorage.getItem('token_type') || 'Bearer';
  const authHeader = `${tokenType} ${token}`;

  const queryString = queryParams.toString();
  const response = await fetch(`${BASE_URL}${path}${queryString ? `?${queryString}` : ''}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader,
      'ngrok-skip-browser-warning': 'true'
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`${logLabel} API Error:`, response.status, errorData);

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

    throw new Error(errorData.detail || `Error ${response.status}: ${fallbackError}`);
  }

  return await response.json();
}

export const tienNgaService = {
  async getCustomers(ingredient: string = 'cao su', collectionPointId?: string, householdId?: string): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    let url = `${BASE_URL}/tien-nga/get-customers?ingredient=${encodeURIComponent(ingredient)}`;
    if (collectionPointId) {
      url += `&collection_point_id=${encodeURIComponent(collectionPointId)}`;
    }
    if (householdId) {
      url += `&hoursehold_id=${encodeURIComponent(householdId)}`;
    }

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
      console.error('getCustomers API Error:', response.status, errorData);
      
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

      if (response.status === 401) {
        authService.handle401();
      }
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to fetch customers`);
    }

    return await response.json();
  },

  async getCollectionPoints(ingredient: string = 'Cao su'): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/get-collection-points?ingredient=${encodeURIComponent(ingredient)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('getCollectionPoints API Error:', response.status, errorData);
      
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

      if (response.status === 401) {
        authService.handle401();
      }
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to fetch collection points`);
    }

    return await response.json();
  },

  async addCustomers(customers: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/add-customers`, {
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
      console.error('addCustomers API Error:', response.status, errorData);
      
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

      if (response.status === 401) {
        authService.handle401();
      }
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to add customers`);
    }

    return await response.json();
  },

  async updateCustomers(customers: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/update-customers`, {
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
      console.error('updateCustomers API Error:', response.status, errorData);
      
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

      if (response.status === 401) {
        authService.handle401();
      }
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to update customers`);
    }

    return await response.json();
  },

  async deleteCustomers(customerIds: string[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/delete-customers`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(customerIds)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('deleteCustomers API Error:', response.status, errorData);
      
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

      if (response.status === 401) {
        authService.handle401();
      }
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to delete customers`);
    }

    return await response.json();
  },

  async getDailyPurchases(params: {
    start_date?: string;
    end_date?: string;
    hoursehold_id?: string;
    product_code?: string;
    collection_point_id?: string;
  } = {}): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const queryParams = new URLSearchParams();
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    if (params.hoursehold_id) queryParams.append('hoursehold_id', params.hoursehold_id);
    if (params.product_code) queryParams.append('product_code', params.product_code);
    if (params.collection_point_id) queryParams.append('collection_point_id', params.collection_point_id);

    const queryString = queryParams.toString();
    const url = `${BASE_URL}/tien-nga/get-daily-purchases${queryString ? `?${queryString}` : ''}`;

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
      console.error('getDailyPurchases API Error:', response.status, errorData);
      
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

      if (response.status === 401) {
        authService.handle401();
      }
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to fetch daily purchases`);
    }

    return await response.json();
  },

  async addDailyPurchases(purchases: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/add-daily-purchases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(purchases)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('addDailyPurchases API Error:', response.status, errorData);
      
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

      if (response.status === 401) {
        authService.handle401();
      }
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to add daily purchases`);
    }

    return await response.json();
  },

  async updateDailyPurchases(purchases: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/update-daily-purchases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(purchases)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('updateDailyPurchases API Error:', response.status, errorData);
      
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

      if (response.status === 401) {
        authService.handle401();
      }
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to update daily purchases`);
    }

    return await response.json();
  },

  async deleteDailyPurchases(purchaseIds: string[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/delete-daily-purchases`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(purchaseIds)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('deleteDailyPurchases API Error:', response.status, errorData);
      
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

      if (response.status === 401) {
        authService.handle401();
      }
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to delete daily purchases`);
    }

    return await response.json();
  },

  async getMaterialPurchases(params: {
    start_date?: string;
    end_date?: string;
    material_type?: string;
    storage_name?: string;
  } = {}): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const queryParams = new URLSearchParams();
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    if (params.material_type) queryParams.append('material_type', params.material_type);
    if (params.storage_name) queryParams.append('storage_name', params.storage_name);

    const queryString = queryParams.toString();
    const url = `${BASE_URL}/tien-nga/get-material-purchases${queryString ? `?${queryString}` : ''}`;

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
      console.error('getMaterialPurchases API Error:', response.status, errorData);
      
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

      if (response.status === 401) {
        authService.handle401();
      }
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to fetch material purchases`);
    }

    return await response.json();
  },

  async addMaterialPurchases(purchases: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/add-material-purchases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(purchases)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('addMaterialPurchases API Error:', response.status, errorData);

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

      throw new Error(errorData.detail || `Error ${response.status}: Failed to add material purchases`);
    }

    return await response.json();
  },

  async getProductTransactions(params: {
    transaction_type?: string;
    material_type?: string;
    start_date?: string;
    end_date?: string;
    storage_name?: string;
  } = {}): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const queryParams = new URLSearchParams();
    if (params.transaction_type) queryParams.append('transaction_type', params.transaction_type);
    if (params.material_type) queryParams.append('material_type', params.material_type);
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    if (params.storage_name) queryParams.append('storage_name', params.storage_name);

    const queryString = queryParams.toString();
    const url = `${BASE_URL}/tien-nga/get-product-transactions${queryString ? `?${queryString}` : ''}`;

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
      console.error('getProductTransactions API Error:', response.status, errorData);

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

      throw new Error(errorData.detail || `Error ${response.status}: Failed to fetch product transactions`);
    }

    return await response.json();
  },

  async addProductTransactions(transactions: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/add-product-transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(transactions)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('addProductTransactions API Error:', response.status, errorData);

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

      throw new Error(errorData.detail || `Error ${response.status}: Failed to add product transactions`);
    }

    return await response.json();
  },

  async deleteProductTransactions(transactionIds: string[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/delete-product-transactions`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(transactionIds)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('deleteProductTransactions API Error:', response.status, errorData);

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

      throw new Error(errorData.detail || `Error ${response.status}: Failed to delete product transactions`);
    }

    return await response.json();
  },

  async getInventories(materialName?: string): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const queryParams = new URLSearchParams();
    if (materialName) queryParams.append('material_name', materialName);
    const queryString = queryParams.toString();
    const url = `${BASE_URL}/tien-nga/get-inventories${queryString ? `?${queryString}` : ''}`;

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
      console.log('getInventories API Error:', response.status, errorData);

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

      throw new Error(errorData.detail || `Error ${response.status}: Failed to fetch inventories`);
    }

    return await response.json();
  },

  async addInventories(inventories: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/add-inventories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(inventories)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('addInventories API Error:', response.status, errorData);

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

      throw new Error(errorData.detail || `Error ${response.status}: Failed to add inventories`);
    }

    return await response.json();
  },

  async updateInventories(inventories: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/update-inventories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(inventories)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('updateInventories API Error:', response.status, errorData);

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

      throw new Error(errorData.detail || `Error ${response.status}: Failed to update inventories`);
    }

    return await response.json();
  },

  async deleteInventories(inventoryIds: string[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/delete-inventories`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(inventoryIds)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('deleteInventories API Error:', response.status, errorData);

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

      throw new Error(errorData.detail || `Error ${response.status}: Failed to delete inventories`);
    }

    return await response.json();
  },

  async getInventoryExports(params: {
    storage_name?: string;
    material_type?: string;
    start_date?: string;
    end_date?: string;
  } = {}): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const queryParams = new URLSearchParams();
    if (params.storage_name) queryParams.append('storage_name', params.storage_name);
    if (params.material_type) queryParams.append('material_type', params.material_type);
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);

    const queryString = queryParams.toString();
    const url = `${BASE_URL}/tien-nga/get-inventory-exports${queryString ? `?${queryString}` : ''}`;

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
      console.error('getInventoryExports API Error:', response.status, errorData);

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

      throw new Error(errorData.detail || `Error ${response.status}: Failed to fetch inventory exports`);
    }

    return await response.json();
  },

  async addInventoryExports(exports: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/add-inventory-exports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(exports)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('addInventoryExports API Error:', response.status, errorData);

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

      throw new Error(errorData.detail || `Error ${response.status}: Failed to add inventory exports`);
    }

    return await response.json();
  },

  async deleteInventoryExports(exportIds: string[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/delete-inventory-exports`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(exportIds)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('deleteInventoryExports API Error:', response.status, errorData);

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

      throw new Error(errorData.detail || `Error ${response.status}: Failed to delete inventory exports`);
    }

    return await response.json();
  },

  async getPartners(): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/get-partners`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('getPartners API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to fetch partners`);
    }

    return await response.json();
  },

  async addPartners(partners: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/add-partners`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(partners)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('addPartners API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to add partners`);
    }

    return await response.json();
  },

  async updatePartners(partners: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/update-partners`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(partners)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('updatePartners API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to update partners`);
    }

    return await response.json();
  },

  async deletePartners(partnerIds: string[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/delete-partners`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(partnerIds)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('deletePartners API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to delete partners`);
    }

    return await response.json();
  },

  async getPartnerBusinesses(params: {
    product_type?: string;
    transaction_type?: string;
    start_date?: string;
    end_date?: string;
  } = {}): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const queryParams = new URLSearchParams();
    if (params.product_type) queryParams.append('product_type', params.product_type);
    if (params.transaction_type) queryParams.append('transaction_type', params.transaction_type);
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);

    const queryString = queryParams.toString();
    const url = `${BASE_URL}/tien-nga/get-partner-businesses${queryString ? `?${queryString}` : ''}`;

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
      console.error('getPartnerBusinesses API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to fetch partner businesses`);
    }

    return await response.json();
  },

  async addPartnerBusinesses(businesses: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/add-partner-businesses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(businesses)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('addPartnerBusinesses API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to add partner businesses`);
    }

    return await response.json();
  },

  async updatePartnerBusinesses(businesses: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/update-partner-businesses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(businesses)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('updatePartnerBusinesses API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to update partner businesses`);
    }

    return await response.json();
  },

  async deletePartnerBusinesses(businessIds: string[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/delete-partner-businesses`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(businessIds)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('deletePartnerBusinesses API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to delete partner businesses`);
    }

    return await response.json();
  },

  async getInvestments(params: { role?: string; parent_id?: string } = {}): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const queryParams = new URLSearchParams();
    if (params.role) queryParams.append('role', params.role);
    if (params.parent_id) queryParams.append('parent_id', params.parent_id);

    const queryString = queryParams.toString();
    const url = `${BASE_URL}/tien-nga/get-investments${queryString ? `?${queryString}` : ''}`;

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
      console.error('getInvestments API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to fetch investments`);
    }

    return await response.json();
  },

  async addInvestments(investments: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/add-investments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(investments)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('addInvestments API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to add investments`);
    }

    return await response.json();
  },

  async updateInvestments(investments: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/update-investments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(investments)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('updateInvestments API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to update investments`);
    }

    return await response.json();
  },

  async deleteInvestments(investmentIds: string[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/delete-investments`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(investmentIds)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('deleteInvestments API Error:', response.status, errorData);

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

      throw new Error(errorData.detail || `Error ${response.status}: Failed to delete investments`);
    }

    return await response.json();
  },

  async getShareholders(params?: { investment_id?: string; shareholder_code?: string }): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const queryParams = new URLSearchParams();
    if (params?.investment_id) queryParams.append('investment_id', params.investment_id);
    if (params?.shareholder_code) queryParams.append('shareholder_code', params.shareholder_code);
    const queryString = queryParams.toString();
    const url = `${BASE_URL}/tien-nga/get-shareholders${queryString ? '?' + queryString : ''}`;

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
      console.error('getShareholders API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to fetch shareholders`);
    }

    return await response.json();
  },

  async addShareholders(shareholders: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/add-shareholders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(shareholders)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('addShareholders API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to add shareholders`);
    }

    return await response.json();
  },

  async updateShareholders(shareholders: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/update-shareholders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(shareholders)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('updateShareholders API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to update shareholders`);
    }

    return await response.json();
  },

  async deleteShareholders(shareholderIds: string[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/delete-shareholders`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(shareholderIds)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('deleteShareholders API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to delete shareholders`);
    }

    return await response.json();
  },

  async getDailyPayments(params: {
    investment_id?: string;
    payment_type?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const queryParams = new URLSearchParams();
    if (params.investment_id) queryParams.append('investment_id', params.investment_id);
    if (params.payment_type) queryParams.append('payment_type', params.payment_type);
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);

    const url = `${BASE_URL}/tien-nga/get-daily-payments?${queryParams.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('getDailyPayments API Error:', response.status, errorData);
      
      if (response.status === 401) {
        authService.handle401();
      }
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to get daily payments`);
    }

    return await response.json();
  },

  async addDailyPayments(payments: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/add-daily-payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(payments)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('addDailyPayments API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to add daily payments`);
    }

    return await response.json();
  },

  async deleteDailyPayments(paymentIds: string[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/delete-daily-payments`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(paymentIds)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('deleteDailyPayments API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to delete daily payments`);
    }

    return await response.json();
  },

  async deleteMaterialPurchases(purchaseIds: string[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/delete-material-purchases`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(purchaseIds)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('deleteMaterialPurchases API Error:', response.status, errorData);

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

      throw new Error(errorData.detail || `Error ${response.status}: Failed to delete material purchases`);
    }

    return await response.json();
  },

  async processDebt(payload: {
    hoursehold_id?: string | null;
    employee_id?: string | null;
    partner_id?: string | null;
    amount: number;
    type_transaction: string;
    start_date?: string | null;
    end_date?: string | null;
  }): Promise<any> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/process-debt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('processDebt API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to process debt`);
    }

    return await response.json();
  },

  async processLossControl(params: {
    collection_point_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<any> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/process-loss-control`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('processLossControl API Error:', response.status, errorData);

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

      throw new Error(errorData.detail || `Error ${response.status}: Failed to process loss control`);
    }

    return await response.json();
  },

  async processAdvanceAmount(payload: Array<{
    hoursehold_id: string;
    amount: number;
    /** SEASON_END (ứng cuối mùa, mặc định) | IN_MONTH (ứng trong tháng) */
    advance_type?: string;
  }>): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/process-advance-amount`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('processAdvanceAmount API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to process advance amount`);
    }

    return await response.json();
  },

  async processDeductionAdvanceAmount(payload: Array<{
    hoursehold_id: string;
    amount: number;
    /** SEASON_END (mặc định) | IN_MONTH */
    advance_type?: string;
    /**
     * Trừ luôn số tiền khấu trừ vào công nợ (customers.total_debt).
     * Backend mặc định false — luồng Thanh toán chi phí gọi process-debt riêng,
     * gửi true ở đó sẽ làm công nợ bị trừ hai lần.
     */
    deduct_debt?: boolean;
  }>): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/process-deduction-advance-amount`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('processDeductionAdvanceAmount API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to process deduction advance amount`);
    }

    return await response.json();
  },

  async exportPaidBill(payload: any): Promise<Blob> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/export-paid-bill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('exportPaidBill API Error:', response.status, errorData);
      if (response.status === 401) {
        authService.handle401();
      }
      throw new Error(errorData.detail || `Error ${response.status}: Failed to export paid bill`);
    }

    return await response.blob();
  },

  async exportSavedBill(payload: any): Promise<Blob> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/export-saved-bill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('exportSavedBill API Error:', response.status, errorData);
      if (response.status === 401) {
        authService.handle401();
      }
      throw new Error(errorData.detail || `Error ${response.status}: Failed to export saved bill`);
    }

    return await response.blob();
  },

  async getProjects(): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/projects/get-projects`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        authService.handle401();
      }
      throw new Error(errorData.detail || `Error ${response.status}: Failed to get projects`);
    }

    return await response.json();
  },

  async addProjects(payload: Array<{ project_name: string }>): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/projects/add-projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        authService.handle401();
      }
      throw new Error(errorData.detail || `Error ${response.status}: Failed to add projects`);
    }

    return await response.json();
  },

  async updateProjects(payload: Array<{ id: string; project_name: string }>): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/projects/update-projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        authService.handle401();
      }
      throw new Error(errorData.detail || `Error ${response.status}: Failed to update projects`);
    }

    return await response.json();
  },

  async deleteProjects(payload: string[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/projects/delete-projects`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        authService.handle401();
      }
      throw new Error(errorData.detail || `Error ${response.status}: Failed to delete projects`);
    }

    return await response.json();
  },

  async getTelegramProjectMembers(params: {
    project_id?: string;
    chat_id?: string;
    username?: string;
    role?: string;
  }): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const query = new URLSearchParams();
    if (params.project_id) query.append('project_id', params.project_id);
    if (params.chat_id) query.append('chat_id', params.chat_id);
    if (params.username) query.append('username', params.username);
    if (params.role) query.append('role', params.role);

    const response = await fetch(`${BASE_URL}/projects/get-telegram-project-members?${query.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        authService.handle401();
      }
      throw new Error(errorData.detail || `Error ${response.status}: Failed to get project members`);
    }

    return await response.json();
  },

  async addTelegramProjectMembers(payload: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/projects/add-telegram-project-members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        authService.handle401();
      }
      throw new Error(errorData.detail || `Error ${response.status}: Failed to add project members`);
    }

    return await response.json();
  },

  async updateTelegramProjectMembers(payload: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/projects/update-telegram-project-members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        authService.handle401();
      }
      throw new Error(errorData.detail || `Error ${response.status}: Failed to update project members`);
    }

    return await response.json();
  },

  async deleteTelegramProjectMembers(payload: any): Promise<any> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/projects/delete-telegram-project-members`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        authService.handle401();
      }
      throw new Error(errorData.detail || `Error ${response.status}: Failed to delete project members`);
    }

    return await response.json();
  },

  async deleteUserTelegram(payload: any): Promise<any> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/projects/delete-user-telegram`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        authService.handle401();
      }
      throw new Error(errorData.detail || `Error ${response.status}: Failed to delete user telegram`);
    }

    return await response.json();
  },

  async getTelegramGroups(params: {
    project_id: string;
    role: string;
    parent_id?: string;
  }): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const query = new URLSearchParams();
    query.append('project_id', params.project_id);
    query.append('role', params.role);
    if (params.parent_id) query.append('parent_id', params.parent_id);

    const response = await fetch(`${BASE_URL}/projects/get-telegram-groups?${query.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        authService.handle401();
      }
      throw new Error(errorData.detail || `Error ${response.status}: Failed to get telegram groups`);
    }

    return await response.json();
  },

  async getLossControls(params: {
    product_code?: string;
    processing_type?: string;
    start_date?: string;
    end_date?: string;
    estimated_completion?: string;
  } = {}): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const queryParams = new URLSearchParams();
    if (params.product_code) queryParams.append('product_code', params.product_code);
    if (params.processing_type) queryParams.append('processing_type', params.processing_type);
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    if (params.estimated_completion) queryParams.append('estimated_completion', params.estimated_completion);

    const queryString = queryParams.toString();
    const url = `${BASE_URL}/tien-nga/get-loss-controls${queryString ? `?${queryString}` : ''}`;

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
      console.error('getLossControls API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to fetch loss controls`);
    }

    return await response.json();
  },

  async addLossControls(lossControls: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/add-loss-controls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(lossControls)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('addLossControls API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to add loss controls`);
    }

    return await response.json();
  },

  async updateLossControls(lossControls: any[]): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/update-loss-controls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(lossControls)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('updateLossControls API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to update loss controls`);
    }

    return await response.json();
  },

  async deleteLossControls(ids: string[]): Promise<any> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/delete-loss-controls`, {
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
      console.error('deleteLossControls API Error:', response.status, errorData);
      
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
      
      throw new Error(errorData.detail || `Error ${response.status}: Failed to delete loss controls`);
    }

    return await response.json();
  },

  async getTelegramChatGroups(params: {
    project_id?: string;
    search_query?: string;
  } = {}): Promise<any[]> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const query = new URLSearchParams();
    if (params.project_id) query.append('project_id', params.project_id);
    if (params.search_query) query.append('search_query', params.search_query);

    const response = await fetch(`${BASE_URL}/telegram/chat/groups?${query.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        authService.handle401();
      }
      throw new Error(errorData.detail || `Error ${response.status}: Failed to get chat groups`);
    }

    return await response.json();
  },

  async getTelegramChatMessages(params: {
    chat_id: string;
    skip?: number;
    limit?: number;
    before_message_id?: number;
    search_query?: string;
  }): Promise<{ chat_id: string; total_count: number; messages: any[] }> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const query = new URLSearchParams();
    query.append('chat_id', params.chat_id);
    if (params.skip !== undefined) query.append('skip', String(params.skip));
    if (params.limit !== undefined) query.append('limit', String(params.limit));
    if (params.before_message_id !== undefined) query.append('before_message_id', String(params.before_message_id));
    if (params.search_query) query.append('search_query', params.search_query);

    const response = await fetch(`${BASE_URL}/telegram/chat/messages?${query.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        authService.handle401();
      }
      throw new Error(errorData.detail || `Error ${response.status}: Failed to get chat messages`);
    }

    return await response.json();
  },

  async sendTelegramChatMessage(payload: {
    chat_id: string;
    text_content: string;
    reply_to_message_id?: number;
  }): Promise<any> {
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
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        authService.handle401();
      }
      throw new Error(errorData.detail || `Error ${response.status}: Failed to send chat message`);
    }

    return await response.json();
  },

  async sendTelegramChatAttachment(formData: FormData): Promise<any> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/telegram/send-attachment`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        authService.handle401();
      }
      throw new Error(errorData.detail || `Error ${response.status}: Failed to send attachment`);
    }

    return await response.json();
  },

  async getTelegramChatWebSocketUrl(): Promise<string> {
    let baseUrl = await getApiUrl();
    if (baseUrl.startsWith('/')) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      baseUrl = `${protocol}//${window.location.host}${baseUrl}`;
    } else {
      baseUrl = baseUrl.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
    }
    return `${baseUrl}/telegram/chat/ws`;
  },

  async getTelegramMediaUrl(downloadUrlOrId: string): Promise<string> {
    if (!downloadUrlOrId) return '';
    if (downloadUrlOrId.startsWith('http://') || downloadUrlOrId.startsWith('https://')) {
      return downloadUrlOrId;
    }
    const BASE_URL = await getApiUrl();
    const parts = downloadUrlOrId.split('/');
    const idOrName = parts[parts.length - 1];
    return `${BASE_URL}/telegram/chat/media/${idOrName}`;
  },

  async deleteTelegramChatMessage(messageId: string, chatId?: string): Promise<any> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const query = chatId ? `?chat_id=${encodeURIComponent(chatId)}` : '';
    const response = await fetch(`${BASE_URL}/telegram/chat/messages/${messageId}${query}`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        authService.handle401();
      }
      throw new Error(errorData.detail || `Error ${response.status}: Failed to delete chat message`);
    }

    return await response.json();
  },

  async getCashAdvanceLogs(params: CashAdvanceLogFilters & {
    limit?: number;
    offset?: number;
  } = {}): Promise<any[]> {
    const queryParams = buildCashAdvanceQuery(params);
    if (params.limit !== undefined) queryParams.append('limit', String(params.limit));
    if (params.offset !== undefined) queryParams.append('offset', String(params.offset));

    return await fetchTienNga(
      `/tien-nga/get-cash-advance-logs`,
      queryParams,
      'getCashAdvanceLogs',
      'Failed to fetch cash advance logs'
    );
  },

  async countCashAdvanceLogs(params: CashAdvanceLogFilters = {}): Promise<{ total: number }> {
    return await fetchTienNga(
      `/tien-nga/count-cash-advance-logs`,
      buildCashAdvanceQuery(params),
      'countCashAdvanceLogs',
      'Failed to count cash advance logs'
    );
  },

  async getCashAdvanceSummary(params: {
    hoursehold_id?: string;
    collection_point_id?: string;
    start_date?: string;
    end_date?: string;
  } = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params.hoursehold_id) queryParams.append('hoursehold_id', params.hoursehold_id);
    if (params.collection_point_id) queryParams.append('collection_point_id', params.collection_point_id);
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);

    return await fetchTienNga(
      `/tien-nga/get-cash-advance-summary`,
      queryParams,
      'getCashAdvanceSummary',
      'Failed to fetch cash advance summary'
    );
  },

  /**
   * Xóa giao dịch ứng tiền và hoàn tác số dư của hộ dân.
   * Trả về { deleted: [...], skipped: [{ id, reason }] } — id nào không hoàn tác
   * được sẽ nằm trong `skipped` kèm lý do chứ không làm hỏng cả request.
   */
  async deleteCashAdvanceLogs(ids: string[]): Promise<{ deleted: any[]; skipped: any[] }> {
    const BASE_URL = await getApiUrl();
    const token = authService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const authHeader = `${tokenType} ${token}`;

    const response = await fetch(`${BASE_URL}/tien-nga/delete-cash-advance-logs`, {
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
      console.error('deleteCashAdvanceLogs API Error:', response.status, errorData);

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

      throw new Error(errorData.detail || `Error ${response.status}: Failed to delete cash advance logs`);
    }

    return await response.json();
  }
};



