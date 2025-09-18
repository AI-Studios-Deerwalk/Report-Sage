import axios, { AxiosError } from "axios";
import { tokenStorage } from "./jwt";

// API Base Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 second timeout for general requests
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
    config.headers["X-Requested-At"] = new Date().toISOString();

    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Create admin API client with admin token
const adminApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Admin request interceptor
adminApiClient.interceptors.request.use(
  (config) => {
    // Add admin auth header if admin token exists
    const adminToken = localStorage.getItem("adminToken");
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }

    // Add timestamp to prevent caching issues
    config.headers["X-Requested-At"] = new Date().toISOString();

    return config;
  },
  (error) => {
    console.error("Admin request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Admin response interceptor
adminApiClient.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `✅ ADMIN ${response.config.method?.toUpperCase()} ${
          response.config.url
        } - ${response.status}`
      );
    }
    return response;
  },
  (error: AxiosError) => {
    if (process.env.NODE_ENV === "development") {
      console.error(
        `❌ ADMIN ${error.config?.method?.toUpperCase()} ${
          error.config?.url
        } - ${error.response?.status}`,
        error.response?.data
      );
    }

    // Handle admin authentication errors
    if (error.response?.status === 401) {
      console.warn(
        "Admin authentication failed, clearing admin tokens and redirecting to admin login"
      );

      // Clear invalid admin tokens
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminData");

      // Only redirect if we're not already on admin login page
      const currentPath = window.location.pathname;
      if (!currentPath.includes("/admin/login")) {
        // Use router if available, otherwise use window.location
        if (typeof window !== "undefined") {
          setTimeout(() => {
            window.location.href = "/admin/login";
          }, 100);
        }
      }
    }

    // Handle other authentication-related errors
    if (error.response?.status === 403) {
      console.warn(
        "Admin access forbidden, clearing admin tokens and redirecting to admin login"
      );
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminData");

      const currentPath = window.location.pathname;
      if (!currentPath.includes("/admin/login")) {
        if (typeof window !== "undefined") {
          setTimeout(() => {
            window.location.href = "/admin/login";
          }, 100);
        }
      }
    }

    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    // Log successful requests in development
    if (process.env.NODE_ENV === "development") {
      console.log(
        `✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${
          response.status
        }`
      );
    }
    return response;
  },
  (error: AxiosError) => {
    // Log errors in development
    if (process.env.NODE_ENV === "development") {
      console.error(
        `❌ ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${
          error.response?.status
        }`,
        error.response?.data
      );
    }

    // Handle authentication errors
    if (error.response?.status === 401) {
      console.warn(
        "Authentication failed, clearing tokens and redirecting to login"
      );

      // Clear invalid tokens
      tokenStorage.clearToken();

      // Only redirect if we're not already on login/signup pages
      const currentPath = window.location.pathname;
      if (!currentPath.includes("/login") && !currentPath.includes("/signup")) {
        // Use setTimeout to avoid navigation during React render
        setTimeout(() => {
          window.location.href = "/login";
        }, 100);
      }
    }

    // Handle network errors
    if (!error.response) {
      console.error("Network error - API server may be down");
    }

    return Promise.reject(error);
  }
);

// OTP Purpose enum
export enum OTPPurpose {
  VERIFICATION = "verification",
  FORGOT_PASSWORD = "forgot_password",
}

// Auth API endpoints
export const authAPI = {
  register: (userData: {
    email: string;
    password: string;
    fname: string;
    lname: string;
    phone_number?: string;
  }) => apiClient.post("/api/v1/auth/register", userData),

  login: (credentials: { email: string; password: string }) =>
    apiClient.post("/api/v1/auth/login", credentials),

  logout: () => apiClient.post("/api/v1/auth/logout"),

  getCurrentUser: () => apiClient.get("/api/v1/auth/me"),

  changePassword: (passwordData: {
    current_password: string;
    new_password: string;
  }) => apiClient.post("/api/v1/auth/change-password", passwordData),

  checkEmailAvailability: (email: string) =>
    apiClient.get(`/api/v1/auth/check-email/${encodeURIComponent(email)}`),

  requestPasswordReset: (email: string) =>
    apiClient.post("/api/v1/auth/request-password-reset", { email }),

  resetPassword: (email: string, newPassword: string, otpCode: string) => {
    return apiClient.post("/api/v1/auth/reset-password", {
      email,
      new_password: newPassword,
      otp_code: otpCode,
    });
  },

  verifyOtp: (userId: number, otpCode: string, forPurpose?: OTPPurpose) =>
    apiClient.post("/api/v1/auth/verify-otp", {
      user_id: userId,
      otp_code: otpCode,
      for_purpose: forPurpose,
    }),

  resendOtp: (userId: number, forPurpose?: OTPPurpose) =>
    apiClient.post("/api/v1/auth/resend-otp", {
      user_id: userId,
      for_purpose: forPurpose,
    }),
};

// User API endpoints
export const userAPI = {
  getProfile: () => apiClient.get("/api/v1/users/profile"),

  updateProfile: (userData: {
    fname?: string;
    lname?: string;
    phone_number?: string;
    profile_url?: string;
  }) => apiClient.put("/api/v1/users/profile", userData),

  // Profile picture upload
  uploadProfilePicture: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post("/api/v1/users/profile/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Delete profile picture
  deleteProfilePicture: () => apiClient.delete("/api/v1/users/profile/picture"),

  getUsers: (params?: {
    skip?: number;
    limit?: number;
    is_active?: boolean;
    search?: string;
  }) => apiClient.get("/api/v1/users/", { params }),

  // Issue reporting
  submitIssue: (issueData: FormData) =>
    apiClient.post("/api/v1/issue/addIssue", issueData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  // Get user's issues
  getUserIssues: () => apiClient.get("/api/v1/issue/getUserIssues"),

  // Delete user's issue
  deleteIssue: (issueId: string) =>
    apiClient.delete(`/api/v1/issue/delete/${issueId}`),
};

// Archive API endpoints
export const archiveAPI = {
  getArchives: (params?: { skip?: number; limit?: number }) =>
    apiClient.get("/api/v1/archive/", {
      params,
      timeout: 45000, // 45 second timeout for archive loading
    }),

  getArchive: (archiveId: number) =>
    apiClient.get(`/api/v1/archive/${archiveId}`, {
      timeout: 15000, // 15 second timeout for polling requests
    }),

  uploadDocument: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post("/api/v1/archive/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 120000, // 2 minute timeout for file uploads with analysis
    });
  },

  uploadDocumentTest: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post("/api/v1/archive/upload-test", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 120000, // 2 minute timeout for file uploads with analysis
    });
  },

  deleteArchive: (archiveId: number) =>
    apiClient.delete(`/api/v1/archive/${archiveId}`),

  updateArchive: (archiveId: number, updateData: { file_name?: string }) =>
    apiClient.put(`/api/v1/archive/${archiveId}`, updateData),

  reanalyzeArchive: (archiveId: number) =>
    apiClient.post(`/api/v1/archive/${archiveId}/reanalyze`),

  // Sequential analysis status endpoints
  getAbstractStatus: (archiveId: number) =>
    apiClient.get(`/api/v1/archive/${archiveId}/abstract-status`),

  getAcknowledgementStatus: (archiveId: number) =>
    apiClient.get(`/api/v1/archive/${archiveId}/acknowledgement-status`),

  getAbstractStatusTest: (archiveId: number) =>
    apiClient.get(`/api/v1/archive/${archiveId}/abstract-status-test`),

  getAcknowledgementStatusTest: (archiveId: number) =>
    apiClient.get(`/api/v1/archive/${archiveId}/acknowledgement-status-test`),
};

// Analysis API endpoints
export const analysisAPI = {
  analyzeAbstract: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post("/analyze-abstract", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 60000, // 60 second timeout for analysis
    });
  },

  analyzeAcknowledgement: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post("/analyze-acknowledgement", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 60000, // 60 second timeout for analysis
    });
  },
};

// FAQ API endpoints
export const faqAPI = {
  getFaqs: (params?: {
    page?: number;
    page_size?: number;
    only_active?: boolean;
    sort_by_priority?: boolean;
  }) => apiClient.get("/api/v1/faq/getAll", { params }),

  getFaq: (faqId: number) => apiClient.get(`/api/v1/faq/${faqId}`),

  createFaq: (faqData: {
    question: string;
    answer: string;
    priority?: string;
  }) => apiClient.post("/api/v1/faq/createOne", faqData),

  updateFaq: (
    faqId: number,
    faqData: {
      question?: string;
      answer?: string;
      priority?: string;
    }
  ) => apiClient.put(`/api/v1/faq/update/${faqId}`, faqData),

  deleteFaq: (faqId: number) => apiClient.delete(`/api/v1/faq/delete/${faqId}`),

  createFaqsBulk: (faqsData: {
    faqs: Array<{
      question: string;
      answer: string;
      priority?: string;
    }>;
  }) => apiClient.post("/api/v1/faq/createBulk", faqsData),
};

// Admin API endpoints
export const adminAPI = {
  // Admin authentication
  login: (credentials: { email: string; password: string }) =>
    adminApiClient.post("/api/v1/admin/login", credentials),

  // FAQ management (admin only)
  getFaqs: (params?: {
    page?: number;
    page_size?: number;
    only_active?: boolean;
    sort_by_priority?: boolean;
  }) => adminApiClient.get("/api/v1/faq/getAll", { params }),

  createFaq: (faqData: {
    question: string;
    answer: string;
    priority?: string;
  }) => adminApiClient.post("/api/v1/faq/createOne", faqData),

  updateFaq: (
    faqId: number,
    faqData: {
      question?: string;
      answer?: string;
      priority?: string;
    }
  ) => adminApiClient.put(`/api/v1/faq/update/${faqId}`, faqData),

  deleteFaq: (faqId: number) =>
    adminApiClient.delete(`/api/v1/faq/delete/${faqId}`),

  createFaqsBulk: (faqsData: {
    faqs: Array<{
      question: string;
      answer: string;
      priority?: string;
    }>;
  }) => adminApiClient.post("/api/v1/faq/createBulk", faqsData),

  // User management (admin only)
  getUsers: (params?: {
    skip?: number;
    limit?: number;
    is_active?: boolean;
    search?: string;
    status_filter?: string;
  }) => adminApiClient.get("/api/v1/admin/users", { params }),

  getUserStats: () => adminApiClient.get("/api/v1/admin/users/stats"),

  blockUser: (userId: number) =>
    adminApiClient.post(`/api/v1/admin/users/block/${userId}`),

  unblockUser: (userId: number) =>
    adminApiClient.post(`/api/v1/admin/users/unblock/${userId}`),

  verifyUser: (userId: number) =>
    adminApiClient.post(`/api/v1/admin/users/verify/${userId}`),

  deleteUser: (userId: number) =>
    adminApiClient.delete(`/api/v1/admin/users/delete/${userId}`),

  // Archive management (admin only)
  getArchives: (params?: { skip?: number; limit?: number }) =>
    adminApiClient.get("/api/v1/archive/", { params }),

  getArchive: (archiveId: number) =>
    adminApiClient.get(`/api/v1/archive/${archiveId}`),

  deleteArchive: (archiveId: number) =>
    adminApiClient.delete(`/api/v1/archive/${archiveId}`),

  reanalyzeArchive: (archiveId: number) =>
    adminApiClient.post(`/api/v1/archive/${archiveId}/reanalyze`),

  // Issue management (admin only)
  getIssues: (params?: {
    skip?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) => adminApiClient.get("/api/v1/issue/getAll", { params }),

  getIssue: (issueId: string) => adminApiClient.get(`/api/v1/issue/${issueId}`),

  updateIssueStatus: (
    issueId: string,
    status: {
      status: string;
    }
  ) => adminApiClient.patch(`/api/v1/issue/updateStatus/${issueId}`, status),

  getUnreadCount: () => adminApiClient.get("/api/v1/issue/unread/count"),
};

export default apiClient;
