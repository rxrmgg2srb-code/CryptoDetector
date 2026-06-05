import React from 'react';

export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-purple-900/50 border border-purple-500/30 px-2 py-1 rounded text-xs">
      {children}
    </span>
  );
}

export function BadgeCategory({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-black/30 border border-gray-700 rounded-lg p-4">
      <h4 className="font-bold mb-3">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function BadgeItem({
  name,
  description,
  rarity,
}: {
  name: string;
  description: string;
  rarity: string;
}) {
  const colors: any = {
    COMMON: 'text-gray-400',
    RARE: 'text-green-400',
    EPIC: 'text-purple-400',
    LEGENDARY: 'text-orange-400',
    MYTHIC: 'text-red-400',
  };

  return (
    <div className="flex justify-between items-center text-sm">
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <span className={`text-xs font-bold ${colors[rarity]}`}>{rarity}</span>
    </div>
  );
}

export function RarityBadge({ color, children }: { color: string; children: React.ReactNode }) {
  const colors: any = {
    gray: 'bg-gray-700 text-gray-300',
    green: 'bg-green-900/50 text-green-300 border-green-500/30',
    purple: 'bg-purple-900/50 text-purple-300 border-purple-500/30',
    orange: 'bg-orange-900/50 text-orange-300 border-orange-500/30',
    red: 'bg-red-900/50 text-red-300 border-red-500/30',
  };

  return (
    <div className={`${colors[color]} border px-2 py-1 rounded text-xs font-bold text-center`}>
      {children}
    </div>
  );
}
