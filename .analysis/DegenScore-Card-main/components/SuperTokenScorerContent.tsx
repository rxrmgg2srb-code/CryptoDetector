/**
 * 🚀 SUPER TOKEN SCORER PAGE
 *
 * Página principal del sistema de análisis de tokens más completo de Web3
 */

import React from 'react';
import Head from 'next/head';
import { Header } from '@/components/Header';
import SuperTokenScorer from '@/components/SuperTokenScorer';

// Component only
export function SuperTokenScorerPage() {
  return (
    <>
      <Head>
        <title>Super Token Scorer - El Analysis Más Completo de Web3</title>
        <meta
          name="description"
          content="Analiza tokens de Solana con más de 50 métricas diferentes. Integra RugCheck, DexScreener, Birdeye, Jupiter y mucho más. El sistema de scoring más completo del ecosistema."
        />
        <meta property="og:title" content="Super Token Scorer - DegenScore" />
        <meta
          property="og:description"
          content="El sistema de análisis de tokens más completo de Web3. 15+ APIs, 50+ métricas, análisis en tiempo real."
        />
        <meta property="og:type" content="website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen">
        <Header />
        <SuperTokenScorer />
      </div>
    </>
  );
}

export default SuperTokenScorerPage;

// Force SSR to prevent build timeout
export async function getServerSideProps() {
  return {
    props: {},
  };
}
