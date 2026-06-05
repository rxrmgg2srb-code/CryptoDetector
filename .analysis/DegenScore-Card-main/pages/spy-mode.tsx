import dynamic from 'next/dynamic';
import Head from 'next/head';

const SpyModeContent = dynamic(
  () => import('../components/SpyModeContent').then((mod) => mod.SpyModeContent),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-500"></div>
      </div>
    ),
  }
);

export default function SpyModePage() {
  return (
    <>
      <Head>
        <title>🕵️ Spy Mode - DegenScore</title>
      </Head>
      <SpyModeContent />
    </>
  );
}
