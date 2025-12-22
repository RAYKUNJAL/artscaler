import { getWVSAgent } from './services/ai/wvs-agent';
import { supabase } from './lib/supabase/client';

async function testPipeline() {
    console.log('🧪 Testing AI Pipeline integration...');

    // Get a test user ID from the database
    const { data: users } = await supabase.from('user_profiles').select('id').limit(1);

    if (!users || users.length === 0) {
        console.log('❌ No users found in database. Please sign up or seed users first.');
        return;
    }

    const userId = users[0].id;
    console.log(`👤 Using User ID: ${userId}`);

    try {
        const agent = getWVSAgent();
        const report = await agent.processPipeline(supabase, userId);

        console.log('✅ Pipeline Run Complete');
        console.log('📊 Stats:', {
            listingsAnalyzed: report.totalListingsAnalyzed,
            stylesFound: report.topStyles.map(s => s.styleTerm),
            opportunitiesCreated: report.topStyles.length
        });

        if (report.topStyles.length > 0) {
            console.log('✨ SUCCESS: Pipeline is generating live insights!');
        } else {
            console.log('⚠️  Pipeline ran but no listings were found to analyze. Try scanning some subjects first.');
        }

    } catch (error) {
        console.error('❌ Pipeline test failed:', error);
    }
}

testPipeline();
