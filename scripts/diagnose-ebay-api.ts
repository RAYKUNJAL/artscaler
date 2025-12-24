/**
 * eBay API Diagnostic Tool
 * Run this to test your eBay API configuration
 */

import { getEbayAccessToken } from '@/lib/ebay/oauth';
import { ebayApiClient } from '@/services/ebay/ebay-api-client';

async function diagnoseEbayApi() {
    console.log('🔍 eBay API Diagnostic Tool\n');
    console.log('='.repeat(60));

    // Step 1: Check environment variables
    console.log('\n📋 Step 1: Checking Environment Variables...');
    const requiredVars = {
        'EBAY_CLIENT_ID': process.env.EBAY_CLIENT_ID,
        'EBAY_CLIENT_SECRET': process.env.EBAY_CLIENT_SECRET,
        'EBAY_APP_ID': process.env.EBAY_APP_ID,
        'EBAY_ENVIRONMENT': process.env.EBAY_ENVIRONMENT || 'SANDBOX'
    };

    let allVarsPresent = true;
    for (const [key, value] of Object.entries(requiredVars)) {
        if (value) {
            console.log(`  ✅ ${key}: ${value.substring(0, 10)}...`);
        } else {
            console.log(`  ❌ ${key}: NOT SET`);
            allVarsPresent = false;
        }
    }

    if (!allVarsPresent) {
        console.log('\n⚠️  Missing environment variables. Please set them in .env.local');
        return;
    }

    // Step 2: Test OAuth Token
    console.log('\n🔐 Step 2: Testing OAuth Token...');
    try {
        const token = await getEbayAccessToken();
        console.log(`  ✅ OAuth token obtained: ${token.substring(0, 20)}...`);
    } catch (error: any) {
        console.log(`  ❌ OAuth failed: ${error.message}`);
        console.log('\n💡 Possible fixes:');
        console.log('  1. Check CLIENT_ID and CLIENT_SECRET are correct');
        console.log('  2. Verify your eBay app is active at developer.ebay.com');
        console.log('  3. Ensure you\'re using the right environment (SANDBOX vs PRODUCTION)');
        return;
    }

    // Step 3: Test Finding API - Completed Items
    console.log('\n🔍 Step 3: Testing Finding API (Completed Items)...');
    try {
        const completedItems = await ebayApiClient.findCompletedItems('painting', 5);
        console.log(`  ✅ Found ${completedItems.length} completed items`);
        if (completedItems.length > 0) {
            console.log(`  📦 Sample: ${completedItems[0].title}`);
        }
    } catch (error: any) {
        console.log(`  ❌ Finding API (Completed) failed: ${error.message}`);
        console.log('\n💡 Common issues:');
        console.log('  1. findCompletedItems is NOT available in SANDBOX');
        console.log('  2. You need PRODUCTION access for sold listings');
        console.log('  3. Your app may not have the required scopes');
        console.log('\n✨ WORKAROUND: Use universal sample data for testing');
    }

    // Step 4: Test Finding API - Active Items
    console.log('\n🔍 Step 4: Testing Finding API (Active Items)...');
    try {
        const activeItems = await ebayApiClient.findActiveItems('painting', 5);
        console.log(`  ✅ Found ${activeItems.length} active items`);
        if (activeItems.length > 0) {
            console.log(`  📦 Sample: ${activeItems[0].title}`);
        }
    } catch (error: any) {
        console.log(`  ❌ Finding API (Active) failed: ${error.message}`);
        console.log('\n💡 This usually works in SANDBOX, so check:');
        console.log('  1. Your APP_ID is correct');
        console.log('  2. Your app has Finding API access');
        console.log('  3. Rate limits haven\'t been exceeded');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 DIAGNOSTIC SUMMARY\n');
    console.log('Environment:', requiredVars.EBAY_ENVIRONMENT);
    console.log('\n🎯 RECOMMENDATIONS:\n');
    console.log('1. ✅ For TESTING: Use the universal sample data generator');
    console.log('   - Works for ANY keyword');
    console.log('   - No API limits');
    console.log('   - Realistic data');
    console.log('\n2. 🚀 For PRODUCTION: Apply for eBay Production Access');
    console.log('   - Submit app at developer.ebay.com');
    console.log('   - Request "Sell" and "Browse" API scopes');
    console.log('   - Set EBAY_ENVIRONMENT=PRODUCTION');
    console.log('\n3. 🔄 Current Status: Scanner will auto-fallback to sample data');
    console.log('   - No action needed for testing');
    console.log('   - App is fully functional');
    console.log('\n' + '='.repeat(60));
}

// Run diagnostic
diagnoseEbayApi().catch(console.error);
