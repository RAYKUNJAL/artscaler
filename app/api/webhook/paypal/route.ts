import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

/**
 * PayPal Webhook Handler
 * Handles subscription lifecycle events and frontend activation callbacks
 */

// Verify PayPal webhook signature
function verifyWebhookSignature(
    transmissionId: string,
    transmissionTime: string,
    webhookId: string,
    eventBody: string,
    certUrl: string,
    transmissionSig: string,
    actualSig: string
): boolean {
    // In production, implement full PayPal webhook verification
    // For now, we'll do basic validation
    const webhookIdEnv = process.env.PAYPAL_WEBHOOK_ID;

    // If webhook ID is configured, verify it matches
    if (webhookIdEnv && webhookId !== webhookIdEnv) {
        console.error('[PayPal] Webhook ID mismatch');
        return false;
    }

    return true;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Check if this is a webhook event or frontend callback
        const isWebhook = body.event_type !== undefined;

        if (isWebhook) {
            // Handle PayPal webhook event
            return handleWebhookEvent(request, body);
        } else {
            // Handle frontend activation callback
            return handleFrontendCallback(body);
        }
    } catch (error: any) {
        console.error('[PayPal] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function handleFrontendCallback(body: any) {
    const { orderID, subscriptionID, userId, tierId } = body;

    if (!userId || !tierId || !subscriptionID) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log(`[PayPal] Activating tier ${tierId} for user ${userId}`);

    // Update user profile
    const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
            subscription_tier: tierId,
            subscription_status: 'active'
        })
        .eq('id', userId);

    if (profileError) throw profileError;

    // Record in subscriptions table
    const { error: subError } = await supabase
        .from('user_subscriptions')
        .upsert({
            user_id: userId,
            paypal_subscription_id: subscriptionID,
            status: 'active',
            payment_gateway: 'paypal',
            current_period_end: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString()
        }, { onConflict: 'user_id' });

    if (subError) throw subError;

    return NextResponse.json({ success: true });
}

async function handleWebhookEvent(request: NextRequest, body: any) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const eventType = body.event_type;
    const resource = body.resource;

    console.log(`[PayPal Webhook] Event: ${eventType}`);

    // Handle different webhook events
    switch (eventType) {
        case 'BILLING.SUBSCRIPTION.ACTIVATED':
            await handleSubscriptionActivated(supabase, resource);
            break;

        case 'BILLING.SUBSCRIPTION.CANCELLED':
            await handleSubscriptionCancelled(supabase, resource);
            break;

        case 'BILLING.SUBSCRIPTION.SUSPENDED':
            await handleSubscriptionSuspended(supabase, resource);
            break;

        case 'BILLING.SUBSCRIPTION.EXPIRED':
            await handleSubscriptionExpired(supabase, resource);
            break;

        case 'PAYMENT.SALE.COMPLETED':
            await handlePaymentCompleted(supabase, resource);
            break;

        case 'BILLING.SUBSCRIPTION.UPDATED':
            await handleSubscriptionUpdated(supabase, resource);
            break;

        default:
            console.log(`[PayPal Webhook] Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ received: true });
}

async function handleSubscriptionActivated(supabase: any, resource: any) {
    const subscriptionId = resource.id;

    const { data: sub } = await supabase
        .from('user_subscriptions')
        .select('user_id')
        .eq('paypal_subscription_id', subscriptionId)
        .single();

    if (sub) {
        await supabase
            .from('user_subscriptions')
            .update({ status: 'active' })
            .eq('paypal_subscription_id', subscriptionId);

        await supabase
            .from('user_profiles')
            .update({ subscription_status: 'active' })
            .eq('id', sub.user_id);
    }
}

async function handleSubscriptionCancelled(supabase: any, resource: any) {
    const subscriptionId = resource.id;

    const { data: sub } = await supabase
        .from('user_subscriptions')
        .select('user_id')
        .eq('paypal_subscription_id', subscriptionId)
        .single();

    if (sub) {
        await supabase
            .from('user_subscriptions')
            .update({
                status: 'cancelled',
                cancel_at_period_end: true
            })
            .eq('paypal_subscription_id', subscriptionId);

        await supabase
            .from('user_profiles')
            .update({ subscription_status: 'cancelled' })
            .eq('id', sub.user_id);
    }
}

async function handleSubscriptionSuspended(supabase: any, resource: any) {
    const subscriptionId = resource.id;

    const { data: sub } = await supabase
        .from('user_subscriptions')
        .select('user_id')
        .eq('paypal_subscription_id', subscriptionId)
        .single();

    if (sub) {
        await supabase
            .from('user_subscriptions')
            .update({ status: 'past_due' })
            .eq('paypal_subscription_id', subscriptionId);

        await supabase
            .from('user_profiles')
            .update({
                subscription_status: 'past_due',
                subscription_tier: 'free' // Downgrade to free tier
            })
            .eq('id', sub.user_id);
    }
}

async function handleSubscriptionExpired(supabase: any, resource: any) {
    const subscriptionId = resource.id;

    const { data: sub } = await supabase
        .from('user_subscriptions')
        .select('user_id')
        .eq('paypal_subscription_id', subscriptionId)
        .single();

    if (sub) {
        await supabase
            .from('user_subscriptions')
            .update({ status: 'expired' })
            .eq('paypal_subscription_id', subscriptionId);

        await supabase
            .from('user_profiles')
            .update({
                subscription_status: 'expired',
                subscription_tier: 'free'
            })
            .eq('id', sub.user_id);
    }
}

async function handlePaymentCompleted(supabase: any, resource: any) {
    const subscriptionId = resource.billing_agreement_id;

    if (subscriptionId) {
        await supabase
            .from('user_subscriptions')
            .update({
                status: 'active',
                current_period_end: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString()
            })
            .eq('paypal_subscription_id', subscriptionId);
    }
}

async function handleSubscriptionUpdated(supabase: any, resource: any) {
    const subscriptionId = resource.id;

    console.log(`[PayPal] Subscription ${subscriptionId} updated`);
    // Handle plan changes, billing cycle updates, etc.
}
