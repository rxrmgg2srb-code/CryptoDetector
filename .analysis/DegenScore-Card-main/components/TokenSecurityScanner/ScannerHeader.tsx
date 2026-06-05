import React from 'react';
import { motion } from 'framer-motion';

export default function ScannerHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center mb-8"
    >
      <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent mb-4">
        🔒 Token Security Scanner
      </h1>
      <p className="text-gray-400 text-lg">
        Analyze Solana tokens for rug pulls, honeypots, and security risks
      </p>
      <p className="text-gray-500 text-sm mt-2">
        Advanced on-chain analysis • Bundle detection • Liquidity analysis • Holder distribution
      </p>
    </motion.div>
  );
}
