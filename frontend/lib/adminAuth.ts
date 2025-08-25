import { useRouter } from 'next/router';

/**
 * Utility functions for handling admin authentication errors
 */

export const handleAdminAuthError = (
  response: Response, 
  router: any, 
  action: string = 'operation'
) => {
  if (response.status === 401 || response.status === 403) {
    // Authentication expired, clear tokens and redirect
    console.warn(`Admin authentication expired during ${action}, logging out automatically`);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    
    // Use router if available, otherwise use window.location
    if (router && router.push) {
      router.push('/admin/login');
    } else if (typeof window !== 'undefined') {
      window.location.href = '/admin/login';
    }
    return true; // Indicates auth error was handled
  }
  return false; // No auth error
};

/**
 * Hook for handling admin authentication errors
 */
export const useAdminAuthError = () => {
  const router = useRouter();
  
  return {
    handleAuthError: (response: Response, action: string = 'operation') => 
      handleAdminAuthError(response, router, action)
  };
};

/**
 * Check if admin is authenticated
 */
export const isAdminAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const adminToken = localStorage.getItem('adminToken');
  const adminData = localStorage.getItem('adminData');
  
  return !!(adminToken && adminData);
};

/**
 * Get admin data from localStorage
 */
export const getAdminData = () => {
  if (typeof window === 'undefined') return null;
  
  const adminDataStr = localStorage.getItem('adminData');
  console.log('getAdminData - Raw admin data string:', adminDataStr);
  
  if (!adminDataStr) return null;
  
  try {
    const parsed = JSON.parse(adminDataStr);
    console.log('getAdminData - Parsed admin data:', parsed);
    return parsed;
  } catch (e) {
    console.error('Failed to parse admin data:', e);
    return null;
  }
};

/**
 * Check if admin is super admin
 */
export const isSuperAdmin = (): boolean => {
  const adminData = getAdminData();
  console.log('isSuperAdmin - Admin data:', adminData);
  console.log('isSuperAdmin - Result:', adminData?.is_superadmin === true);
  return adminData?.is_superadmin === true;
};

/**
 * Check if admin has permission to access a specific feature
 */
export const hasAdminPermission = (permission: 'config' | 'system' | 'users' | 'faqs' | 'issues'): boolean => {
  const adminData = getAdminData();
  
  if (!adminData) {
    return false;
  }
  
  switch (permission) {
    case 'config':
      return adminData.is_superadmin === true;
    case 'system':
    case 'users':
    case 'faqs':
    case 'issues':
      // Regular admins can access these
      return true;
    default:
      return false;
  }
};

/**
 * Clear admin authentication data
 */
export const clearAdminAuth = () => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminData');
};

/**
 * Redirect to admin login
 */
export const redirectToAdminLogin = (router?: any) => {
  if (router && router.push) {
    router.push('/admin/login');
  } else if (typeof window !== 'undefined') {
    window.location.href = '/admin/login';
  }
};
