import { create } from 'zustand';
import { useEffect } from 'react';

// Cache configuration
const CACHE_DURATION = 6 * 60 * 1000; // 6 minutes in milliseconds
const CACHE_KEY = 'cheshire_auth_cache';

// Types
interface AuthCache {
  isAuthenticated: boolean;
  userAddress: string | null;
  timestamp: number;
}

interface AuthState {
  // State
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  userAddress: string | null;
  serverError: boolean;
  lastCacheCheck: number;
  
  // Actions
  setIsAuthenticating: (isAuthenticating: boolean) => void;
  setAuthenticated: (isAuthenticated: boolean, address?: string | null) => void;
  setServerError: (hasError: boolean) => void;
  checkAuthStatus: (forceCheck?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  clearCache: () => void;
}

// Cache helpers
const getCachedAuth = (): AuthCache | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const parsed: AuthCache = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is still valid
    if (now - parsed.timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    return parsed;
  } catch (error) {
    console.error('Error reading auth cache:', error);
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
};

const setCachedAuth = (isAuthenticated: boolean, userAddress: string | null) => {
  try {
    const cacheData: AuthCache = {
      isAuthenticated,
      userAddress,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error setting auth cache:', error);
  }
};

const clearCachedAuth = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Error clearing auth cache:', error);
  }
};

// Create the Zustand store
export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  isAuthenticated: false,
  isAuthenticating: false,
  userAddress: null,
  serverError: false,
  lastCacheCheck: 0,
  
  // Actions
  setIsAuthenticating: (isAuthenticating) => set({ isAuthenticating }),
  
  setAuthenticated: (isAuthenticated, address = null) => {
    // Update cache when auth state changes
    setCachedAuth(isAuthenticated, address);
    
    set({ 
      isAuthenticated, 
      userAddress: address,
      isAuthenticating: false,
      lastCacheCheck: Date.now()
    });
  },
  
  setServerError: (hasError) => set({ serverError: hasError }),
  
  clearCache: () => {
    clearCachedAuth();
    set({ lastCacheCheck: 0 });
  },
  
  checkAuthStatus: async (forceCheck = false) => {
    const state = get();
    const now = Date.now();
    
    // If not forcing check, try to use cache first
    if (!forceCheck) {
      const cached = getCachedAuth();
      if (cached) {
        console.log('🟢 Using cached auth status (no server call)');
        set({
          isAuthenticated: cached.isAuthenticated,
          userAddress: cached.userAddress,
          isAuthenticating: false,
          serverError: false,
          lastCacheCheck: now
        });
        return;
      }
    }
    
    // Cache miss or forced check - call server
    console.log('🔵 Checking auth status with server');
    set({ isAuthenticating: true });
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('http://localhost:8080/api/me', {
        credentials: 'include',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      // Update both state and cache
      const isAuth = data.authenticated || false;
      const address = data.address || null;
      
      setCachedAuth(isAuth, address);
      
      set({ 
        isAuthenticated: isAuth, 
        userAddress: address,
        isAuthenticating: false,
        serverError: false,
        lastCacheCheck: now
      });
      
    } catch (error) {
      console.error('Failed to check auth status:', error);
      
      // Clear cache on error
      clearCachedAuth();
      
      set({ 
        isAuthenticated: false, 
        userAddress: null,
        isAuthenticating: false,
        serverError: true,
        lastCacheCheck: now
      });
    }
  },
  
  logout: async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      await fetch('http://localhost:8080/api/logout', {
        method: 'POST',
        credentials: 'include',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Clear cache and update state
      clearCachedAuth();
      set({ 
        isAuthenticated: false, 
        userAddress: null,
        serverError: false,
        lastCacheCheck: Date.now()
      });
      
    } catch (error) {
      console.error('Logout error:', error);
      
      // Still log out locally and clear cache
      clearCachedAuth();
      set({ 
        isAuthenticated: false, 
        userAddress: null,
        serverError: true,
        lastCacheCheck: Date.now()
      });
    }
  },
}));

// Enhanced hook for auth synchronization
export const useAuthSync = () => {
  useEffect(() => {
    console.log('🚀 Initializing auth sync');
    
    // Always check on app startup (but try cache first)
    useAuthStore.getState().checkAuthStatus();
    
    // Set up periodic cache refresh
    const interval = setInterval(() => {
      const { lastCacheCheck } = useAuthStore.getState();
      const now = Date.now();
      
      // If cache is older than 6 minutes, refresh it
      if (now - lastCacheCheck > CACHE_DURATION) {
        console.log('⏰ Cache expired, refreshing auth status');
        useAuthStore.getState().checkAuthStatus();
      }
    }, CACHE_DURATION); // Check every 6 minutes
    
    return () => clearInterval(interval);
  }, []);
  
  return null;
};

// Hook to manually refresh auth (for wallet connection changes)
export const useAuthRefresh = () => {
  const checkAuthStatus = useAuthStore((state) => state.checkAuthStatus);
  const clearCache = useAuthStore((state) => state.clearCache);
  
  return {
    refreshAuth: () => checkAuthStatus(true), // Force server check
    clearAuthCache: clearCache
  };
};