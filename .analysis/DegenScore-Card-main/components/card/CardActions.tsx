interface CardActionsProps {
  onDownload: () => void;
  onViewLeaderboard: () => void;
}

export function CardActions({ onDownload, onViewLeaderboard }: CardActionsProps) {
  return (
    <div className="text-center space-y-6">
      <div className="bg-gradient-to-r from-green-500/30 to-emerald-500/30 border-4 border-green-400 rounded-2xl p-8 shadow-[0_0_40px_rgba(34,197,94,0.4)]">
        <div className="text-7xl mb-4 animate-float">✅</div>
        <p className="text-green-300 font-black text-2xl mb-3">Premium Card Ready!</p>
        <p className="text-gray-200 text-base font-medium">
          Your premium card has been generated with all your customizations
        </p>
      </div>

      <button
        onClick={onDownload}
        className="w-full py-6 px-8 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 text-white font-black rounded-2xl transition-all shadow-[0_0_40px_rgba(34,197,94,0.6)] hover:shadow-[0_0_60px_rgba(34,197,94,0.8)] hover:scale-[1.02] flex items-center justify-center gap-4 text-xl group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
        <span className="text-3xl relative z-10">💎</span>
        <span className="relative z-10">Download Premium Card</span>
      </button>

      <button
        onClick={onViewLeaderboard}
        className="w-full py-5 px-8 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 hover:from-purple-600 hover:via-pink-600 hover:to-purple-700 text-white font-black rounded-2xl transition-all shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:shadow-[0_0_50px_rgba(168,85,247,0.7)] hover:scale-[1.02] flex items-center justify-center gap-3 text-lg group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
        <span className="text-2xl relative z-10">🏆</span>
        <span className="relative z-10">View Leaderboard</span>
      </button>
    </div>
  );
}
