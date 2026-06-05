export const formatAddress = (address: string) => {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

export const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  if (hours < 24) {
    return `${hours}h ago`;
  }
  return `${days}d ago`;
};

export const getAlertTypeEmoji = (type: string) => {
  switch (type) {
    case 'large_buy':
      return '💰';
    case 'large_sell':
      return '💸';
    case 'new_position':
      return '🎯';
    case 'position_close':
      return '🔒';
    case 'whale_detected':
      return '🐋';
    default:
      return '📊';
  }
};
