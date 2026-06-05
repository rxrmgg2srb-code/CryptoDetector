/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import Header from './Header';
import FIFACard, { FIFACardProps } from './FIFACard';
import { motion } from 'framer-motion';

// Mock data para demostración
const mockLeaderboardData: FIFACardProps[] = [
  {
    rank: 1,
    walletAddress: 'B7nB9QX1KC4QXp5GMxR8xzh3yzoqp6NjxSwfNBXtgPc1',
    displayName: 'Whale King',
    profileImage: undefined,
    degenScore: 98,
    tier: 'Whale',
    stats: {
      winRate: 87.5,
      totalVolume: 2500,
      profitLoss: 450,
      totalTrades: 1250,
      avgHoldTime: 48,
      level: 10,
    },
    badges: [
      { name: 'Volume King', icon: '👑', rarity: 'LEGENDARY' },
      { name: 'Diamond Hands', icon: '💎', rarity: 'EPIC' },
      { name: 'Whale', icon: '🐋', rarity: 'MYTHIC' },
      { name: 'Profit Titan', icon: '🧬', rarity: 'MYTHIC' },
      { name: 'Elite Sniper', icon: '🏅', rarity: 'EPIC' },
    ],
    twitter: 'solanawhale',
    telegram: 'whaleking',
  },
  {
    rank: 2,
    walletAddress: '7Np41oeYqPefeNQEHSv1UDhYrehxin3NStELsSKCT4K2',
    displayName: 'Shark Master',
    profileImage: undefined,
    degenScore: 95,
    tier: 'Shark',
    stats: {
      winRate: 82.3,
      totalVolume: 1800,
      profitLoss: 320,
      totalTrades: 980,
      avgHoldTime: 36,
      level: 9,
    },
    badges: [
      { name: 'Shark Trader', icon: '🦈', rarity: 'RARE' },
      { name: 'Sniper', icon: '🎖️', rarity: 'RARE' },
      { name: 'Hot Wallet', icon: '🔥', rarity: 'RARE' },
    ],
    twitter: 'sharktrader',
    telegram: 'sharkmaster',
  },
  {
    rank: 3,
    walletAddress: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
    displayName: 'Degen Pro',
    profileImage: undefined,
    degenScore: 92,
    tier: 'Shark',
    stats: {
      winRate: 78.9,
      totalVolume: 1500,
      profitLoss: 280,
      totalTrades: 850,
      avgHoldTime: 24,
      level: 8,
    },
    badges: [
      { name: 'Active Trader', icon: '📈', rarity: 'COMMON' },
      { name: 'Consistent', icon: '📅', rarity: 'RARE' },
    ],
    twitter: 'degenpro',
  },
  {
    rank: 11,
    walletAddress: '8RtwWeqdFz4EFuZU3MAaRfaH4oL5YvPJDBXp5BqJpump',
    displayName: 'Dolphin Trader',
    profileImage: undefined,
    degenScore: 75,
    tier: 'Dolphin',
    stats: {
      winRate: 65.2,
      totalVolume: 850,
      profitLoss: 120,
      totalTrades: 520,
      avgHoldTime: 18,
      level: 6,
    },
    badges: [
      { name: 'Dolphin', icon: '🐬', rarity: 'COMMON' },
      { name: 'Accurate', icon: '🎯', rarity: 'COMMON' },
    ],
    telegram: 'dolphintrader',
  },
  {
    rank: 51,
    walletAddress: '3FoUAsGDbvTD6YZ4wVKJgTB8HUXiGhFQc5PSa6FAzJ1M',
    displayName: 'Fish Degen',
    profileImage: undefined,
    degenScore: 58,
    tier: 'Fish',
    stats: {
      winRate: 55.8,
      totalVolume: 320,
      profitLoss: 45,
      totalTrades: 280,
      avgHoldTime: 12,
      level: 4,
    },
    badges: [{ name: 'Fish', icon: '🐟', rarity: 'COMMON' }],
    twitter: 'fishdegen',
  },
  {
    rank: 100,
    walletAddress: '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1',
    displayName: 'Plankton',
    profileImage: undefined,
    degenScore: 42,
    tier: 'Plankton',
    stats: {
      winRate: 48.5,
      totalVolume: 120,
      profitLoss: -5,
      totalTrades: 150,
      avgHoldTime: 8,
      level: 2,
    },
    badges: [],
  },
];

export default function FIFALeaderboardContent() {
  const firstPlace = mockLeaderboardData[0];
  const secondPlace = mockLeaderboardData[1];
  const thirdPlace = mockLeaderboardData[2];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <Header />

      <div className="container mx-auto px-4 py-12">
        {/* Title */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-6xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500">
            🏆 TOP TRADERS
          </h1>
          <p className="text-gray-300 text-xl">
            The Ultimate FIFA-Style Leaderboard of Solana's Best Traders
          </p>
        </motion.div>

        {/* Top 3 Podium */}
        <div className="flex justify-center items-end gap-8 mb-16">
          {/* 2nd Place */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="text-center mb-4">
              <div className="text-6xl mb-2">🥈</div>
              <div className="text-gray-400 font-bold">2nd Place</div>
            </div>
            {secondPlace && <FIFACard {...secondPlace} />}
          </motion.div>

          {/* 1st Place (Taller) */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="transform scale-110"
          >
            <div className="text-center mb-4">
              <div className="text-8xl mb-2">🥇</div>
              <div className="text-yellow-400 font-black text-xl">CHAMPION</div>
            </div>
            {firstPlace && <FIFACard {...firstPlace} />}
          </motion.div>

          {/* 3rd Place */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <div className="text-center mb-4">
              <div className="text-6xl mb-2">🥉</div>
              <div className="text-gray-400 font-bold">3rd Place</div>
            </div>
            {thirdPlace && <FIFACard {...thirdPlace} />}
          </motion.div>
        </div>

        {/* Rest of Top 100 */}
        <div className="mt-20">
          <h2 className="text-4xl font-black text-white text-center mb-8">Top 100 Traders</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
            {mockLeaderboardData.slice(3).map((trader, index) => (
              <motion.div
                key={trader.walletAddress}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + index * 0.1, duration: 0.4 }}
              >
                <FIFACard {...trader} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <motion.div
          className="mt-20 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.6 }}
        >
          <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-2 border-cyan-500/50 rounded-3xl p-12">
            <h2 className="text-4xl font-black text-white mb-4">Want to see YOUR card here?</h2>
            <p className="text-gray-300 text-lg mb-8">
              Start trading on Solana and climb the leaderboard to earn your FIFA-style card
            </p>
            <button
              onClick={() => (window.location.href = '/')}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-black text-xl rounded-xl transition-all hover:scale-105 shadow-2xl"
            >
              🎴 Generate My Card Now
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
