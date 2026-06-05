import Link from 'next/link';
import MetaHead from '../components/MetaHead';

/**
 * Custom 404 Page - Not Found
 * Professional error page with navigation back to home
 */
export default function Custom404() {
    return (
        <>
            <MetaHead
                title="404 - Page Not Found | DegenScore"
                description="The page you're looking for doesn't exist. Let's get you back to analyzing your degen trades."
            />
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center px-4">
                <div className="text-center">
                    {/* Animated 404 */}
                    <div className="mb-8">
                        <h1 className="text-9xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent animate-pulse">
                            404
                        </h1>
                    </div>

                    {/* Error Message */}
                    <h2 className="text-3xl font-bold text-white mb-4">
                        Lost in the Blockchain? 🌌
                    </h2>
                    <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
                        This page doesn't exist, anon. Maybe it got rugged, or you're exploring uncharted territory.
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/"
                            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-purple-500/30"
                        >
                            🏠 Go Home
                        </Link>
                        <Link
                            href="/leaderboard"
                            className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-all border border-purple-500/30"
                        >
                            🏆 View Leaderboard
                        </Link>
                    </div>

                    {/* Fun Stats */}
                    <div className="mt-12 text-gray-500 text-sm">
                        <p>Error code: 404 | Status: REKT 💀</p>
                    </div>
                </div>
            </div>
        </>
    );
}
