import dynamic from 'next/dynamic';
import Head from 'next/head';
import Header from '../components/Header';

// Load documentation component client-side only
const DocumentationContent = dynamic(() => import('../components/DocumentationContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mb-4"></div>
        <p className="text-white text-xl">Loading Documentation...</p>
      </div>
    </div>
  ),
});

export default function Documentation() {
  return (
    <>
      <Head>
        <title>📚 Documentation - DegenScore Card</title>
        <meta name="description" content="Complete guide to using DegenScore Card" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black">
        <Header />
        <DocumentationContent />
      </div>
    </>
  );
}
