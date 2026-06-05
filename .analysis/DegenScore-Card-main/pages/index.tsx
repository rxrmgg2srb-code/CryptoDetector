import dynamic from 'next/dynamic';
import DegenCard from '../components/DegenCard';
import Header from '../components/Header';

// Dynamic imports with SSR disabled to prevent hydration errors
const PrizePoolTicker = dynamic(() => import('../components/PrizePoolTicker'), { ssr: false });
const LiveSalesFeed = dynamic(() => import('../components/LiveSalesFeed'), { ssr: false });

/**
 * ULTRA MINIMAL VERSION - Only essentials
 * Uses consistent Header with all navigation buttons
 * 🔥 Now with FOMO mechanics (Prize Pool + Live Sales)
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 relative overflow-hidden">
      {/* Consistent Header with Navigation */}
      <Header />

      {/* 🏆 Prize Pool Ticker - Creates urgency */}
      <div className="container mx-auto px-4 pt-8">
        <PrizePoolTicker />
      </div>

      {/* Card Generator */}
      <div className="container mx-auto px-4 py-8">
        <DegenCard />
      </div>

      <div className="mt-8 text-center text-gray-400 text-sm pb-8">
        <p>Powered by Helius RPC × Solana</p>
        <p className="mt-2">✅ Stable version - All fixes applied</p>
      </div>

      {/* 🔥 Live Sales Feed - Social proof */}
      <LiveSalesFeed />
    </div>
  );
}

// Force SSR to prevent build timeout
export async function getServerSideProps() {
  return {
    props: {},
  };
}
