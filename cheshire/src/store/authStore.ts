import { create } from 'zustand';
import { useEffect } from 'react';

// Define the auth store state type
interface AuthState {
  // State
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  userAddress: string | null;
  serverError: boolean;
  
  // Actions
  setIsAuthenticating: (isAuthenticating: boolean) => void;
  setAuthenticated: (isAuthenticated: boolean, address?: string | null) => void;
  setServerError: (hasError: boolean) => void;
  checkAuthStatus: () => Promise<void>;
  logout: () => Promise<void>;
}

// Create the Zustand store
export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  isAuthenticated: false,
  isAuthenticating: false,
  userAddress: null,
  serverError: false,
  
  // Actions
  setIsAuthenticating: (isAuthenticating) => set({ isAuthenticating }),
  
  setAuthenticated: (isAuthenticated, address = null) => set({ 
    isAuthenticated, 
    userAddress: address,
    isAuthenticating: false 
  }),
  
  setServerError: (hasError) => set({ serverError: hasError }),
  
  checkAuthStatus: async () => {
    set({ isAuthenticating: true });
    try {
      // Use a timeout to prevent hanging if server is down
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('http://localhost:8080/api/me', {
        credentials: 'include',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      set({ 
        isAuthenticated: data.authenticated || false, 
        userAddress: data.address || null,
        isAuthenticating: false,
        serverError: false
      });
    } catch (error) {
      console.error('Failed to check auth status:', error);
      set({ 
        isAuthenticated: false, 
        userAddress: null,
        isAuthenticating: false,
        serverError: true
      });
    }
  },
  
  logout: async () => {
    try {
      // Use a timeout to prevent hanging if server is down
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      await fetch('http://localhost:8080/api/logout', {
        method: 'POST',
        credentials: 'include',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      set({ 
        isAuthenticated: false, 
        userAddress: null,
        serverError: false
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Still log the user out locally even if server call fails
      set({ 
        isAuthenticated: false, 
        userAddress: null,
        serverError: true
      });
    }
  },
}));

// Hook to initialize auth
export const useAuthSync = () => {
  // Check auth status on mount
  useEffect(() => {
    useAuthStore.getState().checkAuthStatus();
  }, []);
  
  return null;
};