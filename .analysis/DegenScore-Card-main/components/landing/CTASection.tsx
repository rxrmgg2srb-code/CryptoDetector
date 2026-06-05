import Link from 'next/link';

export function CTASection() {
  return (
    <div className="bg-gradient-to-r from-purple-900/40 via-pink-900/40 to-purple-900/40 backdrop-blur-xl rounded-3xl p-12 border-2 border-purple-500/50 shadow-[0_0_60px_rgba(168,85,247,0.4)] mb-16 text-center">
      <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
        Ready to Show Off Your Skills?
      </h2>

      <p className="text-gray-300 text-xl md:text-2xl max-w-3xl mx-auto mb-8">
        Join <span className="text-cyan-400 font-black">10,000+ traders</span> who&apos;ve generated
        their DegenScore cards
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="px-8 py-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 hover:from-cyan-600 hover:via-blue-600 hover:to-purple-600 text-white font-black text-xl rounded-2xl transition-all shadow-[0_0_40px_rgba(139,92,246,0.6)] hover:shadow-[0_0_60px_rgba(139,92,246,0.8)] hover:scale-105 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
          <span className="relative z-10 flex items-center gap-3">
            <span className="text-2xl">🎴</span>
            Generate My Card Now
          </span>
        </button>

        <Link
          href="/leaderboard"
          className="px-8 py-4 bg-gray-800/80 hover:bg-gray-700/80 border-2 border-purple-400 text-white font-bold text-xl rounded-2xl transition-all hover:scale-105"
        >
          🏆 View Leaderboard
        </Link>
      </div>

      <div className="mt-8 text-gray-400 text-sm">
        <p>✅ Free to use • ⚡ Instant results • 🔒 100% on-chain verified</p>
      </div>
    </div>
  );
}
