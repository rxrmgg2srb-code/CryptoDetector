import dynamic from 'next/dynamic';
import Head from 'next/head';
import Header from '@/components/Header';
import { GetServerSideProps } from 'next';

const WhaleRadar = dynamic(() => import('../components/WhaleRadar'), {
    ssr: false,
    loading: () => (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black flex items-center justify-center">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
                <p className="text-white text-xl">Loading Whale Radar...</p>
            </div>
        </div>
    ),
});

export default function WhaleRadarPage() {
    return (
        <>
            <Head>
                <title>🐋 Whale Radar - DegenScore</title>
                <meta
                    name="description"
                    content="Track top Solana whale traders, follow their moves, and get real-time alerts on their trades"
                />
                <meta property="og:title" content="Whale Radar - DegenScore" />
                <meta
                    property="og:description"
                    content="Follow the best traders on Solana. Get alerts when whales make moves."
                />
                <meta property="og:image" content="/og-whale-radar.png" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="🐋 Whale Radar - DegenScore" />
                <meta
                    name="twitter:description"
                    content="Track top Solana whale traders and get real-time alerts"
                />
            </Head>

            <div className="min-h-screen bg-gradient-to-b from-gray-900 via-blue-900/20 to-black">
                <Header />

                <main className="container mx-auto px-4 py-8">
                    {/* Hero Section */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-6xl font-black mb-4 bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                            🐋 Whale Radar
                        </h1>
                        <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-6">
                            Track the best traders on Solana. Follow whales, get alerts, and copy their moves.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 text-sm">
                            <div className="bg-blue-500/20 border border-blue-500/50 rounded-full px-4 py-2 flex items-center gap-2">
                                <span className="text-2xl">📊</span>
                                <span className="text-blue-300">Real-time tracking</span>
                            </div>
                            <div className="bg-green-500/20 border border-green-500/50 rounded-full px-4 py-2 flex items-center gap-2">
                                <span className="text-2xl">🔔</span>
                                <span className="text-green-300">Instant alerts</span>
                            </div>
                            <div className="bg-purple-500/20 border border-purple-500/50 rounded-full px-4 py-2 flex items-center gap-2">
                                <span className="text-2xl">💎</span>
                                <span className="text-purple-300">Verified metrics</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Bar */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-500/30 rounded-xl p-4 text-center">
                            <div className="text-3xl font-black text-blue-400">50+</div>
                            <div className="text-sm text-gray-400">Active Whales</div>
                        </div>
                        <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 border border-green-500/30 rounded-xl p-4 text-center">
                            <div className="text-3xl font-black text-green-400">$2M+</div>
                            <div className="text-sm text-gray-400">Volume Tracked</div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-500/30 rounded-xl p-4 text-center">
                            <div className="text-3xl font-black text-purple-400">68%</div>
                            <div className="text-sm text-gray-400">Avg Win Rate</div>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-900/40 to-yellow-800/20 border border-yellow-500/30 rounded-xl p-4 text-center">
                            <div className="text-3xl font-black text-yellow-400">24/7</div>
                            <div className="text-sm text-gray-400">Monitoring</div>
                        </div>
                    </div>

                    {/* Main Whale Radar Component */}
                    <WhaleRadar />

                    {/* Info Section */}
                    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/10 border border-blue-500/20 rounded-xl p-6">
                            <div className="text-3xl mb-3">🎯</div>
                            <h3 className="text-xl font-bold text-white mb-2">Find Top Traders</h3>
                            <p className="text-gray-400">
                                Discover wallets with the highest win rates and consistent profits based on 500+ verified trades.
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-green-900/30 to-green-800/10 border border-green-500/20 rounded-xl p-6">
                            <div className="text-3xl mb-3">🔔</div>
                            <h3 className="text-xl font-bold text-white mb-2">Real-Time Alerts</h3>
                            <p className="text-gray-400">
                                Get instant notifications when whales you follow make large trades or enter new positions.
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/10 border border-purple-500/20 rounded-xl p-6">
                            <div className="text-3xl mb-3">📈</div>
                            <h3 className="text-xl font-bold text-white mb-2">Copy Strategies</h3>
                            <p className="text-gray-400">
                                Learn from the best by tracking their favorite tokens, hold times, and trading patterns.
                            </p>
                        </div>
                    </div>

                    {/* How It Works */}
                    <div className="mt-12 bg-gradient-to-r from-gray-900/50 to-gray-800/30 border border-gray-700/50 rounded-2xl p-8">
                        <h2 className="text-2xl font-bold text-white mb-6 text-center">How Whale Radar Works</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="text-center">
                                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <span className="text-blue-400 font-bold">1</span>
                                </div>
                                <h4 className="font-bold text-white mb-2">Detection</h4>
                                <p className="text-sm text-gray-400">We analyze 500+ trades per wallet to identify true whales</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <span className="text-green-400 font-bold">2</span>
                                </div>
                                <h4 className="font-bold text-white mb-2">Verification</h4>
                                <p className="text-sm text-gray-400">Minimum 55% win rate, $1000+ volume, 10+ trades required</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <span className="text-purple-400 font-bold">3</span>
                                </div>
                                <h4 className="font-bold text-white mb-2">Tracking</h4>
                                <p className="text-sm text-gray-400">Follow whales and monitor their on-chain activity</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <span className="text-yellow-400 font-bold">4</span>
                                </div>
                                <h4 className="font-bold text-white mb-2">Alerts</h4>
                                <p className="text-sm text-gray-400">Get notified when whales buy, sell, or enter new tokens</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}

// Force SSR to avoid static generation timeout
export const getServerSideProps: GetServerSideProps = async () => {
    return { props: {} };
};
