import dynamic from 'next/dynamic';
import Head from 'next/head';
import Header from '../components/Header';

const DailyChallengesActive = dynamic(
    () => import('../components/DailyChallengesActive'),
    {
        ssr: false,
        loading: () => (
            <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mb-4"></div>
                    <p className="text-white text-xl">Loading Challenges...</p>
                </div>
            </div>
        ),
    }
);

export default function ChallengesPage() {
    return (
        <>
            <Head>
                <title>🎯 Daily Challenges - DegenScore</title>
                <meta name="description" content="Complete daily and weekly challenges to earn XP, badges, and SOL rewards" />
            </Head>

            <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black">
                <Header />

                <div className="py-8 px-4">
                    <div className="container mx-auto max-w-4xl">
                        <DailyChallengesActive />
                    </div>
                </div>
            </div>
        </>
    );
}
