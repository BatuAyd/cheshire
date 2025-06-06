import { useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useSupabaseAuthStore, useSupabaseAuthActions } from '../store/supabaseAuthStore';

/**
 * Clear wallet-related localStorage data
 */
const clearWalletData = () => {
  try {
    console.log('🧹 Clearing wallet-related data due to address change...');
    
    // Clear specific wallet and auth data
    const keysToRemove = Object.keys(localStorage).filter(key => 
      key.includes('rainbow') || 
      key.includes('wallet') || 
      key.includes('wagmi') || 
      key.includes('walletconnect') ||
      key.includes('cheshire_jwt_token') // Clear our JWT too
    );
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ Removed: ${key}`);
    });
    
    // Also clear sessionStorage for wallet data
    const sessionKeysToRemove = Object.keys(sessionStorage).filter(key => 
      key.includes('rainbow') || 
      key.includes('wallet') || 
      key.includes('wagmi') || 
      key.includes('walletconnect')
    );
    
    sessionKeysToRemove.forEach(key => {
      sessionStorage.removeItem(key);
    });
    
    console.log('✅ Wallet data cleanup completed');
  } catch (error) {
    console.error('❌ Error during wallet cleanup:', error);
  }
};

export const useWalletAuthSync = () => {
  const { isConnected, address } = useAccount();
  const { logout, checkUserStatus } = useSupabaseAuthActions();
  const { isAuthenticated } = useSupabaseAuthStore();
  const prevAddressRef = useRef<string | undefined>(address);
  const initializedRef = useRef(false);
  
  // When wallet disconnects, clear auth
  useEffect(() => {
    if (!isConnected && isAuthenticated) {
      console.log('Wallet disconnected - logging out');
      logout();
      clearWalletData(); // Clean up wallet data too

      //Navigate to home page
      setTimeout(() => {
      window.location.href = '/';
    }, 100);
    }
  }, [isConnected, isAuthenticated, logout]);
  
  // Clear auth and wallet data when address changes (different account)
  useEffect(() => {
    // Skip on initial mount
    if (!initializedRef.current) {
      prevAddressRef.current = address;
      initializedRef.current = true;
      return;
    }
    
    // Only clear if address actually changed AND we had a previous address
    if (prevAddressRef.current && prevAddressRef.current !== address) {
      console.log(`🔄 Wallet address changed from ${prevAddressRef.current} to ${address}`);
      
      // Clear auth state
      logout();
      
      // Clear wallet-related localStorage to prevent conflicts
      clearWalletData();
      
      // Small delay to let cleanup complete, then reload to ensure clean state
      setTimeout(() => {
        console.log('🔄 Reloading page for clean wallet state...');
        window.location.reload();
      }, 100);
    }
    
    prevAddressRef.current = address;
  }, [address, logout]);
  
  // Check user status when wallet connects (for setup flow)
  useEffect(() => {
    if (isConnected && address && !isAuthenticated) {
      console.log('Wallet connected, checking user status for setup flow');
      checkUserStatus(address);
    }
  }, [isConnected, address, isAuthenticated, checkUserStatus]);
};