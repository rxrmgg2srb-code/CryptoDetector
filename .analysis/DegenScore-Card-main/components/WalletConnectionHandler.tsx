import { useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

/**
 * Component to handle wallet connection states and provide debugging info
 * Prevents multiple simultaneous connection requests
 */
export function WalletConnectionHandler() {
  const { wallet, connecting, connected, publicKey } = useWallet();
  const connectingRef = useRef(false);

  useEffect(() => {
    // Prevent multiple connection attempts
    if (connecting && !connectingRef.current) {
      connectingRef.current = true;
      console.log('🔄 Connection attempt started');
    } else if (!connecting && connectingRef.current) {
      connectingRef.current = false;
      if (connected) {
        console.log('✅ Connection successful');
      } else {
        console.log('❌ Connection failed or cancelled');
      }
    }
  }, [connecting, connected]);

  useEffect(() => {
    // Log wallet detection
    if (typeof window !== 'undefined') {
      console.log('🔍 Wallet Detection:');
      console.log('  - window.solana exists:', !!window.solana);
      console.log('  - Is Phantom:', window.solana?.isPhantom);
      console.log('  - Current wallet:', wallet?.adapter.name);
      console.log('  - Connecting:', connecting);
      console.log('  - Connected:', connected);
      console.log('  - PublicKey:', publicKey?.toString());

      // Warn if multiple connection attempts detected
      if (connecting && connectingRef.current) {
        console.warn(
          '⚠️ Multiple connection attempts detected. This may cause "Connection declined" error.'
        );
        console.warn(
          '💡 Close all tabs and try again, or wait for current connection to complete.'
        );
      }
    }
  }, [wallet, connecting, connected, publicKey]);

  useEffect(() => {
    // Check if Phantom is installed
    if (typeof window !== 'undefined' && !window.solana) {
      console.warn('⚠️ Phantom wallet not detected. Please install from https://phantom.app/');
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      connectingRef.current = false;
    };
  }, []);

  // This component doesn't render anything
  return null;
}

export default WalletConnectionHandler;
