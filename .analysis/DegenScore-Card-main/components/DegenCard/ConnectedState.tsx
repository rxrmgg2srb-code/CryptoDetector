import React from 'react';
import { PublicKey } from '@solana/web3.js';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import AnalysisProgress from './AnalysisProgress';

interface ConnectedStateProps {

  publicKey: PublicKey | null;
  error: string | null;
  analyzing: boolean;
  analysisMessage: string;
  analysisProgress: number;
  loading: boolean;
  generateCard: () => void;
  isSpyMode?: boolean;
}

export default function ConnectedState({
  publicKey,
  error,
  analyzing,
  analysisMessage,
  analysisProgress,
  loading,
  generateCard,
  isSpyMode = false,
}: ConnectedStateProps) {
  return (
    <div className="space-y-6">
      <div className={`p-6 border-2 rounded-2xl shadow-[0_0_30px_rgba(34,197,94,0.3)] ${isSpyMode ? 'bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border-purple-400' : 'bg-gradient-to-r from-green-500/30 to-emerald-500/30 border-green-400'}`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className={`${isSpyMode ? 'text-purple-300' : 'text-green-300'} text-base font-bold mb-2 flex items-center justify-center sm:justify-start gap-2`}>
              <span className="text-2xl">{isSpyMode ? '🕵️' : '✅'}</span> {isSpyMode ? 'Spectator Mode Active' : 'Wallet Connected'}
            </p>
            <p className="text-white font-mono text-lg font-semibold">
              {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-8)}
            </p>
          </div>
          {!isSpyMode && (
            <div className="transform hover:scale-105 transition-transform w-full sm:w-auto flex justify-center">
              <WalletMultiButton />
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {analyzing && (
        <AnalysisProgress message={analysisMessage} progress={analysisProgress} />
      )}

      <button
        onClick={generateCard}
        disabled={loading}
        className="w-full py-6 px-8 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 hover:from-cyan-600 hover:via-blue-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-black text-xl rounded-2xl transition-all duration-300 shadow-[0_0_40px_rgba(139,92,246,0.6)] hover:shadow-[0_0_60px_rgba(139,92,246,0.8)] hover:scale-[1.02] disabled:cursor-not-allowed disabled:hover:scale-100 group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
        {loading ? (
          <span className="flex items-center justify-center relative z-10">
            <svg className="animate-spin -ml-1 mr-4 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating Card...
          </span>
        ) : (
          <span className="relative z-10 flex items-center justify-center gap-3">
            <span className="text-3xl">🎴</span>
            Generate My Card
          </span>
        )}
      </button>

    </div>
  );
}
