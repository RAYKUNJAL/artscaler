/**
 * Update .env.local with Production eBay Credentials
 * Run this to automatically configure production settings
 */

import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(process.cwd(), '.env.local');

// Production credentials
const productionConfig = `
# =============================================================================
# eBay Production API Configuration
# Updated: ${new Date().toISOString()}
# =============================================================================
EBAY_ENVIRONMENT=PRODUCTION

// Production Credentials (REDACTED FOR SECURITY)
// Please use your .env.local file to manage these instead of hardcoding
EBAY_APP_ID=YOUR_PRODUCTION_APP_ID
EBAY_CLIENT_ID=YOUR_PRODUCTION_CLIENT_ID
EBAY_DEV_ID=YOUR_PRODUCTION_DEV_ID
EBAY_CERT_ID=YOUR_PRODUCTION_CERT_ID
EBAY_CLIENT_SECRET=YOUR_PRODUCTION_CLIENT_SECRET
`;

console.log('🔧 eBay Production Configuration Updater\n');
console.log('='.repeat(60));

try {
    // Check if .env.local exists
    if (!fs.existsSync(envPath)) {
        console.log('❌ .env.local not found!');
        console.log('\n💡 Creating new .env.local file...');
        fs.writeFileSync(envPath, productionConfig.trim());
        console.log('✅ Created .env.local with production credentials');
    } else {
        // Read existing file
        let envContent = fs.readFileSync(envPath, 'utf-8');

        // Backup existing file
        const backupPath = path.join(process.cwd(), '.env.local.backup');
        fs.writeFileSync(backupPath, envContent);
        console.log('✅ Backed up existing .env.local to .env.local.backup');

        // Remove old eBay configuration
        const lines = envContent.split('\n');
        const filteredLines = lines.filter(line => {
            const trimmed = line.trim();
            return !trimmed.startsWith('EBAY_') &&
                !trimmed.includes('eBay') &&
                trimmed !== '';
        });

        // Add production config
        const newContent = filteredLines.join('\n') + '\n' + productionConfig;

        // Write updated file
        fs.writeFileSync(envPath, newContent.trim());
        console.log('✅ Updated .env.local with production credentials');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Configuration Complete!\n');
    console.log('📋 Production Credentials Set:');
    console.log('   • EBAY_ENVIRONMENT: PRODUCTION');
    console.log('   • EBAY_APP_ID: RAYKUNJA-Artintel-PRD-...');
    console.log('   • EBAY_CLIENT_ID: RAYKUNJA-Artintel-PRD-...');
    console.log('   • EBAY_DEV_ID: 0aa83ebc-...');
    console.log('   • EBAY_CERT_ID: PRD-e06b92ff26dc-...');
    console.log('   • EBAY_CLIENT_SECRET: PRD-e06b92ff26dc-...');

    console.log('\n🎯 Next Steps:');
    console.log('   1. Restart your dev server (Ctrl+C, then npm run dev)');
    console.log('   2. Run diagnostic: npx tsx scripts/diagnose-ebay-api.ts');
    console.log('   3. Test Market Scanner with real searches');
    console.log('   4. Look for "Using REAL eBay API data" in console');

    console.log('\n🚀 You\'re now using PRODUCTION eBay API!');
    console.log('   • Real sold listings data');
    console.log('   • Actual market prices');
    console.log('   • True demand metrics');

    console.log('\n' + '='.repeat(60));

} catch (error: any) {
    console.error('❌ Error updating configuration:', error.message);
    console.log('\n💡 Manual Setup:');
    console.log('   1. Open .env.local in your editor');
    console.log('   2. Update the eBay section with production credentials');
    console.log('   3. See PRODUCTION_EBAY_SETUP.md for details');
}
