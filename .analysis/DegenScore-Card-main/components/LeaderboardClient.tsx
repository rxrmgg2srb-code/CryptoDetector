import dynamic from 'next/dynamic';

// Dynamic imports - NO ejecutar en servidor, solo en cliente
const RankingsWidget = dynamic(() => import('./RankingsWidget'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-800/50 rounded-2xl h-96"></div>,
});

const ChallengeWinnersWidget = dynamic(() => import('./ChallengeWinnersWidget'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-800/50 rounded-2xl h-96"></div>,
});

export function LeaderboardClient() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RankingsWidget />
        <ChallengeWinnersWidget />
      </div>
    </div>
  );
}

export default LeaderboardClient;
