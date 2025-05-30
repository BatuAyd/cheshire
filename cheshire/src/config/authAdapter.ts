import { createAuthenticationAdapter, AuthenticationStatus } from '@rainbow-me/rainbowkit';
import { useAuthStore } from '../store/authStore';

/**
 * Creates a simplified authentication adapter for RainbowKit
 */
export const createAdapter = () => {
  return createAuthenticationAdapter({
    /**
     * Get a nonce from the server
     */
    getNonce: async () => {
      try {
        const response = await fetch('http://localhost:8080/api/nonce');
        const { nonce } = await response.json();
        return nonce;
      } catch (error) {
        console.error('Failed to get nonce:', error);
        useAuthStore.getState().setServerError(true);
        throw new Error('Failed to get authentication nonce');
      }
    },

    /**
     * Create a simple message with the user's address, chainId, and nonce
     */
    createMessage: ({ nonce, address, chainId }) => {
      // Create a simpler message format that works with MetaMask
      return {
        prepareMessage: () => {
          // Format the message as a simple string
          return `Sign this message to authenticate with Cheshire.\n\nAddress: ${address}\nChain ID: ${chainId}\nNonce: ${nonce}`;
        }
      };
    },

    /**
     * Verify the signature on the server
     */
    verify: async ({ message, signature }) => {
      try {
        // Get the prepared message string
        const messageString = message.prepareMessage();
        
        // Send to server for verification
        const verifyRes = await fetch('http://localhost:8080/api/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            message: messageString,
            signature 
          }),
        });

        const data = await verifyRes.json();
        
        if (data.ok) {
          // Update auth store
          useAuthStore.getState().setAuthenticated(true, data.address);
          useAuthStore.getState().setServerError(false);
          return true;
        }
        
        useAuthStore.getState().setServerError(false);
        return false;
      } catch (error) {
        console.error('Verification error:', error);
        useAuthStore.getState().setServerError(true);
        return false;
      }
    },

    /**
     * Sign out
     */
    signOut: async () => {
      await useAuthStore.getState().logout();
    },
  });
};

/**
 * Hook to create the auth adapter and get current authentication status
 */
export const useAuthAdapter = () => {
  // Get authentication state from Zustand store
  const { isAuthenticated, isAuthenticating } = useAuthStore();
  
  // Convert auth state to RainbowKit format
  const authenticationStatus: AuthenticationStatus = 
    isAuthenticating ? 'loading' : 
    isAuthenticated ? 'authenticated' : 
    'unauthenticated';
  
  // Create the adapter
  const adapter = createAdapter();
  
  return {
    adapter,
    status: authenticationStatus,
  };
};