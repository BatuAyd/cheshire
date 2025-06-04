import { useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useAuthRefresh } from '../store/authStore';

export const useWalletAuthSync = () => {
  const { isConnected, address } = useAccount();
  const { clearAuthCache } = useAuthRefresh();
  const prevAddressRef = useRef<string | undefined>(address);
  const initializedRef = useRef(false);
  
  useEffect(() => {
    // When wallet disconnects, clear auth cache
    if (!isConnected) {
      console.log('Wallet disconnected - clearing auth cache');
      clearAuthCache();
    }
  }, [isConnected]);
  
  // Clear cache when address changes (different account)
  useEffect(() => {
    // Skip on initial mount
    if (!initializedRef.current) {
      prevAddressRef.current = address;
      initializedRef.current = true;
      return;
    }
    
    // Only clear if address actually changed
    if (prevAddressRef.current !== address) {
      console.log(`Wallet address changed from ${prevAddressRef.current} to ${address} - clearing auth cache`);
      clearAuthCache();
      prevAddressRef.current = address;
    }
  }, [address]);
};