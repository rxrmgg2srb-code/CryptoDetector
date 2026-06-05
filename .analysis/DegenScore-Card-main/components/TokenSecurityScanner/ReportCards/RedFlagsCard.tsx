import React from 'react';
import { motion } from 'framer-motion';

interface RedFlagsCardProps {
  redFlags: any;
}

export default function RedFlagsCard({ redFlags }: RedFlagsCardProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500/20 border-red-500 text-red-400';
      case 'HIGH':
        return 'bg-orange-500/20 border-orange-500 text-orange-400';
      case 'MEDIUM':
        return 'bg-yellow-500/20 border-yellow-500 text-yellow-400';
      default:
        return 'bg-blue-500/20 border-blue-500 text-blue-400';
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-lg border border-red-500/30 rounded-2xl p-6">
      <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
        🚨 Security Warnings ({redFlags.flags.length})
      </h3>
      <div className="space-y-3">
        {redFlags.flags.map((flag: any, index: number) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`border rounded-xl p-4 ${getSeverityColor(flag.severity)}`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold">{flag.severity}</span>
              <span className="text-xs opacity-75">{flag.category}</span>
            </div>
            <p className="text-sm">{flag.message}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
