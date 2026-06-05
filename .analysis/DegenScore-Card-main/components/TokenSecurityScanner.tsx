import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTokenSecurity } from '@/hooks/useTokenSecurity';
import ScannerHeader from './TokenSecurityScanner/ScannerHeader';
import ScannerInput from './TokenSecurityScanner/ScannerInput';
import SecurityReport from './TokenSecurityScanner/SecurityReport';

export default function TokenSecurityScanner() {
  const {
    tokenAddress,
    setTokenAddress,
    loading,
    report,
    progress,
    progressMessage,
    analyzeToken,
    handlePaste,
  } = useTokenSecurity();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <ScannerHeader />

      <ScannerInput
        tokenAddress={tokenAddress}
        setTokenAddress={setTokenAddress}
        loading={loading}
        analyzeToken={analyzeToken}
        handlePaste={handlePaste}
        progress={progress}
        progressMessage={progressMessage}
      />

      <AnimatePresence>
        {report && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <SecurityReport report={report} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
