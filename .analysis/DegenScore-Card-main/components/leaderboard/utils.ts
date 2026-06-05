export const getTierConfig = (score: number) => {
  if (score >= 90) {
    return {
      name: 'LEGENDARY',
      emoji: '👑',
      gradient: 'from-yellow-500 via-orange-400 to-yellow-300',
      border: 'border-yellow-400',
      glow: 'shadow-[0_0_40px_rgba(251,191,36,0.8)] shadow-yellow-500/80',
      bgPattern: 'bg-gradient-to-br from-yellow-900/30 via-orange-900/20 to-yellow-800/30',
      textColor: 'text-yellow-300',
      badgeGradient: 'from-yellow-500 via-orange-400 to-yellow-500',
      shine: true,
    };
  }
  if (score >= 80) {
    return {
      name: 'MASTER',
      emoji: '💎',
      gradient: 'from-fuchsia-500 via-purple-500 to-pink-500',
      border: 'border-fuchsia-400',
      glow: 'shadow-[0_0_35px_rgba(217,70,239,0.7)] shadow-fuchsia-500/70',
      bgPattern: 'bg-gradient-to-br from-fuchsia-900/30 via-purple-900/20 to-pink-900/30',
      textColor: 'text-fuchsia-300',
      badgeGradient: 'from-fuchsia-500 via-purple-500 to-pink-500',
      shine: true,
    };
  }
  if (score >= 70) {
    return {
      name: 'DIAMOND',
      emoji: '💠',
      gradient: 'from-cyan-500 via-blue-500 to-cyan-400',
      border: 'border-cyan-400',
      glow: 'shadow-[0_0_30px_rgba(34,211,238,0.6)] shadow-cyan-500/60',
      bgPattern: 'bg-gradient-to-br from-cyan-900/30 via-blue-900/20 to-cyan-800/30',
      textColor: 'text-cyan-300',
      badgeGradient: 'from-cyan-500 via-blue-400 to-cyan-500',
      shine: true,
    };
  }
  if (score >= 60) {
    return {
      name: 'PLATINUM',
      emoji: '⚡',
      gradient: 'from-slate-400 via-gray-300 to-slate-400',
      border: 'border-slate-400',
      glow: 'shadow-[0_0_25px_rgba(148,163,184,0.5)] shadow-slate-400/50',
      bgPattern: 'bg-gradient-to-br from-slate-800/30 via-gray-800/20 to-slate-800/30',
      textColor: 'text-slate-300',
      badgeGradient: 'from-slate-400 via-gray-300 to-slate-400',
      shine: false,
    };
  }
  if (score >= 50) {
    return {
      name: 'GOLD',
      emoji: '🌟',
      gradient: 'from-amber-500 via-yellow-500 to-amber-400',
      border: 'border-amber-400',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.4)] shadow-amber-500/40',
      bgPattern: 'bg-gradient-to-br from-amber-900/25 via-yellow-900/15 to-amber-900/25',
      textColor: 'text-amber-400',
      badgeGradient: 'from-amber-500 via-yellow-400 to-amber-500',
      shine: false,
    };
  }
  return {
    name: 'DEGEN',
    emoji: '🎮',
    gradient: 'from-emerald-500 via-green-500 to-emerald-400',
    border: 'border-emerald-400',
    glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)] shadow-emerald-500/30',
    bgPattern: 'bg-gradient-to-br from-emerald-900/20 via-green-900/15 to-emerald-900/20',
    textColor: 'text-emerald-400',
    badgeGradient: 'from-emerald-500 via-green-500 to-emerald-500',
    shine: false,
  };
};

export const getLevelPhrase = (level: number): string => {
  if (level >= 50) {
    return '🔥 Absolute Gigachad';
  }
  if (level >= 40) {
    return '💪 Degen Overlord';
  }
  if (level >= 30) {
    return '🚀 Moon Mission Commander';
  }
  if (level >= 20) {
    return '💎 Diamond Handed Legend';
  }
  if (level >= 15) {
    return '⚡ Certified Degen';
  }
  if (level >= 10) {
    return '🎯 Getting There';
  }
  if (level >= 5) {
    return '🐣 Baby Degen';
  }
  return '😅 Just Started';
};

export const formatNumber = (num: number, decimals: number = 2): string => {
  if (num === undefined || num === null) {
    return 'N/A';
  }
  if (num >= 1e9) {
    return `${(num / 1e9).toFixed(decimals)}B`;
  }
  if (num >= 1e6) {
    return `${(num / 1e6).toFixed(decimals)}M`;
  }
  if (num >= 1e3) {
    return `${(num / 1e3).toFixed(decimals)}K`;
  }
  return num.toFixed(decimals);
};

export const getFOMOPhrase = (score: number): string => {
  if (score >= 95) {
    return '🔥 GOD MODE - They Bow to You';
  }
  if (score >= 90) {
    return '👑 APEX PREDATOR - Pure Domination';
  }
  if (score >= 85) {
    return '💎 GENERATIONAL WEALTH - GG EZ';
  }
  if (score >= 80) {
    return '⚡ MAIN CHARACTER - Eating Good';
  }
  if (score >= 75) {
    return '🚀 MOON MISSION - Keep Stacking';
  }
  if (score >= 70) {
    return '🔥 KILLING IT - Above Average Chad';
  }
  if (score >= 65) {
    return "💪 SOLID - You'll Make It Anon";
  }
  if (score >= 60) {
    return '📈 MID CURVE - Touch Grass King';
  }
  if (score >= 55) {
    return '🎯 SLIGHTLY MID - Do Better';
  }
  if (score >= 50) {
    return '😬 NGMI VIBES - Yikes';
  }
  if (score >= 40) {
    return "📉 EXIT LIQUIDITY - That's You";
  }
  if (score >= 30) {
    return '💀 ABSOLUTELY COOKED - RIP';
  }
  if (score >= 20) {
    return "🤡 CIRCUS CLOWN - Everyone's Laughing";
  }
  if (score >= 10) {
    return '⚰️ DELETE APP - Uninstall Now';
  }
  return "🪦 QUIT FOREVER - It's Over Bro";
};
