interface SocialProofProps {
  totalUsers?: number;
  totalCards?: number;
  totalVolume?: number;
}

export function SocialProof({
  totalUsers = 10542,
  totalCards = 8934,
  totalVolume = 125000000,
}: SocialProofProps) {
  return (
    <div className="bg-gradient-to-r from-gray-800/40 via-purple-900/20 to-gray-800/40 backdrop-blur-xl rounded-3xl p-8 border border-purple-500/30 shadow-[0_0_40px_rgba(139,92,246,0.3)] mb-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard
          icon="👥"
          value={formatNumber(totalUsers)}
          label="Active Traders"
          gradient="from-cyan-400 to-blue-500"
        />
        <StatCard
          icon="🎴"
          value={formatNumber(totalCards)}
          label="Cards Generated"
          gradient="from-purple-400 to-pink-500"
        />
        <StatCard
          icon="💰"
          value={`$${formatNumber(totalVolume)}`}
          label="Total Volume Tracked"
          gradient="from-green-400 to-emerald-500"
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: string;
  value: string;
  label: string;
  gradient: string;
}

function StatCard({ icon, value, label, gradient }: StatCardProps) {
  return (
    <div className="text-center group hover:scale-105 transition-transform duration-300">
      <div className="text-5xl mb-3 animate-float group-hover:animate-bounce">{icon}</div>
      <div
        className={`text-4xl md:text-5xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r ${gradient}`}
      >
        {value}
      </div>
      <div className="text-gray-400 text-sm md:text-base font-medium">{label}</div>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}
