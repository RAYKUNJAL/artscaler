/**
 * eBay OAuth 2.0 Service
 * Handles Client Credentials flow for application-level API access
 */

export interface EbayTokenResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
    refresh_token?: string;
    refresh_token_expires_in?: number;
}

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Client Credentials Flow (Application Token)
 */
export async function getEbayAccessToken(): Promise<string> {
    const clientId = process.env.EBAY_CLIENT_ID;
    const clientSecret = process.env.EBAY_CLIENT_SECRET;
    const environment = (process.env.EBAY_ENVIRONMENT || 'SANDBOX').toUpperCase();

    if (!clientId || !clientSecret) {
        throw new Error('eBay credentials (CLIENT_ID, CLIENT_SECRET) not configured');
    }

    // Check for manual user token override
    const userToken = process.env.EBAY_USER_TOKEN;
    if (userToken && userToken !== '') {
        return userToken;
    }

    if (cachedToken && Date.now() < tokenExpiry - 60000) {
        return cachedToken;
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenUrl = environment === 'PRODUCTION'
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
            scope: 'https://api.ebay.com/oauth/api_scope'
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`eBay OAuth error: ${error.error_description || response.statusText}`);
    }

    const data: EbayTokenResponse = await response.json();
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000);

    return cachedToken;
}

/**
 * Generate Consent URL for User OAuth Flow
 */
export function getUserAuthUrl(): string {
    const clientId = process.env.EBAY_CLIENT_ID;
    const runame = process.env.EBAY_RU_NAME;
    const environment = (process.env.EBAY_ENVIRONMENT || 'SANDBOX').toUpperCase();

    const baseUrl = environment === 'PRODUCTION'
        ? 'https://auth.ebay.com/oauth2/authorize'
        : 'https://auth.sandbox.ebay.com/oauth2/authorize';

    const scopes = [
        'https://api.ebay.com/oauth/api_scope/sell.analytics.readonly',
        'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
        'https://api.ebay.com/oauth/api_scope/sell.marketing.readonly'
    ].join(' ');

    const params = new URLSearchParams({
        client_id: clientId!,
        redirect_uri: runame!,
        response_type: 'code',
        scope: scopes,
        prompt: 'login'
    });

    return `${baseUrl}?${params.toString()}`;
}

/**
 * Exchange Auth Code for User Tokens
 */
export async function exchangeCodeForUserToken(code: string): Promise<EbayTokenResponse> {
    const clientId = process.env.EBAY_CLIENT_ID;
    const clientSecret = process.env.EBAY_CLIENT_SECRET;
    const runame = process.env.EBAY_RU_NAME;
    const environment = (process.env.EBAY_ENVIRONMENT || 'SANDBOX').toUpperCase();

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenUrl = environment === 'PRODUCTION'
        ? 'https://api.ebay.com/identity/v1/oauth2/token'
        : 'https://api.sandbox.ebay.com/identity/v1/oauth2/token';

    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${auth}`
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: runame!
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`eBay User OAuth error: ${error.error_description || response.statusText}`);
    }

    return await response.json();
}

/**
 * Refresh expired User Token
 */
export async function refreshUserToken(refreshToken: string): Promise<EbayTokenResponse> {
    const clientId = process.env.EBAY_CLIENT_ID;
    const clientSecret = process.env.EBAY_CLIENT_SECRET;
    const environment = (process.env.EBAY_ENVIRONMENT || 'SANDBOX').toUpperCase();

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenUrl = environment === 'PRODUCTION'
        ? 'https://api.ebay.com/identity/v1/oauth2/token'
        : 'https://api.sandbox.ebay.com/identity/v1/oauth2/token';

    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${auth}`
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            scope: 'https://api.ebay.com/oauth/api_scope/sell.analytics.readonly https://api.ebay.com/oauth/api_scope/sell.inventory.readonly'
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`eBay Refresh error: ${error.error_description || response.statusText}`);
    }

    return await response.json();
}
