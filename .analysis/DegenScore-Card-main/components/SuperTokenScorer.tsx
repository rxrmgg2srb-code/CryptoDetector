/**
 * 🚀 SUPER TOKEN SCORER COMPONENT
 *
 * El componente de análisis de tokens MÁS COMPLETO de Web3
 * Muestra TODAS las métricas posibles con una UI impresionante
 */
import React from 'react';
import { useTokenAnalysis } from '@/hooks/useTokenAnalysis';
import Header from './SuperTokenScorer/Header';
import InputSection from './SuperTokenScorer/InputSection';
import MainScoreDisplay from './SuperTokenScorer/MainScoreDisplay';
import ScoreBreakdown from './SuperTokenScorer/ScoreBreakdown';
import FlagSection from './SuperTokenScorer/FlagSection';
import DetailedMetrics from './SuperTokenScorer/DetailedMetrics';
import ExternalData from './SuperTokenScorer/ExternalData';

export default function SuperTokenScorerContent() {
  const {
    tokenAddress,
    setTokenAddress,
    loading,
    progress,
    progressMessage,
    result,
    error,
    analyzeToken,
  } = useTokenAnalysis();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Header />

        <InputSection
          tokenAddress={tokenAddress}
          setTokenAddress={setTokenAddress}
          loading={loading}
          analyzeToken={analyzeToken}
          error={error}
          progress={progress}
          progressMessage={progressMessage}
        />

        {result && (
          <div className="space-y-6">
            <MainScoreDisplay result={result} />
            <ScoreBreakdown result={result} />
            <FlagSection result={result} />
            <DetailedMetrics result={result} />
            <ExternalData result={result} />
          </div>
        )}
      </div>
    </div>
  );
}
