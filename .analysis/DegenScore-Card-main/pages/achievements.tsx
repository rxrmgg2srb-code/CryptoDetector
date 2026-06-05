import dynamic from 'next/dynamic';
import Head from 'next/head';

const AchievementsDoc = dynamic(() => import('../components/AchievementsDoc'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mb-4"></div>
        <p className="text-white text-xl">Loading Achievements...</p>
      </div>
    </div>
  ),
});

export default function AchievementsPage() {
  return (
    <>
      <Head>
        <title>🏆 Achievements - DegenScore Card</title>
        <meta
          name="description"
          content="Complete guide to DegenScore achievement points and badges"
        />
        <meta property="og:title" content="Achievement Points System - DegenScore" />
        <meta
          property="og:description"
          content="Learn about all 60+ badges and how to earn achievement points"
        />
      </Head>

      <AchievementsDoc />
    </>
  );
}
