import Link from 'next/link';
import MetaHead from '../components/MetaHead';

/**
 * Custom 500 Page - Server Error
 * Professional error page for internal server errors
 */
export default function Custom500() {
    return (
        <>
            <MetaHead
                title="500 - Server Error | DegenScore"
                description="Something went wrong on our end. Our degens are working to fix it."
            />
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900/20 to-gray-900 flex items-center justify-center px-4">
                <div className="text-center">
                    {/* Animated 500 */}
                    <div className="mb-8">
                        <h1 className="text-9xl font-black bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent animate-pulse">
                            500
                        </h1>
                    </div>

                    {/* Error Message */}
                    <h2 className="text-3xl font-bold text-white mb-4">
                        Server Got REKT 💥
                    </h2>
                    <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
                        Something went wrong on our end. Our team of degens is already on it. Please try again in a moment.
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-red-500/30"
                        >
                            🔄 Try Again
                        </button>
                        <Link
                            href="/"
                            className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-all border border-red-500/30"
                        >
                            🏠 Go Home
                        </Link>
                    </div>

                    {/* Status Info */}
                    <div className="mt-12 text-gray-500 text-sm">
                        <p>Error code: 500 | Status: Temporarily NGMI 😅</p>
                        <p className="mt-2">If this persists, check back in a few minutes.</p>
                    </div>
                </div>
            </div>
        </>
    );
}
