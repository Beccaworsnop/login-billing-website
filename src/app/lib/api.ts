
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  paymentMethod: {
    type: string;
    provider: string;
    last4Digits: string;
  };
}

export interface PaymentMethod {
  id: string;
  type: string;
  provider: string;
  last4Digits: string;
  isActive: boolean;
  addedAt: string;
}

export interface Settings {
  id: string;
  dailyLimit: number;
  monthlyLimit: number;
  maxSingleTransaction: number;
  paymentMethodLimit: number;
  privacySettings: {
    shareDataWithPartners: boolean;
    allowMarketingEmails: boolean;
    showTransactionHistory: boolean;
  };
  dataRetention: string;
}

const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
};

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

export const authAPI = {
  register: async (userData: { name: string; email: string; password: string; phone?: string }) => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    
    return response;
  },

  login: async (credentials: { email: string; password: string }) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    
    return response;
  },

  me: async (): Promise<{ user: User }> => {
    return apiRequest('/auth/me');
  },

  logout: async () => {
    const response = await apiRequest('/auth/logout', { method: 'POST' });
    localStorage.removeItem('authToken');
    return response;
  },
};

export const transactionsAPI = {
  getAll: async (params?: { page?: number; limit?: number; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.status) searchParams.append('status', params.status);
    
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiRequest(`/transactions${query}`);
  },

  getById: async (id: string): Promise<{ transaction: Transaction }> => {
    return apiRequest(`/transactions/${id}`);
  },

  
  create: async (transactionData: { amount: number; methodId: string; description?: string }) => {
    return apiRequest('/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  },

  cancel: async (id: string) => {
    return apiRequest(`/transactions/${id}/cancel`, { method: 'PUT' });
  },

  getStats: async () => {
    return apiRequest('/transactions/stats');
  },
};

export const paymentMethodsAPI = {
  getAll: async (): Promise<{ paymentMethods: PaymentMethod[] }> => {
    return apiRequest('/payment-methods');
  },

  add: async (methodData: { type: string; provider: string; last4Digits: string }) => {
    return apiRequest('/payment-methods', {
      method: 'POST',
      body: JSON.stringify(methodData),
    });
  },

  remove: async (id: string) => {
    return apiRequest(`/payment-methods/${id}`, { method: 'DELETE' });
  },
};

export const settingsAPI = {
  get: async (): Promise<{ settings: Settings }> => {
    return apiRequest('/settings');
  },

  update: async (settingsData: Partial<Settings>) => {
    return apiRequest('/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    });
  },

  getLimits: async () => {
    return apiRequest('/settings/limits');
  },

  updateLimits: async (limitsData: {
    dailyLimit?: number;
    monthlyLimit?: number;
    maxSingleTransaction?: number;
    paymentMethodLimit?: number;
  }) => {
    return apiRequest('/settings/limits', {
      method: 'PUT',
      body: JSON.stringify(limitsData),
    });
  },
};

export const usersAPI = {

  getById: async (id: string): Promise<{ user: User }> => {
    return apiRequest(`/users/${id}`);
  },

  update: async (id: string, userData: Partial<User>) => {
    return apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },
};

export const utils = {

  isAuthenticated: (): boolean => {
    return !!getAuthToken();
  },

  clearAuth: () => {
    localStorage.removeItem('authToken');
  },

  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  },

  formatDate: (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },
};

export default {
  auth: authAPI,
  transactions: transactionsAPI,
  paymentMethods: paymentMethodsAPI,
  settings: settingsAPI,
  users: usersAPI,
  utils,
};