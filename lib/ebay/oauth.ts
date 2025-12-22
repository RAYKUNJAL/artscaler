/**
 * eBay OAuth 2.0 Service
 * Handles Client Credentials flow for application-level API access
 */

export interface EbayTokenResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
}

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

export async function getEbayAccessToken(): Promise<string> {
    const clientId = process.env.EBAY_CLIENT_ID;
    const clientSecret = process.env.EBAY_CLIENT_SECRET;
    const environment = process.env.EBAY_ENVIRONMENT || 'SANDBOX';

    if (!clientId || !clientSecret) {
        throw new Error('eBay credentials (CLIENT_ID, CLIENT_SECRET) not configured');
    }

    // Return cached token if still valid (with 60s buffer)
    if (cachedToken && Date.now() < tokenExpiry - 60000) {
        return cachedToken;
    }

    console.log(`[eBay OAuth] Fetching new access token for ${environment}...`);

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenUrl = environment.toUpperCase() === 'PRODUCTION'
        ? 'https://api.ebay.com/identity/v1/oauth2/token'
        : 'https://api.sandbox.ebay.com/identity/v1/oauth2/token';

    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${auth}`
        },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            scope: 'https://api.ebay.com/oauth/api_scope' // Standard application scope
        })
    });

    if (!response.ok) {
        const error = await response.json();
        console.error('[eBay OAuth] Token exchange failed:', error);
        throw new Error(`eBay OAuth error: ${error.error_description || response.statusText}`);
    }

    const data: EbayTokenResponse = await response.json();
    
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000);

    console.log('[eBay OAuth] Successfully obtained new access token');
    return cachedToken;
}
