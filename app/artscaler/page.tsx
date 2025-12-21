'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
    Trophy,
    Target,
    Calendar,
    DollarSign,
    BarChart3,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Layout,
    Zap,
    ShieldCheck,
    Layers,
    Clock,
    Palette,
    TrendingUp
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface TierData {
    name: string;
    timeline: string;
    feedback: string;
    focus: string;
    ebay_limits: { listings: number | string; value: number | string };
    daily_target: number | string;
    monthly_revenue: number;
    monthly_profit: number;
    strategy: string;
    schedule: { day: string; tasks: string[] }[];
    inventory: {
        item: string;
        price: number | string;
        format: string;
        subjects: string[];
    };
}

const ARTSCALE_DATA: Record<string, TierData> = {
    tier_1: {
        name: "Tier 1: Foundation Builder",
        timeline: "Months 1-3",
        feedback: "0-100",
        focus: "Feedback velocity through low-risk ACEO volume",
        ebay_limits: { listings: 10, value: 500 },
        daily_target: 1.1,
        monthly_revenue: 825,
        monthly_profit: 420,
        strategy: "feedback through ACEO (instant payment only)",
        schedule: [
            { day: "Mon", tasks: ["Paint 10 ACEOs", "List Previous week"] },
            { day: "Tue", tasks: ["Paint 10 ACEOs", "Pack & Ship"] },
            { day: "Wed", tasks: ["Paint 10 ACEOs", "Customer Service"] },
            { day: "Thu-Fri", tasks: ["OFF - Avoid Burnout"] }
        ],
        inventory: {
            item: "ACEO Miniatures",
            price: 25,
            format: "Buy It Now ONLY",
            subjects: ["Highland Cow", "Barn Owl", "Farmhouse icons"]
        }
    },
    tier_2: {
        name: "Tier 2: Intermediate Scaler",
        timeline: "Months 4-9",
        feedback: "100-500",
        focus: "Volume Scaler + Auction Testing",
        ebay_limits: { listings: "50-100", value: "5000-10000" },
        daily_target: 4,
        monthly_revenue: 18454,
        monthly_profit: 13157,
        strategy: "Shift to 9x12 + 10-Day Auctions",
        schedule: [
            { day: "Mon-Tue", tasks: ["Paint 3x 9x12 + 2 ACEOs"] },
            { day: "Wed", tasks: ["Photo/Edit all work"] },
            { day: "Thu", tasks: ["List 5 BIN + Launch 10 Auctions"] },
            { day: "Sat-Sun", tasks: ["Shipping & Auction Ends"] }
        ],
        inventory: {
            item: "Mixed (9x12 Primary)",
            price: 175,
            format: "Hybrid (BIN + Auction)",
            subjects: ["H-Cows", "Owls", "Rooster", "Sunflowers"]
        }
    },
    tier_3: {
        name: "Tier 3: $20K Revenue Engine",
        timeline: "Months 10+",
        feedback: "500+",
        focus: "Sustainable Full-Time Artist Income",
        ebay_limits: { listings: "500+", value: "50000+" },
        daily_target: "Top Rated Plus",
        monthly_revenue: 21592,
        monthly_profit: 16402,
        strategy: "Top Rated Plus Excellence",
        schedule: [
            { day: "Daily", tasks: ["Paint 4x 10x12 or Premium 11x14"] },
            { day: "Thu Evening", tasks: ["Launch Auction Benches"] },
            { day: "Saturday", tasks: ["Bulk Shipping Ops"] }
        ],
        inventory: {
            item: "Full Catalog",
            price: "185 - 315",
            format: "Strategic Hybrid (65% BIN / 35% Auction)",
            subjects: ["Mastery of Cow/Owl Variations"]
        }
    }
};

export default function ArtScalerPage() {
    const [currentTier, setCurrentTier] = useState<keyof typeof ARTSCALE_DATA>('tier_1');
    const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(7);
    const [userStats, setUserStats] = useState({ feedback: 0, sales: 0 });

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profile) {
                // Determine tier based on feedback
                const feedback = profile.ebay_feedback_score || 0;
                setUserStats({ feedback, sales: 0 }); // Fetch sales from listings later

                if (feedback >= 500) setCurrentTier('tier_3');
                else if (feedback >= 100) setCurrentTier('tier_2');
                else setCurrentTier('tier_1');

                // Trial calculation
                const trialStart = new Date(profile.trial_started_at);
                const now = new Date();
                const diffTime = now.getTime() - trialStart.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                setTrialDaysLeft(Math.max(0, 7 - diffDays));
            }
        }
    };

    const activeTier = ARTSCALE_DATA[currentTier];

    return (
        <DashboardLayout>
            <div className="max-w-[1400px] mx-auto space-y-8">
                {/* Header & Trial Banner */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">
                                ArtScaler <span className="text-blue-500">20K</span>
                            </h1>
                            <span className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-full text-[10px] font-black text-gray-400 tracking-widest uppercase">
                                v4.0 FINAL
                            </span>
                        </div>
                        <p className="text-gray-500 font-medium max-w-xl">
                            Sustainable Hybrid System: High-volume production + immediate payment protection + realistic math.
                        </p>
                    </div>

                    {trialDaysLeft !== null && trialDaysLeft > 0 && (
                        <div className="bg-blue-600/10 border border-blue-500/30 p-4 rounded-2xl flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                                <Clock className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-blue-400 uppercase tracking-widest">7-Day Free Trial Active</p>
                                <p className="text-lg font-black text-white">{trialDaysLeft} Days Remaining</p>
                            </div>
                            <button
                                onClick={() => window.location.href = '/pricing'}
                                className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-blue-600/20"
                            >
                                UPGRADE NOW
                            </button>
                        </div>
                    )}
                </div>

                {/* Tier Switcher / Roadmap */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(Object.keys(ARTSCALE_DATA) as (keyof typeof ARTSCALE_DATA)[]).map((tierKey) => {
                        const tier = ARTSCALE_DATA[tierKey];
                        const isActive = currentTier === tierKey;
                        return (
                            <button
                                key={tierKey}
                                onClick={() => setCurrentTier(tierKey)}
                                className={`
                                    relative p-6 rounded-2xl border transition-all text-left group
                                    ${isActive
                                        ? 'bg-blue-600/5 border-blue-600 ring-1 ring-blue-600'
                                        : 'bg-gray-900 border-gray-800 hover:border-gray-700'}
                                `}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-600' : 'bg-gray-800'}`}>
                                        <Layers className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-blue-400' : 'text-gray-600'}`}>
                                        {tier.timeline}
                                    </span>
                                </div>
                                <h3 className={`text-sm font-black uppercase tracking-tight mb-1 ${isActive ? 'text-white' : 'text-gray-400'}`}>
                                    {tier.name}
                                </h3>
                                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                    {isActive ? "Currently in this phase." : "Growth milestones ahead."}
                                </p>
                                {isActive && (
                                    <div className="absolute top-4 right-4 animate-pulse">
                                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Main Tier Dashboard */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Strategy Overview */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* Core Strategy Card */}
                        <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
                            <div className="p-8 border-b border-gray-800 bg-gradient-to-r from-gray-900 to-gray-800 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                                        <Zap className="h-6 w-6 text-blue-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white tracking-tight uppercase">Operational Roadmap</h2>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{activeTier.focus}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
                                    <ShieldCheck className="h-4 w-4 text-green-500" />
                                    <span className="text-[10px] font-black text-green-500 uppercase">Sustainable Profitable</span>
                                </div>
                            </div>

                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Inventory Strategy</h4>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4 p-4 bg-gray-950 border border-gray-800 rounded-2xl">
                                            <div className="p-2 bg-purple-500/10 rounded-lg">
                                                <Palette className="h-5 w-5 text-purple-500" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-500 uppercase">Primary Product</p>
                                                <p className="text-sm font-bold text-white mb-1">{activeTier.inventory.item}</p>
                                                <p className="text-[11px] text-gray-500 leading-relaxed">Target Price: ${activeTier.inventory.price}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4 p-4 bg-gray-950 border border-gray-800 rounded-2xl">
                                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                                <Layout className="h-5 w-5 text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-500 uppercase">Selling Format</p>
                                                <p className="text-sm font-bold text-white mb-1">{activeTier.inventory.format}</p>
                                                <p className="text-[11px] text-gray-500 leading-relaxed">{activeTier.strategy}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Weekly Schedule</h4>
                                    <div className="space-y-2">
                                        {activeTier.schedule.map((slot, i) => (
                                            <div key={i} className="flex items-center gap-4 p-3 hover:bg-gray-800/50 rounded-xl transition-all border border-transparent hover:border-gray-800">
                                                <span className="w-16 text-[10px] font-black text-blue-400 uppercase tracking-widest">{slot.day}</span>
                                                <div className="flex-1 flex flex-wrap gap-2">
                                                    {slot.tasks.map((task, j) => (
                                                        <span key={j} className="text-xs text-gray-300 font-bold">{task}{j < slot.tasks.length - 1 ? ' •' : ''}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Financial Card */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl shadow-xl">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Target Revenue</p>
                                <p className="text-2xl font-black text-green-500">${activeTier.monthly_revenue.toLocaleString()}<span className="text-sm text-gray-600">/mo</span></p>
                                <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase">
                                    <Target className="h-3 w-3" />
                                    Daily Target: {activeTier.daily_target} sales
                                </div>
                            </div>
                            <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl shadow-xl">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Net Profits</p>
                                <p className="text-2xl font-black text-blue-500">${activeTier.monthly_profit.toLocaleString()}<span className="text-sm text-gray-600">/mo</span></p>
                                <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase">
                                    <TrendingUp className="h-3 w-3" />
                                    High-Margin Core
                                </div>
                            </div>
                            <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl shadow-xl">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">eBay Safety Buffer</p>
                                <p className="text-sm font-bold text-white">Value Cap: ${activeTier.ebay_limits.value}</p>
                                <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-amber-500 uppercase">
                                    <AlertCircle className="h-3 w-3" />
                                    Don't exceed 90% limit
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar: Guidelines & Success Metrics */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Verification Checklist */}
                        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-xl">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Trophy className="h-4 w-4 text-amber-500" />
                                Promotion Checklist
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { label: "Feedback Threshold", target: activeTier.feedback, current: userStats.feedback },
                                    { label: "Defect Rate", target: "< 0.5%", current: "On Track" },
                                    { label: "Handling Time", target: "1 Bus. Day", current: "Synced" }
                                ].map((step, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-gray-500">{step.label}</span>
                                            <span className="text-white">{step.current} / {step.target}</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                                                style={{ width: typeof step.target === 'string' ? '100%' : `${Math.min(100, (Number(step.current) / (Number(step.target) || 1)) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="w-full mt-8 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs font-bold text-white rounded-xl transition-all uppercase tracking-widest">
                                View Full Niche Audit
                            </button>
                        </div>

                        {/* Subject Mastery */}
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 shadow-xl shadow-blue-900/20">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                Focus Subjects
                            </h3>
                            <p className="text-xs text-blue-100 mb-6 leading-relaxed opacity-90">
                                Focus 80% of your energy on these proven high-velocity subjects for this tier.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {activeTier.inventory.subjects.map((s: string) => (
                                    <span key={s} className="px-3 py-1.5 bg-white/10 backdrop-blur-md text-[10px] font-black text-white rounded-lg uppercase tracking-widest">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Help Desk */}
                        <div className="bg-gray-950 border border-dashed border-gray-800 p-6 rounded-3xl text-center">
                            <p className="text-xs text-gray-500 mb-4 font-bold">Stuck on a strategy segment?</p>
                            <button
                                onClick={() => window.location.href = `/studio/art-coach?prompt=${encodeURIComponent(`I'm looking at my ${activeTier.name} roadmap. Can you help me optimize my ${activeTier.focus} strategy?`)}`}
                                className="text-xs font-black text-blue-500 uppercase tracking-widest flex items-center justify-center gap-2 mx-auto hover:text-blue-400"
                            >
                                Ask Art Pulse Coach
                                <ArrowRight className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
