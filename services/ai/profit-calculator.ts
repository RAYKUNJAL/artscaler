/**
 * Profit Calculator Service
 * 
 * Calculates eBay fees, shipping costs, and remaining profit margins.
 * Based on current eBay fee structures (approx 13.25% + $0.30 for Art).
 */

export interface ProfitCalculation {
    salePrice: number;
    shippingCharged: number;
    shippingCost: number;
    itemCost: number;
    otherCosts: number;
    ebayFees: number;
    netProfit: number;
    margin: number;
    roi: number;
}

export class ProfitCalculator {
    private static EBAY_ART_FEE_PERCENT = 0.1325; // 13.25% for most Art categories
    private static EBAY_FIXED_FEE = 0.40; // Updated to $0.40 for 2024
    private static REGULATORY_OPERATING_FEE = 0.0035; // 0.35% for US sellers
    private static INTERNATIONAL_FEE = 0.0165; // ~1.65% for international orders
    private static PRO_TIER_DISCOUNT = 0.10; // 10% off final value fees for Store subscribers

    /**
     * Calculate profit based on inputs
     */
    static calculate(
        salePrice: number,
        shippingCharged: number = 0,
        shippingCost: number = 0,
        itemCost: number = 0,
        otherCosts: number = 0,
        isPro: boolean = false,
        isInternational: boolean = false,
        promoAdRate: number = 0
    ): ProfitCalculation {
        const totalRevenue = salePrice + shippingCharged;

        // Base eBay fee
        let feePercent = this.EBAY_ART_FEE_PERCENT;
        if (isPro) {
            feePercent = feePercent * (1 - this.PRO_TIER_DISCOUNT);
        }

        // Add Regulatory Fee (2024)
        feePercent += this.REGULATORY_OPERATING_FEE;

        // International Fee
        if (isInternational) {
            feePercent += this.INTERNATIONAL_FEE;
        }

        // Final Value Fee
        let ebayFees = (totalRevenue * feePercent) + this.EBAY_FIXED_FEE;

        // Add Promoted Listings Fee (Ad rate is applied to total sale amt)
        if (promoAdRate > 0) {
            ebayFees += (totalRevenue * (promoAdRate / 100));
        }

        const totalExpenses = shippingCost + itemCost + otherCosts + ebayFees;
        const netProfit = totalRevenue - totalExpenses;

        const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
        const roi = itemCost > 0 ? (netProfit / itemCost) * 100 : 0;

        return {
            salePrice,
            shippingCharged,
            shippingCost,
            itemCost,
            otherCosts,
            ebayFees: Math.round(ebayFees * 100) / 100,
            netProfit: Math.round(netProfit * 100) / 100,
            margin: Math.round(margin * 100) / 100,
            roi: Math.round(roi * 100) / 100
        };
    }

    /**
     * Estimate break-even price
     */
    static calculateBreakEven(
        itemCost: number,
        shippingCost: number,
        shippingCharged: number = 0,
        otherCosts: number = 0,
        isPro: boolean = false
    ): number {
        const fixedExpenses = itemCost + shippingCost + otherCosts - shippingCharged + this.EBAY_FIXED_FEE;
        let feePercent = this.EBAY_ART_FEE_PERCENT;
        if (isPro) feePercent *= (1 - this.PRO_TIER_DISCOUNT);

        // Revenue - (Revenue * feePercent) = fixedExpenses
        // Revenue * (1 - feePercent) = fixedExpenses
        // Revenue = fixedExpenses / (1 - feePercent)
        return Math.round((fixedExpenses / (1 - feePercent)) * 100) / 100;
    }
}
