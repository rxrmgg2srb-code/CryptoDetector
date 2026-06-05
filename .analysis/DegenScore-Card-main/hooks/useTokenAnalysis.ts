import { useState, useCallback } from 'react';
import { SuperTokenScore } from '@/lib/services/superTokenScorer';

/**
 * Custom hook for analyzing Solana tokens
 *
 * Provides token scoring and analysis capabilities including:
 * - Liquidity analysis
 * - Holder distribution
 * - Trading patterns
 * - Risk assessment
 * - Market metrics
 *
 * @returns {Object} Token analysis state and methods
 * @returns {string} tokenAddress - Token address to analyze
 * @returns {Function} setTokenAddress - Update token address
 * @returns {boolean} loading - Analysis in progress
 * @returns {number} progress - Analysis progress (0-100)
 * @returns {string} progressMessage - Current analysis step
 * @returns {SuperTokenScore | null} result - Analysis results
 * @returns {string} error - Error message if any
 * @returns {Function} analyzeToken - Trigger token analysis
 *
 * @example
 * const {
 *   tokenAddress,
 *   setTokenAddress,
 *   analyzeToken,
 *   result,
 *   loading
 * } = useTokenAnalysis();
 *
 * setTokenAddress('SolTokenAddress...');
 * await analyzeToken();
 */
export function useTokenAnalysis() {
  const [tokenAddress, setTokenAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<SuperTokenScore | null>(null);
  const [error, setError] = useState('');

  const analyzeToken = useCallback(async () => {
    if (!tokenAddress.trim()) {
      setError('Por favor ingresa una dirección de token');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setProgress(0);
    setProgressMessage('Iniciando análisis...');

    // Simular progreso
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + 5;
      });
    }, 500);

    try {
      const response = await fetch('/api/super-token-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenAddress: tokenAddress.trim(),
          forceRefresh: false,
        }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al analizar el token');
      }

      const data = await response.json();
      setResult(data.data);
      setProgress(100);
      setProgressMessage('¡Análisis completado!');
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.message || 'Error al analizar el token');
    } finally {
      setLoading(false);
    }
  }, [tokenAddress]);

  return {
    tokenAddress,
    setTokenAddress,
    loading,
    progress,
    progressMessage,
    result,
    error,
    analyzeToken,
  };
}
