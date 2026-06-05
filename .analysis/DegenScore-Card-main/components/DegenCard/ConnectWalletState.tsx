import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function ConnectWalletState() {
  return (
    <div className="text-center space-y-6">
      <div className="text-8xl mb-6 animate-float">🔐</div>
      <h2 className="text-3xl font-black text-white mb-3 drop-shadow-lg">Connect Your Wallet</h2>
      <p className="text-gray-300 text-lg mb-8 max-w-md mx-auto">
        Connect your Solana wallet to generate your DegenScore card with real on-chain metrics
      </p>
      <div className="flex justify-center">
        <div className="transform hover:scale-110 transition-transform duration-300">
          <WalletMultiButton />
        </div>
      </div>
    </div>
  );
}
