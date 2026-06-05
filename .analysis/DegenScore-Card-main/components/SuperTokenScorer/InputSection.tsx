import React from 'react';

interface InputSectionProps {
  tokenAddress: string;
  setTokenAddress: (value: string) => void;
  loading: boolean;
  analyzeToken: () => void;
  error: string;
  progress: number;
  progressMessage: string;
}

export default function InputSection({
  tokenAddress,
  setTokenAddress,
  loading,
  analyzeToken,
  error,
  progress,
  progressMessage,
}: InputSectionProps) {
  return (
    <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-purple-500/30">
      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value)}
          placeholder="Ingresa la dirección del token (Solana)"
          className="flex-1 px-6 py-4 bg-gray-900/50 border border-purple-500/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-lg"
          disabled={loading}
        />
        <button
          onClick={analyzeToken}
          disabled={loading}
          className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 text-lg"
        >
          {loading ? '🔍 Analizando...' : '🚀 Analizar Token'}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded-xl text-red-300">
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div className="mt-6">
          <div className="mb-2 text-gray-300 font-semibold">{progressMessage}</div>
          <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 flex items-center justify-center text-xs font-bold text-white"
              style={{ width: `${progress}%` }}
            >
              {progress}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
