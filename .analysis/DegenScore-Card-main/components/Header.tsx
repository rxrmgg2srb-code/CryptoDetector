import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';
import { NavigationButtons } from './NavigationButtons';
import { FOMOBar, FOMOPopup } from './FOMOBar';

// 🔒 Admin wallet with spy mode access
const ADMIN_WALLET = 'B7nB9QX1KC4QXp5GMxR8xzh3yzoqp6NjxSwfNBXtgPc1';

interface HeaderProps {
  connected?: boolean;
  username?: string;
  showFOMO?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ connected = false, username = '', showFOMO = true }) => {
  const { publicKey } = useWallet();

  // Check if connected wallet is admin
  const isAdmin = publicKey?.toBase58() === ADMIN_WALLET;

  return (
    <>
      {/* FOMO Bar - Creates urgency */}
      {showFOMO && <FOMOBar />}

      <header className="bg-black/50 backdrop-blur-lg sticky top-0 z-40 border-b border-purple-500/30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3">
                <div className="text-2xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">
                  DegenScore
                </div>
              </Link>
              <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full font-bold hidden sm:block">
                BETA
              </span>
            </div>

            {/* Navigation - SIMPLIFIED 4 BUTTONS */}
            <div className="hidden md:block">
              <NavigationButtons />
            </div>

            {/* Right side: Admin link + Wallet */}
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Link
                  href="/spy-mode"
                  className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 font-semibold text-sm"
                >
                  🕵️ Spy
                </Link>
              )}
              {connected ? (
                <div className="text-white font-medium">{username}</div>
              ) : (
                <WalletMultiButton className="!bg-gradient-to-r !from-purple-600 !to-pink-600 hover:!from-purple-500 hover:!to-pink-500 !rounded-xl !font-bold" />
              )}
            </div>
          </div>

          {/* Mobile navigation - FULL NAVIGATION */}
          <nav className="md:hidden flex flex-wrap items-center gap-2 mt-3 justify-center">
            <Link
              href="/"
              className="text-xs px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold"
            >
              🎯 Score
            </Link>
            <Link
              href="/leaderboard"
              className="text-xs px-3 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold"
            >
              🏆 Top
            </Link>
            <Link
              href="/whale-radar"
              className="text-xs px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold"
            >
              🐋 Whales
            </Link>
            <Link
              href="/compare"
              className="text-xs px-3 py-2 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold"
            >
              ⚔️ Battle
            </Link>
            <Link
              href="/token-scanner"
              className="text-xs px-3 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold"
            >
              🔍 Scanner
            </Link>
            <Link
              href="/super-token-scorer"
              className="text-xs px-3 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold"
            >
              🧠 Super
            </Link>
            <Link
              href="/achievements"
              className="text-xs px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold"
            >
              🏅
            </Link>
            <Link
              href="/challenges"
              className="text-xs px-3 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold"
            >
              🎮
            </Link>
            <Link
              href="/documentation"
              className="text-xs px-3 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold"
            >
              📚
            </Link>
            {isAdmin && (
              <Link
                href="/spy-mode"
                className="text-xs px-3 py-2 rounded-lg bg-gray-700 text-purple-400 font-bold"
              >
                🕵️
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* FOMO Popup - Random notifications */}
      {showFOMO && <FOMOPopup />}
    </>
  );
};

export default Header;
