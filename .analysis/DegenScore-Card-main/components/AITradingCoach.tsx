import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { generateSessionToken } from '../lib/walletAuth';
import toast from 'react-hot-toast';
import { logger } from '../lib/logger';

interface CoachAnalysis {
  overallScore: number;
  riskProfile: string;
  emotionalTrading: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  patterns: string[];
  predictedROI: number | null;
  confidenceScore: number | null;
}

export default function AITradingCoach() {
  const { publicKey } = useWallet();
  const [analysis, setAnalysis] = useState<CoachAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [canRequestNew, setCanRequestNew] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    if (publicKey) {
      generateToken();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey]);

  useEffect(() => {
    if (sessionToken) {
      fetchAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionToken]);

  const generateToken = async () => {
    if (!publicKey) {
      return;
    }

    try {
      const token = generateSessionToken(publicKey.toString());
      setSessionToken(token);
    } catch (error: any) {
      logger.error('Failed to generate session token:', error);
    }
  };

  const fetchAnalysis = async () => {
    if (!sessionToken) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/ai/coach', {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      if (response.status === 404) {
        // No analysis yet
        setAnalysis(null);
        setCanRequestNew(true);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch analysis');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
      setCanRequestNew(data.canRequestNew);
    } catch (error: any) {
      logger.error('Error fetching AI analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestAnalysis = async () => {
    if (!sessionToken) {
      toast.error('Please connect your wallet');
      return;
    }

    setAnalyzing(true);
    toast.loading('AI analyzing your trading behavior... (this may take 20-30 seconds)');

    try {
      const response = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
      setCanRequestNew(false);
      toast.dismiss();
      toast.success('🧠 AI analysis complete!');
    } catch (error: any) {
      logger.error('Error requesting AI analysis:', error);
      toast.dismiss();
      toast.error(error.message || 'Failed to analyze');
    } finally {
      setAnalyzing(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-lg p-8 border border-purple-500/30">
        <div className="text-center">
          <div className="text-6xl mb-4">🧠</div>
          <h3 className="text-2xl font-bold text-white mb-2">AI Trading Coach</h3>
          <p className="text-gray-400">Connect your wallet to get personalized AI insights</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-lg p-8 border border-purple-500/30 animate-pulse">
        <div className="h-96 bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-lg p-8 border border-purple-500/30">
        <div className="text-center">
          <div className="text-6xl mb-4">🧠</div>
          <h3 className="text-2xl font-bold text-white mb-2">AI Trading Coach</h3>
          <p className="text-gray-400 mb-6">Get personalized insights powered by GPT-4</p>
          <button
            onClick={requestAnalysis}
            disabled={analyzing}
            className={`px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition ${
              analyzing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {analyzing ? '🔄 Analyzing...' : '🚀 Get AI Analysis'}
          </button>
          <p className="text-xs text-gray-500 mt-3">
            Free: 1 analysis/week • Premium: 1 analysis/day
          </p>
        </div>
      </div>
    );
  }

  const getRiskColor = (profile: string) => {
    switch (profile) {
      case 'conservative':
        return 'text-green-400';
      case 'moderate':
        return 'text-blue-400';
      case 'aggressive':
        return 'text-orange-400';
      case 'degen':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-lg p-6 border border-purple-500/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>🧠</span>
            <span>AI Trading Coach</span>
          </h3>
          <p className="text-sm text-gray-400 mt-1">Powered by GPT-4</p>
        </div>
        {canRequestNew && (
          <button
            onClick={requestAnalysis}
            disabled={analyzing}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
          >
            {analyzing ? '🔄' : '🔄 New Analysis'}
          </button>
        )}
      </div>

      {/* Overall Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900/50 rounded-lg p-4 border border-purple-500/20">
          <div className="text-sm text-gray-400 mb-1">Discipline Score</div>
          <div className="text-3xl font-bold text-purple-400">{analysis.overallScore}/100</div>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-4 border border-purple-500/20">
          <div className="text-sm text-gray-400 mb-1">Risk Profile</div>
          <div className={`text-2xl font-bold capitalize ${getRiskColor(analysis.riskProfile)}`}>
            {analysis.riskProfile}
          </div>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-4 border border-purple-500/20">
          <div className="text-sm text-gray-400 mb-1">Emotional Trading</div>
          <div className="text-3xl font-bold text-orange-400">{analysis.emotionalTrading}/100</div>
        </div>
      </div>

      {/* Strengths */}
      <div className="mb-6">
        <h4 className="text-lg font-bold text-green-400 mb-3 flex items-center gap-2">
          <span>✅</span>
          <span>Strengths</span>
        </h4>
        <div className="space-y-2">
          {analysis.strengths.map((strength, idx) => (
            <div key={idx} className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
              <p className="text-green-200">{strength}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Weaknesses */}
      <div className="mb-6">
        <h4 className="text-lg font-bold text-red-400 mb-3 flex items-center gap-2">
          <span>⚠️</span>
          <span>Weaknesses</span>
        </h4>
        <div className="space-y-2">
          {analysis.weaknesses.map((weakness, idx) => (
            <div key={idx} className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-200">{weakness}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="mb-6">
        <h4 className="text-lg font-bold text-yellow-400 mb-3 flex items-center gap-2">
          <span>💡</span>
          <span>Recommendations</span>
        </h4>
        <div className="space-y-2">
          {analysis.recommendations.map((rec, idx) => (
            <div key={idx} className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
              <p className="text-yellow-100">{rec}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Patterns Detected */}
      {analysis.patterns.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
            <span>🔍</span>
            <span>Patterns Detected</span>
          </h4>
          <div className="space-y-2">
            {analysis.patterns.map((pattern, idx) => (
              <div key={idx} className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                <p className="text-blue-200">{pattern}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prediction */}
      {analysis.predictedROI !== null && (
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">30-Day ROI Prediction</div>
              <div
                className={`text-2xl font-bold ${
                  analysis.predictedROI >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {analysis.predictedROI > 0 ? '+' : ''}
                {analysis.predictedROI.toFixed(1)}%
              </div>
            </div>
            {analysis.confidenceScore !== null && (
              <div className="text-right">
                <div className="text-sm text-gray-400">Confidence</div>
                <div className="text-xl font-bold text-purple-400">
                  {(analysis.confidenceScore * 100).toFixed(0)}%
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-700 text-center text-xs text-gray-500">
        AI analysis is for educational purposes only. Not financial advice.
      </div>
    </div>
  );
}
