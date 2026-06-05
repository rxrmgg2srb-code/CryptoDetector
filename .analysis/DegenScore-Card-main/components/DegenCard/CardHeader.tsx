import React from 'react';

export default function CardHeader() {
  return (
    <div className="text-center mb-10">
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-4 animate-float drop-shadow-[0_0_30px_rgba(34,211,238,0.5)]">
        DegenScore Card Generator
      </h1>
      <p className="text-gray-300 text-lg md:text-xl lg:text-2xl font-medium">
        Generate your Solana trader card with real on-chain metrics
      </p>
    </div>
  );
}
