import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScannerInputProps {
  tokenAddress: string;
  setTokenAddress: (address: string) => void;
  loading: boolean;
  analyzeToken: () => void;
  handlePaste: () => void;
  progress: number;
  progressMessage: string;
}

export default function ScannerInput({
  tokenAddress,
  setTokenAddress,
  loading,
  analyzeToken,
  handlePaste,
  progress,
  progressMessage,
}: ScannerInputProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6 mb-6"
    >
      <label className="block text-gray-300 font-semibold mb-3">Token Address (Mint Address)</label>
      <div className="flex gap-3">
        <input
          type="text"
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value)}
          placeholder="Enter Solana token mint address..."
          className="flex-1 bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !loading) {
              analyzeToken();
            }
          }}
        />
        <button
          onClick={handlePaste}
          className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors text-white font-medium"
        >
          📋 Paste
        </button>
        <button
          onClick={analyzeToken}
          disabled={loading || !tokenAddress.trim()}
          className={`px-8 py-3 rounded-xl font-bold transition-all ${
            loading || !tokenAddress.trim()
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/50'
          }`}
        >
          {loading ? '🔍 Analyzing...' : '🔒 Analyze Security'}
        </button>
      </div>

      {/* Progress Bar */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4"
          >
            <div className="bg-gray-900/50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-sm">{progressMessage}</span>
                <span className="text-purple-400 font-bold">{progress}%</span>
              </div>
              <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
