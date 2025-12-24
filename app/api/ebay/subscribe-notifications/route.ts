/**
 * API Endpoint: Subscribe to eBay Notifications
 * POST /api/ebay/subscribe-notifications
 * 
 * Subscribes the authenticated user to eBay platform notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { subscribeUserToNotifications } from '@/services/ebay/notification-service';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();

        // Get authenticated user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Subscribe user to notifications
        const result = await subscribeUserToNotifications(user.id);

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: result.message,
                details: result.details,
            });
        } else {
            return NextResponse.json(
                {
                    success: false,
                    error: result.message,
                },
                { status: 400 }
            );
        }
    } catch (error: any) {
        console.error('[Subscribe Notifications API] Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Internal server error',
            },
            { status: 500 }
        );
    }
}
