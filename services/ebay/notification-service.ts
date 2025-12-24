/**
 * eBay Notification Service
 * Manages eBay Platform Notification subscriptions for users
 * Uses Trading API SetNotificationPreferences to subscribe to events
 */

import { createServerClient } from '@/lib/supabase/server';

interface NotificationPreference {
    eventType: string;
    eventEnable: 'Enable' | 'Disable';
}

/**
 * Available eBay notification event types
 */
export const EBAY_EVENTS = {
    // Listing Events
    ITEM_LISTED: 'ItemListed',
    ITEM_REVISED: 'ItemRevised',
    ITEM_ENDED: 'ItemEnded',
    ITEM_SOLD: 'ItemSold',

    // Order Events
    FIXED_PRICE_TRANSACTION: 'FixedPriceTransaction',
    ORDER_SHIPPED: 'OrderShipped',
    ORDER_CANCELLED: 'OrderCancelled',

    // Account Events
    USER_ACCOUNT_DELETION: 'UserAccountDeletion',

    // Feedback Events
    FEEDBACK_RECEIVED: 'FeedbackReceived',
    FEEDBACK_LEFT: 'FeedbackLeft',
} as const;

/**
 * Default events to subscribe all users to
 */
const DEFAULT_SUBSCRIPTIONS: NotificationPreference[] = [
    { eventType: EBAY_EVENTS.ITEM_SOLD, eventEnable: 'Enable' },
    { eventType: EBAY_EVENTS.FIXED_PRICE_TRANSACTION, eventEnable: 'Enable' },
    { eventType: EBAY_EVENTS.ORDER_SHIPPED, eventEnable: 'Enable' },
    { eventType: EBAY_EVENTS.USER_ACCOUNT_DELETION, eventEnable: 'Enable' },
    { eventType: EBAY_EVENTS.ITEM_LISTED, eventEnable: 'Enable' },
    { eventType: EBAY_EVENTS.ITEM_REVISED, eventEnable: 'Enable' },
    { eventType: EBAY_EVENTS.ITEM_ENDED, eventEnable: 'Enable' },
];

/**
 * Build XML request for SetNotificationPreferences
 */
function buildSetNotificationPreferencesXML(
    token: string,
    preferences: NotificationPreference[]
): string {
    const preferencesXML = preferences
        .map(
            (pref) => `
    <NotificationEnable>
      <EventType>${pref.eventType}</EventType>
      <EventEnable>${pref.eventEnable}</EventEnable>
    </NotificationEnable>`
        )
        .join('');

    return `<?xml version="1.0" encoding="utf-8"?>
<SetNotificationPreferencesRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <RequesterCredentials>
    <eBayAuthToken>${token}</eBayAuthToken>
  </RequesterCredentials>
  <ApplicationDeliveryPreferences>
    <ApplicationEnable>Enable</ApplicationEnable>
    <ApplicationURL>https://artintel-onks3ggkp-rays-projects-f998311b.vercel.app/api/ebay/notifications</ApplicationURL>
    <DeliveryURLDetails>
      <DeliveryURLName>ArtIntel Production</DeliveryURLName>
      <DeliveryURL>https://artintel-onks3ggkp-rays-projects-f998311b.vercel.app/api/ebay/notifications</DeliveryURL>
      <Status>Enable</Status>
    </DeliveryURLDetails>
  </ApplicationDeliveryPreferences>
  <UserDeliveryPreferenceArray>${preferencesXML}
  </UserDeliveryPreferenceArray>
  <ErrorLanguage>en_US</ErrorLanguage>
  <WarningLevel>High</WarningLevel>
</SetNotificationPreferencesRequest>`;
}

/**
 * Subscribe a user to eBay notifications
 */
export async function subscribeUserToNotifications(
    userId: string,
    customPreferences?: NotificationPreference[]
): Promise<{ success: boolean; message: string; details?: any }> {
    try {
        const supabase = await createServerClient();

        // Get user's eBay token
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('ebay_access_token, ebay_user_id, email')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            return {
                success: false,
                message: 'User not found',
            };
        }

        if (!user.ebay_access_token) {
            return {
                success: false,
                message: 'User has not connected their eBay account',
            };
        }

        // Use custom preferences or defaults
        const preferences = customPreferences || DEFAULT_SUBSCRIPTIONS;

        // Build XML request
        const xmlRequest = buildSetNotificationPreferencesXML(
            user.ebay_access_token,
            preferences
        );

        // Determine API endpoint based on environment
        const isProduction = process.env.EBAY_ENVIRONMENT === 'production';
        const apiEndpoint = isProduction
            ? 'https://api.ebay.com/ws/api.dll'
            : 'https://api.sandbox.ebay.com/ws/api.dll';

        // Make API call
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'X-EBAY-API-COMPATIBILITY-LEVEL': '1173',
                'X-EBAY-API-CALL-NAME': 'SetNotificationPreferences',
                'X-EBAY-API-SITEID': '0',
                'Content-Type': 'text/xml',
            },
            body: xmlRequest,
        });

        const responseText = await response.text();

        // Parse response
        const ackMatch = responseText.match(/<Ack>(.*?)<\/Ack>/);
        const ack = ackMatch ? ackMatch[1] : 'Unknown';

        if (ack === 'Success' || ack === 'Warning') {
            // Log successful subscription
            await supabase.from('audit_logs').insert({
                user_id: userId,
                action: 'ebay_notifications_subscribed',
                details: {
                    ebay_user_id: user.ebay_user_id,
                    events: preferences.map((p) => p.eventType),
                    environment: isProduction ? 'production' : 'sandbox',
                },
                created_at: new Date().toISOString(),
            });

            return {
                success: true,
                message: 'Successfully subscribed to eBay notifications',
                details: {
                    ack,
                    events: preferences.map((p) => p.eventType),
                },
            };
        } else {
            // Extract error message
            const errorMatch = responseText.match(
                /<LongMessage>(.*?)<\/LongMessage>/
            );
            const errorMessage = errorMatch
                ? errorMatch[1]
                : 'Unknown error from eBay API';

            console.error('[eBay Notifications] Subscription failed:', {
                ack,
                error: errorMessage,
                response: responseText.substring(0, 500),
            });

            return {
                success: false,
                message: `eBay API error: ${errorMessage}`,
                details: { ack, errorMessage },
            };
        }
    } catch (error: any) {
        console.error('[eBay Notifications] Error:', error);
        return {
            success: false,
            message: error.message || 'Failed to subscribe to notifications',
        };
    }
}

/**
 * Unsubscribe a user from all eBay notifications
 */
export async function unsubscribeUserFromNotifications(
    userId: string
): Promise<{ success: boolean; message: string }> {
    try {
        const supabase = await createServerClient();

        // Get user's eBay token
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('ebay_access_token, ebay_user_id')
            .eq('id', userId)
            .single();

        if (userError || !user || !user.ebay_access_token) {
            return {
                success: false,
                message: 'User not found or not connected to eBay',
            };
        }

        // Disable all events
        const disablePreferences: NotificationPreference[] = Object.values(
            EBAY_EVENTS
        ).map((eventType) => ({
            eventType,
            eventEnable: 'Disable',
        }));

        const xmlRequest = buildSetNotificationPreferencesXML(
            user.ebay_access_token,
            disablePreferences
        );

        const isProduction = process.env.EBAY_ENVIRONMENT === 'production';
        const apiEndpoint = isProduction
            ? 'https://api.ebay.com/ws/api.dll'
            : 'https://api.sandbox.ebay.com/ws/api.dll';

        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'X-EBAY-API-COMPATIBILITY-LEVEL': '1173',
                'X-EBAY-API-CALL-NAME': 'SetNotificationPreferences',
                'X-EBAY-API-SITEID': '0',
                'Content-Type': 'text/xml',
            },
            body: xmlRequest,
        });

        const responseText = await response.text();
        const ackMatch = responseText.match(/<Ack>(.*?)<\/Ack>/);
        const ack = ackMatch ? ackMatch[1] : 'Unknown';

        if (ack === 'Success' || ack === 'Warning') {
            await supabase.from('audit_logs').insert({
                user_id: userId,
                action: 'ebay_notifications_unsubscribed',
                details: {
                    ebay_user_id: user.ebay_user_id,
                },
                created_at: new Date().toISOString(),
            });

            return {
                success: true,
                message: 'Successfully unsubscribed from eBay notifications',
            };
        } else {
            return {
                success: false,
                message: 'Failed to unsubscribe from eBay notifications',
            };
        }
    } catch (error: any) {
        console.error('[eBay Notifications] Unsubscribe error:', error);
        return {
            success: false,
            message: error.message || 'Failed to unsubscribe',
        };
    }
}

/**
 * Get current notification preferences for a user
 */
export async function getUserNotificationPreferences(userId: string) {
    try {
        const supabase = await createServerClient();

        const { data: user, error: userError } = await supabase
            .from('users')
            .select('ebay_access_token')
            .eq('id', userId)
            .single();

        if (userError || !user || !user.ebay_access_token) {
            return {
                success: false,
                message: 'User not found or not connected to eBay',
            };
        }

        const xmlRequest = `<?xml version="1.0" encoding="utf-8"?>
<GetNotificationPreferencesRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <RequesterCredentials>
    <eBayAuthToken>${user.ebay_access_token}</eBayAuthToken>
  </RequesterCredentials>
  <PreferenceLevel>User</PreferenceLevel>
  <ErrorLanguage>en_US</ErrorLanguage>
  <WarningLevel>High</WarningLevel>
</GetNotificationPreferencesRequest>`;

        const isProduction = process.env.EBAY_ENVIRONMENT === 'production';
        const apiEndpoint = isProduction
            ? 'https://api.ebay.com/ws/api.dll'
            : 'https://api.sandbox.ebay.com/ws/api.dll';

        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'X-EBAY-API-COMPATIBILITY-LEVEL': '1173',
                'X-EBAY-API-CALL-NAME': 'GetNotificationPreferences',
                'X-EBAY-API-SITEID': '0',
                'Content-Type': 'text/xml',
            },
            body: xmlRequest,
        });

        const responseText = await response.text();

        return {
            success: true,
            data: responseText,
        };
    } catch (error: any) {
        console.error('[eBay Notifications] Get preferences error:', error);
        return {
            success: false,
            message: error.message,
        };
    }
}
