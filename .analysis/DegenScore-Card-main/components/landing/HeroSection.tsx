export function HeroSection() {
  return (
    <div className="text-center mb-12 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-6 animate-float drop-shadow-[0_0_40px_rgba(34,211,238,0.6)]">
          Prove Your Degen Status
        </h1>

        <p className="text-gray-300 text-2xl md:text-3xl font-semibold mb-4">
          Generate your Solana trader card with{' '}
          <span className="text-cyan-400 font-black">real on-chain metrics</span>
        </p>

        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-8">
          Analyze wallet performance, compete on leaderboards, and showcase your trading mastery
          with verifiable blockchain data
        </p>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-6 items-center mt-8">
          <TrustBadge icon="🔒" text="On-Chain Verified" />
          <TrustBadge icon="⚡" text="Real-Time Data" />
          <TrustBadge icon="🏆" text="10,000+ Cards Generated" />
          <TrustBadge icon="🚀" text="Live on Solana" />
        </div>
      </div>
    </div>
  );
}

function TrustBadge({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="bg-gray-800/60 backdrop-blur-md border border-purple-500/30 rounded-xl px-4 py-2 shadow-lg hover:scale-105 transition-transform">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-gray-200 font-semibold">{text}</span>
      </div>
    </div>
  );
}
