/**
 * Utility functions for SuperTokenScorer
 */

export function getScoreColor(score: number): string {
  if (score >= 800) {
    return 'text-green-400';
  }
  if (score >= 650) {
    return 'text-blue-400';
  }
  if (score >= 500) {
    return 'text-yellow-400';
  }
  if (score >= 350) {
    return 'text-orange-400';
  }
  return 'text-red-400';
}

export function getRiskBadge(risk: string): string {
  switch (risk) {
    case 'ULTRA_SAFE':
    case 'VERY_SAFE':
      return 'bg-green-500 text-white';
    case 'SAFE':
      return 'bg-blue-500 text-white';
    case 'MODERATE':
      return 'bg-yellow-500 text-black';
    case 'RISKY':
      return 'bg-orange-500 text-white';
    case 'VERY_RISKY':
    case 'EXTREME_DANGER':
      return 'bg-red-500 text-white';
    case 'SCAM':
      return 'bg-black text-red-500 border-2 border-red-500';
    default:
      return 'bg-gray-500 text-white';
  }
}

export function getRiskColor(risk: string): string {
  switch (risk) {
    case 'LOW':
      return 'text-green-400';
    case 'MEDIUM':
      return 'text-yellow-400';
    case 'HIGH':
      return 'text-orange-400';
    case 'CRITICAL':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
}

export function getSeverityEmoji(severity: string): string {
  switch (severity) {
    case 'CRITICAL':
      return '🔴';
    case 'HIGH':
      return '🟠';
    case 'MEDIUM':
      return '🟡';
    case 'LOW':
      return '🔵';
    default:
      return 'ℹ️';
  }
}

export function getSignalColor(signal: string): string {
  switch (signal) {
    case 'STRONG_BUY':
      return 'text-green-500 font-bold';
    case 'BUY':
      return 'text-green-400';
    case 'NEUTRAL':
      return 'text-gray-400';
    case 'SELL':
      return 'text-red-400';
    case 'STRONG_SELL':
      return 'text-red-500 font-bold';
    default:
      return 'text-gray-400';
  }
}

export function getPatternColor(pattern: string): string {
  switch (pattern) {
    case 'ORGANIC_GROWTH':
      return 'text-green-400';
    case 'ACCUMULATION':
      return 'text-blue-400';
    case 'SIDEWAYS':
      return 'text-gray-400';
    case 'DISTRIBUTION':
      return 'text-yellow-400';
    case 'PUMP_AND_DUMP':
    case 'DEATH_SPIRAL':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
}

export function getLiquidityColor(health: string): string {
  switch (health) {
    case 'EXCELLENT':
      return 'text-green-500 font-bold';
    case 'GOOD':
      return 'text-green-400';
    case 'FAIR':
      return 'text-yellow-400';
    case 'POOR':
      return 'text-orange-400';
    case 'CRITICAL':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
}
