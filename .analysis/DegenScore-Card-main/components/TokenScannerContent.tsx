/**
 * 🔒 Token Security Scanner Page
 *
 * Comprehensive token security analysis for Solana tokens
 */

import React from 'react';
import Head from 'next/head';
import { Header } from '@/components/Header';
import TokenSecurityScanner from '@/components/TokenSecurityScanner';

// Component only
export function TokenScannerPage() {
  return (
    <>
      <Head>
        <title>Token Security Scanner | DegenScore</title>
        <meta
          name="description"
          content="Analyze Solana tokens for rug pulls, honeypots, and security risks. Advanced on-chain analysis with bundle detection, liquidity analysis, and holder distribution."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Token Security Scanner | DegenScore" />
        <meta
          property="og:description"
          content="Analyze Solana tokens for security risks with our advanced on-chain scanner"
        />
        <meta property="og:type" content="website" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
        <Header />

        <main className="pt-24 pb-12">
          <TokenSecurityScanner />
        </main>

        {/* Background Effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
        </div>
      </div>
    </>
  );
}

export default TokenScannerPage;

// Force SSR to prevent build timeout
export async function getServerSideProps() {
  return {
    props: {},
  };
}
