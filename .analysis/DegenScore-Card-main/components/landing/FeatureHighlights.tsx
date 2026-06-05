export function FeatureHighlights() {
  return (
    <div className="mb-16">
      <h2 className="text-4xl md:text-5xl font-black text-center text-white mb-12">
        Why <span className="gradient-text-gold">DegenScore</span>?
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FeatureCard
          icon="📊"
          title="Real-Time Analytics"
          description="Track your win rate, P&L, and trading patterns with live blockchain data"
          gradient="from-cyan-500/20 to-blue-500/20"
          borderColor="border-cyan-400/50"
        />

        <FeatureCard
          icon="🏆"
          title="Competitive Leaderboards"
          description="Climb the ranks and compete with top Solana traders globally"
          gradient="from-purple-500/20 to-pink-500/20"
          borderColor="border-purple-400/50"
        />

        <FeatureCard
          icon="🎖️"
          title="Achievement Badges"
          description="Unlock NFT badges for milestones like Diamond Hands, Moonshot Master, and more"
          gradient="from-green-500/20 to-emerald-500/20"
          borderColor="border-green-400/50"
        />

        <FeatureCard
          icon="📈"
          title="Performance Insights"
          description="Understand your trading behavior with advanced metrics and visualizations"
          gradient="from-orange-500/20 to-red-500/20"
          borderColor="border-orange-400/50"
        />

        <FeatureCard
          icon="🎴"
          title="Shareable Cards"
          description="Generate beautiful trading cards to showcase your stats on social media"
          gradient="from-indigo-500/20 to-violet-500/20"
          borderColor="border-indigo-400/50"
        />

        <FeatureCard
          icon="🔗"
          title="Referral Rewards"
          description="Earn SOL and premium access by inviting friends to the platform"
          gradient="from-yellow-500/20 to-amber-500/20"
          borderColor="border-yellow-400/50"
        />
      </div>
    </div>
  );
}

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  gradient: string;
  borderColor: string;
}

function FeatureCard({ icon, title, description, gradient, borderColor }: FeatureCardProps) {
  return (
    <div
      className={`bg-gradient-to-br ${gradient} backdrop-blur-lg rounded-2xl p-6 border-2 ${borderColor} shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 group`}
    >
      <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-2xl font-black text-white mb-3">{title}</h3>
      <p className="text-gray-300 text-base leading-relaxed">{description}</p>
    </div>
  );
}
