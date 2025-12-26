'use client';

import { useState, useEffect } from 'react';
import { Check, Zap, Crown, Rocket, Star, Eye, Palette, Shield } from 'lucide-react';
import Header from '@/components/layout/Header';
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
            name: 'Scout Lite',
            icon: Eye,
            price: { monthly: 0, yearly: 0 },
            description: 'Trial the pulse with essential scans.',
            features: [
                '10 Market Scans / day',
                'Visual Pulse Preview',
                'Basic WVS Signals',
                'Community Data Stream',
                'Price Guide Access'
            ],
            cta: 'Start Scouting',
            popular: false,
            color: 'from-gray-700 to-gray-800'
        },
        {
            id: 'solo',
            name: 'Solo Artist',
            icon: Star,
            price: { monthly: 29, yearly: 290 },
            description: 'For artists building their eBay presence.',
            features: [
                '100 Market Scans / day',
                'Full WVS Demand Scores',
                'Smart Pricing Models',
                '30-Day Market History',
                'Growth Engine Planner'
            ],
            cta: 'Scale Now',
            popular: false,
            color: 'from-blue-600 to-blue-700'
        },
        {
            id: 'studio',
            name: 'Studio Pro',
            icon: Shield,
            price: { monthly: 79, yearly: 790 },
            description: 'The standard for professional art studios.',
            features: [
                'Unlimited Market Scans',
                'Advanced Niche Clusters',
                'Competitor Spy Tools',
                'Auto-Niche Discovery',
                'Revenue Simulation PRO'
            ],
            cta: 'Dominate Market',
            popular: true,
            color: 'from-purple-600 to-purple-700'
        },
        {
            id: 'empire',
            name: 'Empire Scale',
            icon: Zap,
            price: { monthly: 199, yearly: 1990 },
            description: 'Full Art Intelligence dominance.',
            features: [
                'Full Empire Automation',
                'AI Listing Generation',
                'Custom Brief Intelligence',
                'Elite Studio Analytics',
                'Priority API Infrastructure'
            ],
            cta: 'Build Empire',
            popular: false,
            color: 'from-orange-500 to-orange-600'
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
        <div className="min-h-screen bg-gray-950 selection:bg-blue-500 selection:text-white">
            <Header />

            <div className="relative pt-32 pb-24 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full -z-10"></div>

                <div className="max-w-7xl mx-auto px-4">
                    {/* Hero Header */}
                    <div className="text-center mb-20">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/10 border border-blue-600/20 rounded-full mb-6">
                            <Zap className="h-4 w-4 text-blue-500" />
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Pricing & Plans</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter uppercase italic leading-[0.9]">
                            Choose Your <span className="text-blue-500">Pulse</span> Level
                        </h1>
                        <p className="text-xl text-gray-400 font-bold max-w-2xl mx-auto mb-8">
                            Unlock the #1 intelligence platform for eBay art sellers and scale your revenue today.
                        </p>

                        <div className="flex flex-col items-center gap-4">
                            <div className="inline-flex items-center p-1.5 bg-gray-900 border border-white/5 rounded-2xl">
                                <button
                                    onClick={() => setBillingCycle('monthly')}
                                    className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${billingCycle === 'monthly'
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'text-gray-500 hover:text-white'
                                        }`}
                                >
                                    Monthly
                                </button>
                                <button
                                    onClick={() => setBillingCycle('yearly')}
                                    className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative ${billingCycle === 'yearly'
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'text-gray-500 hover:text-white'
                                        }`}
                                >
                                    Yearly
                                    <span className="absolute -top-3 -right-3 bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-lg shadow-green-500/20">
                                        SAVE 20%
                                    </span>
                                </button>
                            </div>
                            <p className="text-amber-500 font-black uppercase tracking-[0.2em] text-xs">
                                Includes 90-Day Money-Back Guarantee
                            </p>
                        </div>
                    </div>

                    {/* Pricing Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
                        {plans.map((plan) => {
                            const Icon = plan.icon;
                            const price = billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly;

                            return (
                                <div
                                    key={plan.id}
                                    className={`relative bg-gray-900 border ${plan.popular ? 'border-blue-500 shadow-2xl shadow-blue-500/20 scale-105' : 'border-white/5'
                                        } rounded-[32px] p-8 flex flex-col transition-all hover:-translate-y-2 group`}
                                >
                                    {plan.popular && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
                                            Recommended
                                        </div>
                                    )}

                                    <div className={`w-12 h-12 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
                                        <Icon className="h-6 w-6 text-white" />
                                    </div>

                                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-2">{plan.name}</h3>
                                    <p className="text-gray-500 text-xs font-bold leading-relaxed mb-6 uppercase tracking-wider">{plan.description}</p>

                                    <div className="mb-8">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-5xl font-black text-white">${price}</span>
                                            <span className="text-gray-600 font-black uppercase text-xs tracking-widest">
                                                /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                                            </span>
                                        </div>
                                    </div>

                                    <ul className="space-y-4 mb-8 flex-1">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-3 text-gray-400 text-xs font-bold leading-relaxed">
                                                <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                                <span className="uppercase tracking-wide">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {selectedPlan?.id === plan.id && plan.id !== 'free' ? (
                                        <div className="mt-auto space-y-4">
                                            <PayPalButtons
                                                style={{ layout: "vertical", shape: "rect", label: "subscribe" }}
                                                createSubscription={(data: any, actions: any) => {
                                                    const planPromise = PaymentService.getPlans().then(availablePlans => {
                                                        const p = availablePlans.find(planItem => planItem.tier_id === plan.id);
                                                        return billingCycle === 'monthly' ? p?.paypal_plan_id_monthly : p?.paypal_plan_id_yearly;
                                                    });

                                                    return planPromise.then(id => {
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
                                                className="w-full text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-widest text-center transition-colors"
                                            >
                                                Switch Plan
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleSelectPlan(plan.id)}
                                            className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all mt-auto ${plan.popular
                                                ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-xl shadow-blue-600/20'
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

                    {/* Trust Signals Section */}
                    <div className="bg-gray-900 border border-gray-800 rounded-[48px] p-8 md:p-16 mb-24 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/5 blur-[80px] rounded-full"></div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center relative z-10">
                            <div>
                                <h3 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter mb-6">
                                    The "No-Friction" <br /> ArtScaler Guarantee
                                </h3>
                                <p className="text-gray-400 font-bold mb-8 leading-relaxed">
                                    We're so confident ArtScaler will pay for itself within your first month that we offer an industry-leading 90-day guarantee.
                                    If you don't spot high-profit opportunities, get a full refund. No questions asked.
                                </p>
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-3xl font-black text-white mb-2">90%+</p>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Accuracy Lead</p>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-black text-white mb-2">24/7</p>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Market Monitoring</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-800/50 border border-white/5 rounded-[32px] p-8 space-y-6">
                                <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4">Enterprise-Grade Security</h4>
                                {[
                                    "Bank-level data encryption",
                                    "Official eBay API verification",
                                    "Secured PayPal checkout",
                                    "No hidden fees or contracts"
                                ].map(item => (
                                    <div key={item} className="flex items-center gap-4 text-xs font-bold text-gray-300 uppercase tracking-wide">
                                        <Check className="h-4 w-4 text-blue-500" />
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Simple FAQ */}
                    <div className="max-w-3xl mx-auto space-y-6">
                        <h4 className="text-center text-xl font-black text-white uppercase italic tracking-tighter mb-12">Intelligence FAQ</h4>
                        {[
                            { q: "Can I cancel anytime?", a: "Yes, you have full control. One-click cancellation from your dashboard." },
                            { q: "What is WVS Scoring?", a: "Watch Velocity Score is our proprietary AI signal that measures real buyer demand." },
                            { q: "Does this include international eBay data?", a: "Currently we support eBay US, with UK and EU coming in Q1 2026." }
                        ].map((faq, idx) => (
                            <div key={idx} className="bg-gray-900 border border-white/5 rounded-2xl p-6">
                                <h5 className="text-sm font-black text-white uppercase tracking-wider mb-2">{faq.q}</h5>
                                <p className="text-xs font-bold text-gray-500 leading-relaxed uppercase tracking-wide">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
