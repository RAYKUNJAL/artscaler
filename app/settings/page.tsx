'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase/client';
import {
    User,
    CreditCard,
    Bell,
    Shield,
    ExternalLink,
    Check,
    Zap,
    ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUser(user);
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            setProfile(profile);
        }
        setLoading(false);
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
                    <p className="text-gray-400">Manage your subscription, preferences, and account security.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Navigation */}
                    <div className="md:col-span-1 space-y-2">
                        {[
                            { name: 'General', icon: User, active: true },
                            { name: 'Subscription', icon: CreditCard },
                            { name: 'Notifications', icon: Bell },
                            { name: 'Security', icon: Shield },
                        ].map((item) => (
                            <button
                                key={item.name}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${item.active
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                    }`}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.name}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Profile Section */}
                        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                            <h2 className="text-lg font-bold text-white mb-6">Profile Information</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        readOnly
                                        value={user?.email || ''}
                                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-400 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Display Name</label>
                                    <input
                                        type="text"
                                        placeholder="Add your name"
                                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Subscription Section */}
                        <div className="bg-gray-900 border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-10">
                                <Zap className="h-24 w-24 text-blue-500" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Active Subscription</h3>
                            <div className="flex items-center gap-2 mb-6">
                                <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest">
                                    {profile?.subscription_tier || 'FREE SCOUT'}
                                </span>
                                <span className="text-xs text-gray-500">Current Plan</span>
                            </div>

                            <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-800 mb-6 text-sm text-gray-300">
                                <p className="mb-2">Your next billing date is <strong>January 20, 2026</strong>.</p>
                                <p>Manage invoices and payment methods directly in our portal.</p>
                            </div>

                            <div className="flex gap-4">
                                <Link
                                    href="/pricing"
                                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg"
                                >
                                    Change Plan
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                                <button className="px-6 py-3 border border-gray-700 text-gray-400 hover:text-white font-bold rounded-xl transition-all">
                                    Billing Portal
                                </button>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="pt-6 border-t border-gray-800">
                            <button className="text-sm font-bold text-red-500 hover:text-red-400 transition-colors uppercase tracking-widest">
                                Deactivate Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
