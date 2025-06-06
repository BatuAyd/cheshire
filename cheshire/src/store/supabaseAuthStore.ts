import { create } from 'zustand';
import { useEffect } from 'react';

// JWT token key for localStorage
const JWT_TOKEN_KEY = 'cheshire_jwt_token';

// Types
interface AuthState {
  // State
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  userAddress: string | null;
  userExists: boolean;
  isCheckingUser: boolean;
  serverError: boolean;
  jwtToken: string | null;
  
  // Actions
  setIsAuthenticating: (isAuthenticating: boolean) => void;
  setAuthenticated: (isAuthenticated: boolean, address?: string | null, token?: string | null) => void;
  setUserExists: (exists: boolean) => void;
  setServerError: (hasError: boolean) => void;
  checkUserStatus: (walletAddress: string) => Promise<{ exists: boolean; needsSetup: boolean }>;
  signIn: (walletAddress: string, message: string, signature: string) => Promise<{ success: boolean; token?: string; error?: string }>;
  logout: () => Promise<void>;
  initializeAuth: () => void;
  getAuthHeaders: () => { Authorization?: string };
}

/**
 * Decode JWT payload without verification (for local checks only)
 */
const decodeJWT = (token: string) => {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

/**
 * Check if JWT token is expired
 */
const isTokenExpired = (token: string): boolean => {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
};

/**
 * Get stored JWT token from localStorage
 */
const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem(JWT_TOKEN_KEY);
  } catch (error) {
    console.error('Error reading stored token:', error);
    return null;
  }
};

/**
 * Store JWT token in localStorage
 */
const storeToken = (token: string) => {
  try {
    localStorage.setItem(JWT_TOKEN_KEY, token);
  } catch (error) {
    console.error('Error storing token:', error);
  }
};

/**
 * Remove JWT token from localStorage
 */
const removeToken = () => {
  try {
    localStorage.removeItem(JWT_TOKEN_KEY);
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

// Create the Zustand store
export const useSupabaseAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  isAuthenticated: false,
  isAuthenticating: false,
  userAddress: null,
  userExists: false,
  isCheckingUser: false,
  serverError: false,
  jwtToken: null,
  
  // Actions
  setIsAuthenticating: (isAuthenticating) => set({ isAuthenticating }),
  
  setAuthenticated: (isAuthenticated, address = null, token = null) => {
    if (token) {
      storeToken(token);
    }
    
    set({ 
      isAuthenticated, 
      userAddress: address,
      jwtToken: token,
      isAuthenticating: false,
      userExists: isAuthenticated // If authenticated, user must exist
    });
  },
  
  setUserExists: (exists) => set({ userExists: exists }),
  
  setServerError: (hasError) => set({ serverError: hasError }),
  
  /**
   * Check if wallet address has completed profile setup
   */
  checkUserStatus: async (walletAddress: string) => {
    console.log('🔍 Checking user status for:', walletAddress);
    set({ isCheckingUser: true });
    
    try {
      const response = await fetch(
        `http://localhost:8080/api/auth/check-user?address=${encodeURIComponent(walletAddress)}`
      );
      
      const data = await response.json();
      
      if (response.ok) {
        const exists = data.exists || false;
        set({ 
          userExists: exists, 
          isCheckingUser: false,
          serverError: false 
        });
        
        console.log(`👤 User status: exists=${exists}, needsSetup=${data.needsSetup}`);
        return { exists, needsSetup: data.needsSetup || false };
      } else {
        console.error('Error checking user status:', data.error);
        set({ isCheckingUser: false, serverError: true });
        return { exists: false, needsSetup: true };
      }
    } catch (error) {
      console.error('Failed to check user status:', error);
      set({ isCheckingUser: false, serverError: true });
      return { exists: false, needsSetup: true };
    }
  },
  
  /**
   * Sign in with wallet signature (only for users with completed profiles)
   */
  signIn: async (walletAddress: string, message: string, signature: string) => {
    console.log('🔐 Attempting JWT sign in for:', walletAddress);
    set({ isAuthenticating: true });
    
    try {
      const response = await fetch('http://localhost:8080/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, signature }),
      });
      
      const data = await response.json();
      
      if (data.success && data.token) {
        // Store token and update state
        get().setAuthenticated(true, walletAddress, data.token);
        console.log('✅ JWT sign in successful');
        
        return { success: true, token: data.token };
      } else {
        console.log('❌ JWT sign in failed:', data.error);
        set({ isAuthenticating: false });
        
        return { 
          success: false, 
          error: data.error || 'Sign in failed',
          needsSetup: data.needsSetup 
        };
      }
    } catch (error) {
      console.error('Sign in error:', error);
      set({ isAuthenticating: false, serverError: true });
      return { success: false, error: 'Network error occurred' };
    }
  },
  
  /**
   * Logout and invalidate JWT session
   */
  logout: async () => {
    const { jwtToken } = get();
    
    try {
      if (jwtToken) {
        await fetch('http://localhost:8080/api/auth/signout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${jwtToken}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Clear local state and storage
    removeToken();
    set({ 
      isAuthenticated: false, 
      userAddress: null,
      userExists: false,
      jwtToken: null,
      serverError: false
    });
    
    console.log('✅ Logged out successfully');
  },
  
  /**
   * Initialize auth state from stored JWT token
   */
  initializeAuth: () => {
    console.log('🚀 Initializing JWT auth');
    
    const storedToken = getStoredToken();
    
    if (!storedToken) {
      console.log('📭 No stored JWT token found');
      set({ 
        isAuthenticated: false,
        userAddress: null,
        userExists: false,
        jwtToken: null 
      });
      return;
    }
    
    // Check if token is expired
    if (isTokenExpired(storedToken)) {
      console.log('⏰ Stored JWT token is expired');
      removeToken();
      set({ 
        isAuthenticated: false,
        userAddress: null,
        userExists: false,
        jwtToken: null 
      });
      return;
    }
    
    // Decode token to get user address
    const decoded = decodeJWT(storedToken);
    if (decoded && decoded.wallet_address) {
      console.log('✅ Valid JWT token found, restoring session');
      set({
        isAuthenticated: true,
        userAddress: decoded.wallet_address,
        userExists: true, // If they have a JWT, they must have completed setup
        jwtToken: storedToken
      });
    } else {
      console.log('❌ Invalid JWT token format');
      removeToken();
      set({ 
        isAuthenticated: false,
        userAddress: null,
        userExists: false,
        jwtToken: null 
      });
    }
  },
  
  /**
   * Get Authorization headers for API calls
   */
  getAuthHeaders: () => {
    const { jwtToken } = get();
    
    if (!jwtToken) {
      return {};
    }
    
    // Check if token is expired before using it
    if (isTokenExpired(jwtToken)) {
      console.log('⏰ Token expired, clearing auth state');
      get().logout();
      return {};
    }
    
    return {
      Authorization: `Bearer ${jwtToken}`
    };
  },
}));

// Enhanced hook for auth initialization
export const useJWTAuthSync = () => {
  useEffect(() => {
    console.log('🚀 Initializing JWT auth sync');
    useSupabaseAuthStore.getState().initializeAuth();
  }, []);
  
  return null;
};

// STABLE function references
const stableLogout = () => useSupabaseAuthStore.getState().logout();
const stableCheckUserStatus = (address: string) => useSupabaseAuthStore.getState().checkUserStatus(address);
const stableSignIn = (address: string, message: string, signature: string) => 
  useSupabaseAuthStore.getState().signIn(address, message, signature);

// Hook for auth actions
export const useSupabaseAuthActions = () => {
  return {
    logout: stableLogout,
    checkUserStatus: stableCheckUserStatus,
    signIn: stableSignIn,
    getAuthHeaders: () => useSupabaseAuthStore.getState().getAuthHeaders()
  };
};