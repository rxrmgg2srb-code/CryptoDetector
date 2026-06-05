import React from 'react';

export function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center font-bold">
        {number}
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-lg mb-2">{title}</h4>
        {children}
      </div>
    </div>
  );
}

export function ProcessStep({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-gray-200">
      <div className="w-2 h-2 bg-purple-400 rounded-full" />
      <p>{children}</p>
    </div>
  );
}

export function FeedExample({ emoji, action, wallet, token, amount, score }: any) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-3 text-sm">
      <p>
        <span className="mr-2">{emoji}</span>
        <strong>{action}</strong> by <span className="text-purple-400">{wallet}</span> (Score:{' '}
        {score})
      </p>
      <p className="text-gray-400 text-xs mt-1">
        {token} • {amount}
      </p>
    </div>
  );
}

export function LeaderboardCategory({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-black/30 border border-gray-700 rounded-lg p-4">
      <h5 className="font-bold mb-2">
        <span className="mr-2">{icon}</span>
        {title}
      </h5>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}
