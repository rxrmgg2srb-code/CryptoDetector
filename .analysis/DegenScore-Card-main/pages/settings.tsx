import dynamic from 'next/dynamic';
import Head from 'next/head';

const SettingsContent = dynamic(
  () => import('../components/SettingsContent').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-500"></div>
      </div>
    ),
  }
);

export default function Settings() {
  return (
    <>
      <Head>
        <title>⚙️ Settings - DegenScore Card</title>
      </Head>
      <SettingsContent />
    </>
  );
}
