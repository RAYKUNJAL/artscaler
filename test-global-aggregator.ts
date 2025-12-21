import { getGlobalIntelligenceService } from './services/ai/global-intelligence-service';
import { supabase } from './lib/supabase/client';

async function testGlobalAggregator() {
    console.log('🧪 Testing Global Aggregator...');

    try {
        const service = getGlobalIntelligenceService();

        // 1. Manually trigger the refresh
        console.log('🔄 Triggering refresh...');
        const success = await service.refreshGlobalBenchmarks();

        if (success) {
            console.log('✅ Refresh RPC and WVS update successful');
        } else {
            console.error('❌ Refresh failed');
        }

        // 2. Query the global benchmarks
        const currentMonth = new Date().toISOString().slice(0, 7);
        const { data: benchmarks, error } = await supabase
            .from('global_market_benchmarks')
            .select('*')
            .eq('month_year', currentMonth);

        if (error) throw error;

        console.log(`📊 Global Benchmarks for ${currentMonth}:`, benchmarks.length);
        if (benchmarks.length > 0) {
            console.log('✨ First Benchmark:', {
                term: benchmarks[0].term,
                avgPrice: benchmarks[0].avg_sold_price,
                listingCount: benchmarks[0].listing_count,
                wvs: benchmarks[0].avg_wvs
            });
            console.log('🚀 SUCCESS: Global Art Intelligence is live!');
        } else {
            console.log('⚠️  No data found in global benchmarks. Ensure there is data in sold_listings_clean first.');
        }

    } catch (err) {
        console.error('❌ Aggregator test failed:', err);
    }
}

testGlobalAggregator();
