import dynamic from 'next/dynamic';
import Head from 'next/head';

const TokenScannerContent = dynamic(() => import('../components/TokenScannerContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-500"></div>
    </div>
  ),
});

export default function TokenScanner() {
  return (
    <>
      <Head>
        <title>🔍 Token Scanner - DegenScore Card</title>
      </Head>
      <TokenScannerContent />
    </>
  );
}
