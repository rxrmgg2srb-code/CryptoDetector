import dynamic from 'next/dynamic';
import Head from 'next/head';

// Cargar el componente FIFA Leaderboard solo en el cliente
// Esto evita problemas de timeout durante el build estático (SSG)
const FIFALeaderboardContent = dynamic(() => import('../components/FIFALeaderboardContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-400 mb-4"></div>
        <p className="text-white text-xl font-bold">Loading FIFA Leaderboard...</p>
      </div>
    </div>
  ),
});

export default function FIFALeaderboardPage() {
  return (
    <>
      <Head>
        <title>Top Traders Leaderboard - DegenScore</title>
        <meta name="description" content="Discover the top Solana traders with FIFA-style cards" />
      </Head>
      <FIFALeaderboardContent />
    </>
  );
}
