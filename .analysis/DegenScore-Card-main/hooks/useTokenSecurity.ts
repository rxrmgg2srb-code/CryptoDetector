import { useState } from 'react';
import { toast } from 'react-hot-toast';

export interface TokenSecurityReport {
  tokenAddress: string;
  securityScore: number;
  riskLevel: string;
  recommendation: string;
  tokenAuthorities: any;
  holderDistribution: any;
  liquidityAnalysis: any;
  tradingPatterns: any;
  metadata: any;
  marketMetrics: any;
  redFlags: any;
  analyzedAt: number;
}

/**
 * Custom hook for token security analysis
 *
 * Performs comprehensive security scanning of Solana tokens:
 * - Authority analysis (mint, freeze capabilities)
 * - Holder concentration and distribution
 * - Liquidity depth and lock status
 * - Trading pattern anomalies
 * - Red flag detection
 * - Risk scoring (0-100)
 *
 * @returns {Object} Security analysis state and methods
 * @returns {string} tokenAddress - Token address to scan
 * @returns {Function} setTokenAddress - Update token address
 * @returns {boolean} loading - Scan in progress
 * @returns {number} progress - Scan progress (0-100)
 * @returns {string} progressMessage - Current scan step
 * @returns {TokenSecurityReport | null} report - Security report
 * @returns {Function} analyzeToken - Trigger security scan
 *
 * @example
 * const {
 *   tokenAddress,
 *   setTokenAddress,
 *   analyzeToken,
 *   report,
 *   loading
 * } = useTokenSecurity();
 *
 * setTokenAddress('TokenAddress...');
 * await analyzeToken();
 * console.log(report.securityScore); // 0-100
 */
export function useTokenSecurity() {
  const [tokenAddress, setTokenAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<TokenSecurityReport | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  const analyzeToken = async () => {
    if (!tokenAddress.trim()) {
      toast.error('Please enter a token address');
      return;
    }

    setLoading(true);
    setProgress(0);
    setReport(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + 5;
      });
    }, 200);

    const messages = [
      'Validating token address...',
      'Fetching token metadata...',
      'Analyzing token authorities...',
      'Analyzing holder distribution...',
      'Analyzing liquidity...',
      'Detecting trading patterns...',
      'Analyzing market metrics...',
      'Calculating security score...',
    ];

    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      setProgressMessage(messages[messageIndex % messages.length]!);
      messageIndex++;
    }, 1000);

    try {
      const response = await fetch('/api/analyze-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tokenAddress: tokenAddress.trim() }),
      });

      clearInterval(progressInterval);
      clearInterval(messageInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Analysis failed');
      }

      const data = await response.json();
      setProgress(100);
      setProgressMessage('Analysis complete!');
      setReport(data.report);

      if (data.cached) {
        toast.success('Analysis loaded from cache');
      } else {
        toast.success('Token analyzed successfully!');
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      toast.error(error.message || 'Failed to analyze token');
      setProgress(0);
      setProgressMessage('');
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setTokenAddress(text.trim());
      toast.success('Address pasted!');
    } catch (error) {
      toast.error('Failed to paste from clipboard');
    }
  };

  return {
    tokenAddress,
    setTokenAddress,
    loading,
    report,
    progress,
    progressMessage,
    analyzeToken,
    handlePaste,
  };
}
