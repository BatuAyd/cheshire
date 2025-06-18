// cheshire/src/utils/api.ts
import { useSupabaseAuthStore } from '../store/supabaseAuthStore';

/**
 * Enhanced fetch that automatically includes JWT headers
 * Drop-in replacement for regular fetch() calls
 */
export const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  // Get JWT headers from auth store
  const authHeaders = useSupabaseAuthStore.getState().getAuthHeaders();
  
  // Merge auth headers with existing headers
  const enhancedOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders, // JWT Authorization header
      ...options.headers, // User-provided headers override defaults
    },
  };
  
  // Make the request
  return fetch(url, enhancedOptions);
};

/**
 * Convenience wrapper for JSON API calls
 * Automatically parses JSON response and handles common errors
 */
export const apiCall = async <T = any>(url: string, options: RequestInit = {}): Promise<T> => {
  try {
    const response = await apiFetch(url, options);
    
    // Handle non-JSON error responses
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }
    
    // Parse JSON response
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};