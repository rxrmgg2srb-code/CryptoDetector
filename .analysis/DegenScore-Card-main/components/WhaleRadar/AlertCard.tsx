import React from 'react';
import { WhaleAlert } from '@/hooks/useWhaleRadar';
import { formatAddress, formatTime, getAlertTypeEmoji } from '@/lib/utils/whale-radar';

interface AlertCardProps {
  alert: WhaleAlert;
}

export default function AlertCard({ alert }: AlertCardProps) {
  return (
    <div
      className={`bg-gray-900/50 rounded-lg p-4 border transition ${
        alert.action === 'buy'
          ? 'border-green-500/30 bg-green-900/10'
          : 'border-red-500/30 bg-red-900/10'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="text-2xl">{getAlertTypeEmoji(alert.alertType)}</div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-white">
                {alert.whaleWallet.nickname || formatAddress(alert.whaleWallet.walletAddress)}
              </span>
              <span className="text-sm text-gray-500">
                {alert.action === 'buy' ? 'bought' : 'sold'}
              </span>
              <span className="font-bold text-blue-400">{alert.tokenSymbol}</span>
            </div>
            <div className="text-sm text-gray-400">
              {alert.amountSOL.toFixed(2)} SOL • {formatTime(alert.timestamp)}
            </div>
          </div>
        </div>
        <div
          className={`px-2 py-1 rounded text-xs font-bold ${
            alert.action === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}
        >
          {alert.action.toUpperCase()}
        </div>
      </div>
    </div>
  );
}
