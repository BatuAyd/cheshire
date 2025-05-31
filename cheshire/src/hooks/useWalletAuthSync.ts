import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useAuthRefresh } from '../store/authStore';

export const useWalletAuthSync = () => {
  const { isConnected, address } = useAccount();
  const { clearAuthCache } = useAuthRefresh();
  
  useEffect(() => {
    // When wallet disconnects, clear auth cache
    if (!isConnected) {
      console.log('Wallet disconnected - clearing auth cache');
      clearAuthCache();
    }
  }, [isConnected, clearAuthCache]);
  
  // Clear cache when address changes (different account)
  useEffect(() => {
    console.log('Wallet address changed - clearing auth cache');
    clearAuthCache();
  }, [address, clearAuthCache]);
};