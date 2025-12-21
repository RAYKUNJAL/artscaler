import { createServerClient } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';

export interface GlobalBenchmark {
    category: 'style' | 'size' | 'medium';
    term: string;
    avg_sold_price: number;
    median_sold_price: number;
    avg_wvs: number;
    listing_count: number;
    month_year: string;
}

export class GlobalIntelligenceService {
    /**
     * Trigger the SQL aggregation and refresh global benchmarks
     */
    async refreshGlobalBenchmarks(): Promise<boolean> {
        try {
            const supabase = await createServerClient();

            // 1. Run SQL aggregation
            const { error: rpcError } = await supabase.rpc('refresh_global_benchmarks');
            if (rpcError) throw rpcError;

            // 2. Fetch the newly aggregated data to calculate WVS and growth
            const currentMonth = new Date().toISOString().slice(0, 7);
            const { data: benchmarks, error: fetchError } = await supabase
                .from('global_market_benchmarks')
                .select('*')
                .eq('month_year', currentMonth);

            if (fetchError || !benchmarks) throw fetchError;

            // 3. Update WVS for benchmarks (Global WVS is simplified for now)
            for (const benchmark of benchmarks) {
                const globalWvs = (benchmark.listing_count / 100) * (benchmark.median_sold_price / 150);
                await supabase
                    .from('global_market_benchmarks')
                    .update({
                        avg_wvs: Math.min(globalWvs, 10.0),
                        demand_score: Math.min(globalWvs * 10, 100)
                    })
                    .eq('id', benchmark.id);
            }

            console.log(`🌍 Global Intelligence: Refreshed ${benchmarks.length} benchmarks for ${currentMonth}`);
            return true;
        } catch (error) {
            console.error('❌ Global Intelligence Error:', error);
            return false;
        }
    }

    /**
     * Get global context for a specific niche
     */
    async getGlobalContext(category: 'style' | 'size', term: string) {
        const supabase = await createServerClient();
        const currentMonth = new Date().toISOString().slice(0, 7);

        const { data, error } = await supabase
            .from('global_market_benchmarks')
            .select('*')
            .eq('category', category)
            .ilike('term', `%${term}%`)
            .eq('month_year', currentMonth)
            .single();

        if (error || !data) return null;
        return data as GlobalBenchmark;
    }

    /**
     * Get top performers across the entire platform
     */
    async getTopGlobalPerformers() {
        const supabase = await createServerClient();
        const currentMonth = new Date().toISOString().slice(0, 7);

        const { data, error } = await supabase
            .from('global_market_benchmarks')
            .select('*')
            .eq('month_year', currentMonth)
            .order('avg_wvs', { ascending: false })
            .limit(10);

        if (error) return [];
        return data as GlobalBenchmark[];
    }
}

// Singleton helper
let globalIntelligenceInstance: GlobalIntelligenceService | null = null;

export function getGlobalIntelligenceService(): GlobalIntelligenceService {
    if (!globalIntelligenceInstance) {
        globalIntelligenceInstance = new GlobalIntelligenceService();
    }
    return globalIntelligenceInstance;
}
