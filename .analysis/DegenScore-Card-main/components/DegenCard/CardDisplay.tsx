import React from 'react';
import PremiumCard from './PremiumCard';
import ReferralBanner from '../ReferralBanner';

interface Badge {
  name: string;
  icon?: string;
  color?: string;
  description?: string;
}

interface AnalysisData {
  degenScore: number;
  totalVolume: number;
  totalTrades: number;
  profitLoss: number;
  winRate: number;
  whaleActivity?: boolean;
  level?: number;
  badges?: Badge[];
  volatilityScore?: number;
}

interface CardDisplayProps {
  hasPaid: boolean;
  downloadPremiumCard: () => void;
  analysisData?: AnalysisData;
  walletAddress?: string; // Added optional walletAddress
}

export default function CardDisplay({
  hasPaid,
  downloadPremiumCard,
  analysisData,
  walletAddress, // Destructure walletAddress
}: CardDisplayProps) {
  return (
    <div className="mt-10 space-y-8">
      {/* Premium Card Display */}
      {analysisData && (
        <PremiumCard
          degenScore={analysisData.degenScore || 0}
          totalVolume={analysisData.totalVolume || 0}
          totalTrades={analysisData.totalTrades || 0}
          profitLoss={analysisData.profitLoss || 0}
          winRate={analysisData.winRate || 0}
          whaleActivity={analysisData.whaleActivity || false}
          traderLevel={analysisData.level ? `Lvl ${analysisData.level}` : 'Legend'}
          badges={analysisData.badges || []}
          volatilityScore={analysisData.volatilityScore || 0}
        />
      )}

      {/* Card free removida - solo mostramos la premium con bordes dorados */}

      {hasPaid && (
        <div className="text-center space-y-6">
          <div className="bg-gradient-to-r from-green-500/30 to-emerald-500/30 border-4 border-green-400 rounded-2xl p-8 shadow-[0_0_40px_rgba(34,197,94,0.4)]">
            <div className="text-7xl mb-4 animate-float">✅</div>
            <p className="text-green-300 font-black text-2xl mb-3">Premium Card Ready!</p>
            <p className="text-gray-200 text-base font-medium">
              Your premium card has been generated with all your customizations
            </p>
          </div>

          <button
            onClick={downloadPremiumCard}
            className="w-full py-6 px-8 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 text-white font-black rounded-2xl transition-all shadow-[0_0_40px_rgba(34,197,94,0.6)] hover:shadow-[0_0_60px_rgba(34,197,94,0.8)] hover:scale-[1.02] flex items-center justify-center gap-4 text-xl group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
            <span className="text-3xl relative z-10">💎</span>
            <span className="relative z-10">Download Premium Card</span>
          </button>

          <button
            onClick={() => (window.location.href = '/leaderboard')}
            className="w-full py-5 px-8 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 hover:from-purple-600 hover:via-pink-600 hover:to-purple-700 text-white font-black rounded-2xl transition-all shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:shadow-[0_0_50px_rgba(168,85,247,0.7)] hover:scale-[1.02] flex items-center justify-center gap-3 text-lg group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
            <span className="text-2xl relative z-10">🏆</span>
            <span className="relative z-10">View Leaderboard</span>
          </button>

          {/* NEW: Referral Banner for Paid Users */}
          {walletAddress && <ReferralBanner walletAddress={walletAddress} />}
        </div>
      )}
    </div>
  );
}
