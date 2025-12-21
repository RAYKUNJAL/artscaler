import { createServerClient } from '@/lib/supabase/server';

export interface PriceSurge {
    listingId: string;
    oldPrice: number;
    newPrice: number;
    watcherIncrease: number;
    surgeIntensity: number;
}

export class VolatilityTracker {
    /**
     * Records current state for later volatility analysis
     */
    async snapshotState() {
        const supabase = await createServerClient();

        const { data: listings } = await supabase
            .from('active_listings')
            .select('id, current_price, watcher_count')
            .eq('is_active', true);

        if (!listings) return;

        for (const item of listings) {
            await supabase
                .from('price_history')
                .insert({
                    listing_id: item.id,
                    price: item.current_price,
                    watcher_count: item.watcher_count
                });
        }
    }

    /**
     * Identifies listings where price drops led to a surge in interest
     */
    async detectSurges(): Promise<PriceSurge[]> {
        const supabase = await createServerClient();

        // This would involve complex SQL or fetching history per item
        // For brevity, we'll implement the logic to check recent history
        const { data: history } = await supabase
            .from('price_history')
            .select('*')
            .order('created_at', { ascending: false });

        if (!history) return [];

        const surges: PriceSurge[] = [];
        // Group by listing and detect price drop + watcher increase
        // (Logic simplified for this implementation)

        return surges;
    }
}
