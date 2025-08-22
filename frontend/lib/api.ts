import axios, { AxiosError } from 'axios';
import { tokenStorage } from './jwt';

// API Base Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Add auth header if token exists and is not expired
    if (tokenStorage.isAuthenticated()) {
      const authHeader = tokenStorage.getAuthHeader();
      if (authHeader) {
        config.headers.Authorization = authHeader;
      }
    }
    
    // Add timestamp to prevent caching issues
    config.headers['X-Requested-At'] = new Date().toISOString();
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Create admin API client with admin token
const adminApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Admin request interceptor
adminApiClient.interceptors.request.use(
  (config) => {
    // Add admin auth header if admin token exists
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
    
    // Add timestamp to prevent caching issues
    config.headers['X-Requested-At'] = new Date().toISOString();
    
    return config;
  },
  (error) => {
    console.error('Admin request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Admin response interceptor
adminApiClient.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ ADMIN ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  (error: AxiosError) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ ADMIN ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status}`, error.response?.data);
    }
    
    // Handle admin authentication errors
    if (error.response?.status === 401) {
      console.warn('Admin authentication failed, clearing admin tokens and redirecting to admin login');
      
      // Clear invalid admin tokens
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      
      // Only redirect if we're not already on admin login page
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/admin/login')) {
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 100);
      }
    }
    
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    // Log successful requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  (error: AxiosError) => {
    // Log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status}`, error.response?.data);
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      console.warn('Authentication failed, clearing tokens and redirecting to login');
      
      // Clear invalid tokens
      tokenStorage.clearToken();
      
      // Only redirect if we're not already on login/signup pages
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/signup')) {
        // Use setTimeout to avoid navigation during React render
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error - API server may be down');
    }
    
    return Promise.reject(error);
  }
);

// OTP Purpose enum
export enum OTPPurpose {
  VERIFICATION = 'verification',
  FORGOT_PASSWORD = 'forgot_password'
}

// Auth API endpoints
export const authAPI = {
  register: (userData: {
    email: string;
    password: string;
    fname: string;
    lname: string;
    phone_number?: string;
  }) => apiClient.post('/api/v1/auth/register', userData),

  login: (credentials: {
    email: string;
    password: string;
  }) => apiClient.post('/api/v1/auth/login', credentials),

  logout: () => apiClient.post('/api/v1/auth/logout'),

  getCurrentUser: () => apiClient.get('/api/v1/auth/me'),

  changePassword: (passwordData: {
    current_password: string;
    new_password: string;
  }) => apiClient.post('/api/v1/auth/change-password', passwordData),

  checkEmailAvailability: (email: string) => 
    apiClient.get(`/api/v1/auth/check-email/${encodeURIComponent(email)}`),

  requestPasswordReset: (email: string) => 
    apiClient.post('/api/v1/auth/request-password-reset', { email }),

  resetPassword: (email: string, newPassword: string, otpCode: string) => {
    return apiClient.post('/api/v1/auth/reset-password', {
      email,
      new_password: newPassword,
      otp_code: otpCode
    });
  },

  verifyOtp: (userId: number, otpCode: string, forPurpose?: OTPPurpose) => 
    apiClient.post('/api/v1/auth/verify-otp', { 
      user_id: userId, 
      otp_code: otpCode,
      for_purpose: forPurpose
    }),

  resendOtp: (userId: number, forPurpose?: OTPPurpose) => 
    apiClient.post('/api/v1/auth/resend-otp', { 
      user_id: userId,
      for_purpose: forPurpose
    }),
};

// User API endpoints
export const userAPI = {
  getProfile: () => apiClient.get('/api/v1/users/profile'),
  
  updateProfile: (userData: {
    fname?: string;
    lname?: string;
  }) => apiClient.put('/api/v1/users/profile', userData),

  getUsers: (params?: {
    skip?: number;
    limit?: number;
    is_active?: boolean;
    search?: string;
  }) => apiClient.get('/api/v1/users/', { params }),
};

// Admin API endpoints
export const adminAPI = {
  login: (credentials: {
    email: string;
    password: string;
  }) => apiClient.post('/api/v1/admin/login', credentials),

  getCurrentAdmin: () => adminApiClient.get('/api/v1/admin/me'),

  // FAQ Management
  getFaqs: (params?: {
    page?: number;
    page_size?: number;
    only_active?: boolean;
  }) => adminApiClient.get('/api/v1/faqs/getAll', { params }),

  createFaq: (faqData: {
    question: string;
    answer: string;
  }) => adminApiClient.post('/api/v1/faqs/createOne', faqData),

  createFaqsBulk: (faqs: Array<{
    question: string;
    answer: string;
  }>) => adminApiClient.post('/api/v1/faqs/createBulk', { faqs }),

  updateFaq: (faqId: number, faqData: {
    question?: string;
    answer?: string;
    priority?: string;
  }) => adminApiClient.put(`/api/v1/faqs/update/${faqId}`, faqData),

  deleteFaq: (faqId: number) => adminApiClient.delete(`/api/v1/faqs/delete/${faqId}`),

  getFaq: (faqId: number) => adminApiClient.get(`/api/v1/faqs/${faqId}`),
};

// FAQ API endpoints (public)
export const faqAPI = {
  getFaqs: (params?: {
    page?: number;
    page_size?: number;
    only_active?: boolean;
    sort_by_priority?: boolean;
  }) => apiClient.get('/api/v1/faqs/getAll', { params }),

  getFaq: (faqId: number) => apiClient.get(`/api/v1/faqs/${faqId}`),
};

export default apiClient;
