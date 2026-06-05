import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { event } from '../lib/analytics';

export default function WalletTracker() {
  const { connected, publicKey } = useWallet();

  useEffect(() => {
    if (connected && publicKey) {
      event({
        action: 'wallet_connected',
        category: 'Wallet',
        label: publicKey.toString(),
      });
    }
  }, [connected, publicKey]);

  return null;
}
