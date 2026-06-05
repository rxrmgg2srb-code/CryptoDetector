import '../styles/globals.css';
import '@solana/wallet-adapter-react-ui/styles.css';
import type { AppProps } from 'next/app';
import { useMemo, useCallback } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { I18nextProvider } from 'react-i18next';
import i18n from '../lib/i18n';
import type { NextComponentType, NextPageContext } from 'next';

import Analytics from '../components/Analytics';
import WalletTracker from '../components/WalletTracker';
import MetaHead from '../components/MetaHead';
import LiveActivityBanner from '../components/LiveActivityBanner';
import OnboardingModal, { useOnboarding } from '../components/OnboardingModal';

interface AppContentProps {
  Component: NextComponentType<NextPageContext, unknown, unknown>;
  pageProps: Record<string, unknown>;
}

function AppContent({ Component, pageProps }: AppContentProps) {
  const { showOnboarding, completeOnboarding } = useOnboarding();

  return (
    <>
      <Component {...pageProps} />
      <LiveActivityBanner />
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={completeOnboarding}
      />
    </>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  const endpoint = useMemo(
    () => process.env.NEXT_PUBLIC_HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com',
    []
  );

  const wallets = useMemo(() => [], []);

  const onError = useCallback((error: Error) => {
    const ignorableErrors = [
      'disconnected port',
      'WalletConnectionError',
      'Unexpected error',
      'User rejected',
      'wallet is not available',
      'WalletNotReadyError',
      'WalletNotSelectedError',
      'WalletTimeoutError',
      'failed to connect',
    ];

    const shouldIgnore = ignorableErrors.some(
      (msg) =>
        error?.message?.toLowerCase()?.includes(msg.toLowerCase()) ||
        error?.toString()?.toLowerCase()?.includes(msg.toLowerCase()) ||
        error?.name?.includes(msg)
    );

    if (shouldIgnore) {
      console.warn('Wallet connection issue (safe to ignore):', error?.message || error);
      return;
    }

    console.error('Critical wallet error:', error);
  }, []);

  return (
    <ErrorBoundary>
      <MetaHead />
      <Analytics />
      <I18nextProvider i18n={i18n}>
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider
            wallets={wallets}
            autoConnect={false}
            onError={onError}
          >
            <WalletModalProvider>
              <WalletTracker />
              <AppContent Component={Component} pageProps={pageProps} />
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </I18nextProvider>
    </ErrorBoundary>
  );
}
