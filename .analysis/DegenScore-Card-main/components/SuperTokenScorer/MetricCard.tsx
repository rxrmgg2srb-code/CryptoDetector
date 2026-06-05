import React from 'react';

interface MetricCardProps {
  title: string;
  icon: string;
  children: React.ReactNode;
}

export default function MetricCard({ title, icon, children }: MetricCardProps) {
  return (
    <div className="bg-black/40 backdrop-blur-lg rounded-xl p-5 border border-purple-500/30">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        {icon} {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
