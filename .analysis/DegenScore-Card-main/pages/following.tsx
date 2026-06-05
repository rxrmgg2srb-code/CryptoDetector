import dynamic from 'next/dynamic';
import Head from 'next/head';

const FollowingContent = dynamic(
  () => import('../components/FollowingContent').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    ),
  }
);
export default function Following() {
  return (
    <>
      <Head>
        <title>👥 Following - DegenScore Card</title>
      </Head>
      <FollowingContent />
    </>
  );
}
