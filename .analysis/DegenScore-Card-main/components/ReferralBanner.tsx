import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';

interface ReferralBannerProps {
    walletAddress: string;
}

export default function ReferralBanner({ walletAddress }: ReferralBannerProps) {
    const [referralCode, setReferralCode] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [referralCount, setReferralCount] = useState(0);

    // Fetch or generate referral code on mount
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch(`/api/referrals/stats?wallet=${walletAddress}`);
                if (response.ok) {
                    const data = await response.json();
                    // If we have a stored code use it, otherwise generate one locally for display (it will be created on first track)
                    // For simplicty, we display what the backend returns or fallback
                    setReferralCode(data.stats?.referralCode || `DEGEN-${walletAddress.slice(0, 6).toUpperCase()}`);
                    setReferralCount(data.stats?.totalReferrals || 0);
                }
            } catch (error) {
                logger.error('Error fetching referral stats', error instanceof Error ? error : undefined);
                // Fallback code if API fails
                setReferralCode(`DEGEN-${walletAddress.slice(0, 6).toUpperCase()}`);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [walletAddress]);

    const getReferralLink = () => {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        return `${origin}?ref=${referralCode}`;
    };

    const copyCode = () => {
        navigator.clipboard.writeText(getReferralLink());
        setCopied(true);
        toast.success('LINK COPIED! 📋', {
            style: {
                background: '#10B981',
                color: 'white',
                fontWeight: 'bold',
            },
            icon: '📋'
        });
        setTimeout(() => setCopied(false), 2000);
    };

    const shareTwitter = () => {
        const link = getReferralLink();
        const text = `I just got my DegenScore Card! 🎴\n\nAre you a Degen or a Normie? Find out now and get your card.\n\n👇 Check it out here:`;
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`;
        window.open(url, '_blank');
    };

    const shareWhatsApp = () => {
        const link = getReferralLink();
        const text = `Check out my DegenScore Card! 🎴 Are you a Degen or a Normie? Find out here: ${link}`;
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const shareTelegram = () => {
        const link = getReferralLink();
        const text = `Check out my DegenScore Card! 🎴 Are you a Degen or a Normie?`;
        const url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    if (loading) return (
        <div className="w-full h-48 bg-gray-800/50 rounded-2xl animate-pulse flex items-center justify-center">
            <div className="text-gray-500">Loading referral code...</div>
        </div>
    );

    return (
        <div className="relative mt-8 group">
            {/* Background Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>

            <div className="relative bg-gray-900 border-2 border-purple-500/30 rounded-2xl p-6 sm:p-8 overflow-hidden">
                {/* Header */}
                <div className="text-center mb-6">
                    <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-white mb-2 animate-text-shimmer">
                        🎁 INVITE & EARN
                    </h2>
                    <p className="text-gray-400 text-lg">
                        Get rewards when your friends pay
                    </p>
                </div>

                {/* Code Display logic - BIG and CLEAR */}
                <div className="bg-gray-800/80 rounded-xl p-4 sm:p-6 mb-6 border border-purple-500/20 backdrop-blur-sm">
                    <div className="text-gray-500 text-sm font-bold uppercase tracking-wider text-center mb-2">Your Unique Link</div>
                    <div
                        onClick={copyCode}
                        className="flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer hover:bg-gray-700/50 rounded-lg p-2 transition-colors"
                        title="Click to copy"
                    >
                        <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-wide text-center w-full sm:text-left select-all">
                            {referralCode}
                        </div>
                        <button
                            className={`
                        px-6 py-2 rounded-lg font-bold text-sm uppercase tracking-wide transition-all min-w-[140px]
                        ${copied
                                    ? 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)] scale-105'
                                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)]'
                                }
                    `}
                        >
                            {copied ? '✅ COPIED!' : '📋 COPY LINK'}
                        </button>
                    </div>
                </div>

                {/* Share Buttons - ONE TAP */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <button
                        onClick={shareTwitter}
                        className="flex flex-col items-center justify-center p-3 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 border border-[#1DA1F2]/30 hover:border-[#1DA1F2] rounded-xl transition-all group/btn"
                    >
                        <span className="text-2xl mb-1 transform group-hover/btn:scale-110 transition-transform">🐦</span>
                        <span className="text-xs font-bold text-[#1DA1F2]">Twitter</span>
                    </button>

                    <button
                        onClick={shareWhatsApp}
                        className="flex flex-col items-center justify-center p-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 hover:border-[#25D366] rounded-xl transition-all group/btn"
                    >
                        <span className="text-2xl mb-1 transform group-hover/btn:scale-110 transition-transform">💬</span>
                        <span className="text-xs font-bold text-[#25D366]">WhatsApp</span>
                    </button>

                    <button
                        onClick={shareTelegram}
                        className="flex flex-col items-center justify-center p-3 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border border-[#0088cc]/30 hover:border-[#0088cc] rounded-xl transition-all group/btn"
                    >
                        <span className="text-2xl mb-1 transform group-hover/btn:scale-110 transition-transform">✈️</span>
                        <span className="text-xs font-bold text-[#0088cc]">Telegram</span>
                    </button>
                </div>

                {/* Progress Bar (Gamification) */}
                <div className="bg-gray-800/50 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-400">Next Reward: <span className="text-purple-400 font-bold">Free Month</span></span>
                        <span className="text-sm font-bold text-white">{referralCount}/5 Referrals</span>
                    </div>
                    <div className="w-full bg-gray-700 h-3 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000 ease-out"
                            style={{ width: `${Math.min((referralCount / 5) * 100, 100)}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                        Refer 5 friends to unlock your first reward! 🚀
                    </p>
                </div>

            </div>
        </div>
    );
}
