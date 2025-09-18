/**
 * JWT Token utilities for client-side token management
 */

export interface TokenData {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    uid: string;
    email: string;
    fname: string;
    lname: string;
    is_email_verified: boolean;
    is_active: boolean;
    created_at: string;
    notifications_enabled: boolean;
  };
}

/**
 * Token storage utilities
 */
export const tokenStorage = {
  /**
   * Store token data in localStorage
   */
  setToken: (tokenData: TokenData) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", tokenData.access_token);
      localStorage.setItem("token_type", tokenData.token_type);
      localStorage.setItem(
        "token_expires_at",
        new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      );
      localStorage.setItem("user_data", JSON.stringify(tokenData.user));
    }
  },

  /**
   * Get stored token
   */
  getToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token");
  },

  /**
   * Get stored user data
   */
  getUserData: (): TokenData["user"] | null => {
    if (typeof window === "undefined") return null;
    const userData = localStorage.getItem("user_data");
    return userData ? JSON.parse(userData) : null;
  },

  /**
   * Check if token is expired
   */
  isTokenExpired: (): boolean => {
    if (typeof window === "undefined") return true;

    const expiresAt = localStorage.getItem("token_expires_at");
    if (!expiresAt) return true;

    try {
      const expirationDate = new Date(expiresAt);
      const now = new Date();

      // Add a 30-second buffer to prevent edge cases
      const bufferTime = 30 * 1000; // 30 seconds in milliseconds
      return now >= new Date(expirationDate.getTime() - bufferTime);
    } catch (error) {
      console.error("Error parsing token expiration date:", error);
      return true;
    }
  },

  /**
   * Clear all token data
   */
  clearToken: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("token_type");
      localStorage.removeItem("token_expires_at");
      localStorage.removeItem("user_data");
    }
  },

  /**
   * Get token with Bearer prefix for Authorization header
   */
  getAuthHeader: (): string | null => {
    const token = tokenStorage.getToken();
    return token ? `Bearer ${token}` : null;
  },

  /**
   * Check if user is authenticated and token is valid
   */
  isAuthenticated: (): boolean => {
    const token = tokenStorage.getToken();
    const userData = tokenStorage.getUserData();

    // Must have both token and user data
    if (!token || !userData) {
      return false;
    }

    // Check if token is expired
    if (tokenStorage.isTokenExpired()) {
      return false;
    }

    return true;
  },
};

/**
 * JWT payload decoder (without verification - for client-side info only)
 * Note: This is for convenience only, server should always validate tokens
 */
export const decodeJWT = (token: string) => {
  try {
    const payload = token.split(".")[1];
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
};

/**
 * Get token expiration time from JWT payload
 */
export const getTokenExpiration = (token: string): Date | null => {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return null;

  return new Date(payload.exp * 1000);
};

/**
 * Check if JWT token is expired based on its payload
 */
export const isJWTExpired = (token: string): boolean => {
  const expiration = getTokenExpiration(token);
  if (!expiration) return true;

  return new Date() >= expiration;
};
