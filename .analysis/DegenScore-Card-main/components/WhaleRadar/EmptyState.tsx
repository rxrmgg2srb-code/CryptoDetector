import React from 'react';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
}

export default function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="text-center text-gray-500 py-12">
      <div className="text-6xl mb-4">{icon}</div>
      <p className="text-lg">{title}</p>
      <p className="text-sm mt-2">{description}</p>
    </div>
  );
}
