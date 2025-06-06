import { createAuthenticationAdapter, AuthenticationStatus } from '@rainbow-me/rainbowkit';
import { useSupabaseAuthStore, useSupabaseAuthActions } from '../store/supabaseAuthStore';

/**
 * Creates a JWT authentication adapter for RainbowKit
 */
export const createJWTAdapter = () => {
  return createAuthenticationAdapter({
    /**
     * Get a nonce from the server
     */
    getNonce: async () => {
      try {
        const response = await fetch('http://localhost:8080/api/auth/nonce');
        const { nonce } = await response.json();
        return nonce;
      } catch (error) {
        console.error('Failed to get nonce:', error);
        useSupabaseAuthStore.getState().setServerError(true);
        throw new Error('Failed to get authentication nonce');
      }
    },

    /**
     * Create a simple message with the user's address, chainId, and nonce
     */
    createMessage: ({ nonce, address, chainId }) => {
      return {
        prepareMessage: () => {
          return `Sign this message to authenticate with Cheshire.\n\nAddress: ${address}\nChain ID: ${chainId}\nNonce: ${nonce}`;
        }
      };
    },

    /**
     * Verify the signature and handle JWT authentication
     */
    verify: async ({ message, signature }) => {
      try {
        const messageString = message.prepareMessage();
        
        // Extract wallet address from message
        const addressMatch = messageString.match(/Address: (0x[a-fA-F0-9]{40})/);
        if (!addressMatch) {
          console.error('Could not extract address from message');
          return false;
        }
        
        const walletAddress = addressMatch[1];
        
        // Get auth actions
        const { checkUserStatus, signIn } = useSupabaseAuthActions();
        
        // First, check if user has completed profile setup
        const userStatus = await checkUserStatus(walletAddress);
        
        if (!userStatus.exists) {
          console.log('👤 User needs to complete profile setup');
          // Update auth store to indicate user exists but needs setup
          useSupabaseAuthStore.getState().setUserExists(false);
          useSupabaseAuthStore.getState().setServerError(false);
          
          // Don't authenticate - user needs to complete setup first
          return false;
        }
        
        // User exists, attempt JWT sign in
        const signInResult = await signIn(walletAddress, messageString, signature);
        
        if (signInResult.success) {
          console.log('✅ JWT authentication successful via RainbowKit');
          useSupabaseAuthStore.getState().setServerError(false);
          return true;
        } else {
          console.log('❌ JWT authentication failed via RainbowKit:', signInResult.error);
          useSupabaseAuthStore.getState().setServerError(false);
          return false;
        }
        
      } catch (error) {
        console.error('RainbowKit verification error:', error);
        useSupabaseAuthStore.getState().setServerError(true);
        return false;
      }
    },

    /**
     * Sign out
     */
    signOut: async () => {
      await useSupabaseAuthStore.getState().logout();
    },
  });
};

/**
 * Hook to create the auth adapter and get current authentication status
 */
export const useJWTAuthAdapter = () => {
  // Get authentication state from Zustand store
  const { isAuthenticated, isAuthenticating } = useSupabaseAuthStore();
  
  // Convert auth state to RainbowKit format
  const authenticationStatus: AuthenticationStatus = 
    isAuthenticating ? 'loading' : 
    isAuthenticated ? 'authenticated' : 
    'unauthenticated';
  
  // Create the adapter
  const adapter = createJWTAdapter();
  
  return {
    adapter,
    status: authenticationStatus,
  };
};