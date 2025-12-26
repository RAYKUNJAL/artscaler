'use client';

import { useState, useEffect } from 'react';
import { Check, Zap, Crown, Rocket, Star, Eye, Palette } from 'lucide-react';
import { PaymentService, type BillingCycle } from '@/lib/payments/payment-service';
import { createClient } from '@/lib/supabase/client';
import { PayPalButtons } from "@paypal/react-paypal-js";

export default function PricingPage() {
    const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [mounted, setMounted] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        setMounted(true);
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) setUser(user);
        });
    }, []);

    const plans = [
        {
            id: 'free',
            name: 'Free Scout',
            icon: Eye,
            price: { monthly: 0, yearly: 0 },
            description: 'Perfect for exploring the platform',
            features: [
                '10 daily searches',
                '3 keyword tracking',
                '7 days historical data',
                'Standard WVS access',
                'Community support'
            ],
            cta: 'Get Started Free',
            popular: false,
            color: 'from-gray-600 to-gray-700'
        },
        {
            id: 'pro',
            name: 'Pro Painter',
            icon: Palette,
            price: { monthly: 29, yearly: 290 },
            description: 'For serious artists starting to scale',
            features: [
                '100 daily searches',
                '25 keyword tracking',
                '30 days historical data',
                'Global Market Pulse',
                'AI Market Advisor',
                'Smart alerts'
            ],
            cta: 'Start Pro Plan',
            popular: true,
            color: 'from-blue-600 to-blue-700'
        },
        {
            id: 'studio',
            name: 'Studio Empire',
            icon: Rocket,
            price: { monthly: 79, yearly: 790 },
            description: 'For established studios & galleries',
            features: [
                '1,000 daily searches',
                'Unlimited keyword tracking',
                'Full historical data',
                'Full AI Pipeline access',
                'AI Market Advisor',
                'Auto-listing generation'
            ],
            cta: 'Upgrade to Studio+',
            popular: false,
            color: 'from-purple-600 to-purple-700'
        }
    ];

    const handleSubscriptionSuccess = async (data: any) => {
        setIsProcessing(true);
        try {
            const response = await fetch('/api/webhook/paypal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderID: data.orderID,
                    subscriptionID: data.subscriptionID,
                    userId: user?.id,
                    tierId: selectedPlan?.id
                })
            });

            if (response.ok) {
                window.location.href = '/dashboard?success=true';
            } else {
                throw new Error('Failed to verify subscription');
            }
        } catch (error) {
            console.error('PayPal success handler error:', error);
            alert('There was an error activating your subscription. Please contact support.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSelectPlan = (planId: string) => {
        if (planId === 'free') {
            window.location.href = '/auth/signup';
            return;
        }
        const plan = plans.find(p => p.id === planId);
        setSelectedPlan(plan);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-20 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-black text-white mb-4">
                        Choose Your <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Pulse Plan</span>
                    </h1>
                    <p className="text-xl text-gray-300 mb-8">
                        Scale your eBay art business with real-time demand intelligence
                    </p>

                    {/* Billing Toggle */}
                    <div className="inline-flex items-center gap-4 bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-2">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-6 py-3 rounded-xl font-bold transition-all ${billingCycle === 'monthly'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle('yearly')}
                            className={`px-6 py-3 rounded-xl font-bold transition-all relative ${billingCycle === 'yearly'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Yearly
                            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                SAVE 17%
                            </span>
                        </button>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {plans.map((plan) => {
                        const Icon = plan.icon;
                        const price = billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly;
                        const savings = plan.id !== 'free' ? PaymentService.calculateYearlySavings(plan.id) : 0;

                        return (
                            <div
                                key={plan.id}
                                className={`relative bg-gray-900/50 backdrop-blur-xl border ${plan.popular ? 'border-blue-500 shadow-2xl shadow-blue-500/20' : 'border-gray-800'
                                    } rounded-3xl p-8 flex flex-col transition-all hover:scale-105`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider">
                                        Most Popular
                                    </div>
                                )}

                                <div className={`w-14 h-14 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center mb-4`}>
                                    <Icon className="h-7 w-7 text-white" />
                                </div>

                                <h3 className="text-2xl font-black text-white mb-2">{plan.name}</h3>
                                <p className="text-gray-400 text-sm mb-6">{plan.description}</p>

                                <div className="mb-6">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-black text-white">${price}</span>
                                        <span className="text-gray-500">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                                    </div>
                                    {billingCycle === 'yearly' && savings > 0 && (
                                        <p className="text-green-400 text-sm font-bold mt-2">Save ${savings}/year</p>
                                    )}
                                </div>

                                <ul className="space-y-3 mb-8 flex-1">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-3 text-gray-300 text-sm">
                                            <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                {selectedPlan?.id === plan.id && plan.id !== 'free' ? (
                                    <div className="mt-auto pt-6">
                                        <PayPalButtons
                                            style={{ layout: "vertical", shape: "pill", label: "subscribe" }}
                                            createSubscription={(data: any, actions: any) => {
                                                const planIds = PaymentService.getPlans().then(plans => {
                                                    const p = plans.find(p => p.tier_id === plan.id);
                                                    return billingCycle === 'monthly' ? p?.paypal_plan_id_monthly : p?.paypal_plan_id_yearly;
                                                });

                                                return planIds.then(id => {
                                                    if (!id) throw new Error("Plan ID not found");
                                                    return actions.subscription.create({
                                                        'plan_id': id
                                                    });
                                                });
                                            }}
                                            onApprove={async (data: any, actions: any) => {
                                                await handleSubscriptionSuccess(data);
                                            }}
                                        />
                                        <button
                                            onClick={() => setSelectedPlan(null)}
                                            className="w-full mt-2 text-xs text-gray-500 hover:text-white transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleSelectPlan(plan.id)}
                                        className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all mt-auto ${plan.popular
                                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-2xl hover:shadow-blue-500/50'
                                            : 'bg-gray-800 text-white hover:bg-gray-700'
                                            }`}
                                    >
                                        {plan.cta}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* FAQ Section */}
                <div className="mt-16 text-center">
                    <h3 className="text-2xl font-bold text-white mb-8">Frequently Asked Questions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
                            <h4 className="font-bold text-white mb-2">Can I deactivate my subscription?</h4>
                            <p className="text-gray-400 text-sm">Yes! You can cancel anytime from your settings page.</p>
                        </div>
                        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
                            <h4 className="font-bold text-white mb-2">What payment methods do you accept?</h4>
                            <p className="text-gray-400 text-sm">We securely process all payments via PayPal.</p>
                        </div>
                        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
                            <h4 className="font-bold text-white mb-2">Is there a free trial?</h4>
                            <p className="text-gray-400 text-sm">The Free Scout plan is available forever. No credit card required.</p>
                        </div>
                        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
                            <h4 className="font-bold text-white mb-2">Can I cancel anytime?</h4>
                            <p className="text-gray-400 text-sm">Absolutely. Cancel with one click in your PayPal dashboard or settings.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
