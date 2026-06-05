import dynamic from 'next/dynamic';
import Head from 'next/head';

const SuperTokenScorerContent = dynamic(
  () => import('../components/SuperTokenScorerContent').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-yellow-500"></div>
      </div>
    ),
  }
);
export default function SuperTokenScorer() {
  return (
    <>
      <Head>
        <title>⭐ Super Token Scorer - DegenScore Card</title>
      </Head>
      <SuperTokenScorerContent />
    </>
  );
}
