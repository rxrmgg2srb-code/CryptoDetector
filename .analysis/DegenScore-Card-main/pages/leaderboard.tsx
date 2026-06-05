import dynamic from 'next/dynamic';
import Head from 'next/head';

// Load the ENTIRE leaderboard component client-side only
// This prevents ANY code from executing during SSG build
const LeaderboardContent = dynamic(() => import('../components/LeaderboardContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-500 mb-4"></div>
        <p className="text-white text-xl">Loading Leaderboard...</p>
      </div>
    </div>
  ),
});

export default function Leaderboard() {
  return (
    <>
      <Head>
        <title>🏆 Leaderboard - DegenScore Card</title>
        <meta
          name="description"
          content="Top Solana traders ranked by DegenScore, likes, referrals, and achievements"
        />
        <meta property="og:title" content="DegenScore Leaderboard" />
        <meta property="og:description" content="See the top-ranked Solana traders" />
      </Head>

      <LeaderboardContent />
    </>
  );
}

// CRITICAL: No getStaticProps, getServerSideProps, or any export
// This forces Next.js to treat it as a pure client-side page
