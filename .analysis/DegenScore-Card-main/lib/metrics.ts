/**
 * LEGACY COMPATIBILITY WRAPPER
 *
 * This file maintains backward compatibility while using the new professional metricsEngine.ts
 * All components that import from this file will automatically use the new engine.
 */

export { calculateAdvancedMetrics } from './metricsEngine';
export type { WalletMetrics, Position, Trade } from './metricsEngine';
