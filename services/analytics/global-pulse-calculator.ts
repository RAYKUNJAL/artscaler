/**
 * Global Pulse Calculator
 * 
 * Algorithm: (avg_wvs * 0.4) + (active_listings_growth * 0.3) + (sell_through_rate * 0.3)
 */

export interface PulseMetrics {
    avgWvs: number;
    activeListingsGrowth: number; // Percentage growth in last 30d
    sellThroughRate: number;      // Sold / (Sold + Active)
}

export function calculateGlobalPulse(metrics: PulseMetrics): number {
    const { avgWvs, activeListingsGrowth, sellThroughRate } = metrics;

    // Normalize values
    // WVS is 0-10, we want 0-100 for pulse
    const normalizedWvs = Math.min(avgWvs * 10, 100);

    // Growth: 0% = 50, +10% = 70, -10% = 30
    const normalizedGrowth = Math.max(0, Math.min(100, 50 + (activeListingsGrowth * 2)));

    // Sell-through: 0% = 0, 10% = 50, 20% = 100 (typical for canvas art)
    const normalizedStr = Math.min(sellThroughRate * 500, 100);

    const score = (normalizedWvs * 0.4) + (normalizedGrowth * 0.3) + (normalizedStr * 0.3);

    return parseFloat(score.toFixed(2));
}

export function getPulseMood(score: number): string {
    if (score >= 80) return '🔥 SCORCHING';
    if (score >= 60) return '📈 BULLISH';
    if (score >= 40) return '⚖️ STABLE';
    if (score >= 20) return '📉 BEARISH';
    return '❄️ FROZEN';
}
