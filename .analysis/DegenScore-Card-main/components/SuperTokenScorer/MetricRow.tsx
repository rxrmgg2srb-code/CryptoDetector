import React from 'react';

interface MetricRowProps {
  label: string;
  value: string | number;
  valueClass?: string;
}

export default function MetricRow({ label, value, valueClass = 'text-white' }: MetricRowProps) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-400 text-sm">{label}:</span>
      <span className={`font-semibold text-sm ${valueClass}`}>{value}</span>
    </div>
  );
}
