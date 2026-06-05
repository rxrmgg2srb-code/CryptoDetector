import React from 'react';

interface InfoRowProps {
  label: string;
  value: string;
  danger?: boolean;
}

export default function InfoRow({ label, value, danger = false }: InfoRowProps) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className={`font-semibold ${danger ? 'text-red-400' : 'text-white'}`}>{value}</span>
    </div>
  );
}
