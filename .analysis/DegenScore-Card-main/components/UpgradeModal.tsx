import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PAYMENT_CONFIG } from '../lib/config';
import CountUp from 'react-countup';
import { logger } from '@/lib/logger';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  onSkip: () => void;
  onPromoCodeApplied?: (code: string) => void;
}

export default function UpgradeModal({
  isOpen,
  onClose,
  onUpgrade,
  onSkip,
  onPromoCodeApplied,
}: UpgradeModalProps) {
  const { publicKey } = useWallet();
  const [upgradesCount, setUpgradesCount] = useState(0);

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Simulated real-time upgrades count (in production, fetch from API)
    const baseCount = 47 + Math.floor(Math.random() * 20);
    setUpgradesCount(baseCount);

    const interval = setInterval(() => {
      setUpgradesCount((prev) => prev + (Math.random() > 0.7 ? 1 : 0));
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  if (!isOpen) {
    return null;
  }

  const handlePromoCode = async () => {
    if (!publicKey) {
      setPromoError('Please connect your wallet first');
      return;
    }

    if (!promoCode.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }

    setIsApplyingPromo(true);
    setPromoError(null);
    setPromoSuccess(null);

    try {
      const response = await fetch('/api/apply-promo-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          promoCode: promoCode.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to apply promo code');
      }

      logger.info('✅ Promo code applied successfully!');
      setPromoSuccess(data.message);

      // Notify parent component about promo code
      // Parent will handle showing ShareModal and then ProfileFormModal
      if (onPromoCodeApplied) {
        setTimeout(() => {
          onPromoCodeApplied(promoCode.trim().toUpperCase());
        }, 1000);
      }
    } catch (error: any) {
      logger.error('Promo code error:', error);
      setPromoError(error.message || 'Invalid promo code');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border-2 border-purple-500/50 shadow-2xl shadow-purple-500/20 max-w-lg w-full max-h-[90vh] overflow-y-auto p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition text-2xl"
        >
          ✕
        </button>

        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎨</div>
          <h2 className="text-3xl font-bold text-white mb-2">Customize & Join Leaderboard</h2>
          <p className="text-gray-400">Unlock premium features and appear on the leaderboard</p>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-6 mb-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl">✅</div>
              <div>
                <div className="text-white font-semibold">Custom Profile Photo</div>
                <div className="text-gray-400 text-sm">Add your photo to the card</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-2xl">✅</div>
              <div>
                <div className="text-white font-semibold">Social Links</div>
                <div className="text-gray-400 text-sm">Display Twitter & Telegram</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-2xl">🏆</div>
              <div>
                <div className="text-white font-semibold">Leaderboard Access</div>
                <div className="text-gray-400 text-sm">Compete with other degens</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-2xl">⬇️</div>
              <div>
                <div className="text-white font-semibold">Premium Download</div>
                <div className="text-gray-400 text-sm">High-res card with all features</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 mb-4 text-center border border-purple-500/30">
          <div className="text-gray-400 text-sm mb-1">One-time payment</div>
          <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            {PAYMENT_CONFIG.MINT_PRICE_SOL} SOL
          </div>
          <div className="text-gray-400 text-xs mt-1">
            ≈ ${(PAYMENT_CONFIG.MINT_PRICE_SOL * 200).toFixed(2)} USD
          </div>
        </div>

        {/* FOMO Triggers */}
        <div className="mb-4 space-y-3">
          {/* Social Proof - Recent Upgrades */}
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-green-400 text-sm font-semibold">
                  <CountUp end={upgradesCount} duration={1} /> users upgraded today
                </span>
              </div>
              <span className="text-green-400 text-xs">🔥 TRENDING</span>
            </div>
          </div>

          {/* Scarcity Indicator */}
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-orange-400 text-sm font-semibold">Limited Founder Slots</span>
              <span className="text-orange-400 text-xs font-bold">87% CLAIMED</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full transition-all duration-1000"
                style={{ width: '87%' }}
              ></div>
            </div>
          </div>

          {/* Value Props */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Instant access • No recurring fees • Lifetime features</span>
          </div>
        </div>

        {/* Promo Code Section */}
        <div className="mb-6 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🎟️</span>
            <h3 className="text-yellow-400 font-bold text-lg">Have a Promo Code?</h3>
          </div>

          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Enter code (e.g. DEGENLAUNCH2024)"
              className="flex-1 px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500"
              disabled={isApplyingPromo || !!promoSuccess}
            />
            <button
              onClick={handlePromoCode}
              disabled={isApplyingPromo || !promoCode.trim() || !!promoSuccess}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-lg transition-all disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isApplyingPromo ? 'Applying...' : 'Apply'}
            </button>
          </div>

          {promoError && (
            <div className="mt-2 p-2 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm">
              {promoError}
            </div>
          )}

          {promoSuccess && (
            <div className="mt-2 p-2 bg-green-500/10 border border-green-500/50 rounded text-green-400 text-sm flex items-center gap-2">
              <span>✅</span>
              <span>{promoSuccess}</span>
            </div>
          )}

          <p className="text-gray-500 text-xs mt-2">Get 100% free upgrade with valid promo code</p>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-gray-900 text-gray-500">or pay with SOL</span>
          </div>
        </div>

        {!publicKey ? (
          <div className="mb-4">
            <p className="text-gray-400 text-sm text-center mb-3">
              Connect your wallet to continue
            </p>
            <div className="flex justify-center">
              <WalletMultiButton className="!bg-gradient-to-r !from-purple-500 !to-pink-500 !rounded-lg !font-bold !py-3 !px-6" />
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              onClose();
              onUpgrade(); // Opens ProfileFormModal where payment happens
            }}
            className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl mb-4"
          >
            🎨 Continue to Customize ({PAYMENT_CONFIG.MINT_PRICE_SOL} SOL)
          </button>
        )}

        <button
          onClick={onSkip}
          className="w-full py-3 px-6 bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold rounded-lg transition"
        >
          ⬇️ Download Basic (Free)
        </button>

        <p className="text-gray-500 text-xs text-center mt-4">
          Premium cards appear on the leaderboard and support development
        </p>
      </div>
    </div>
  );
}
