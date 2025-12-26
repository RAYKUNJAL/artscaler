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
    const [ebayConnected, setEbayConnected] = useState(false);
    const [connectingEbay, setConnectingEbay] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        loadData();
        checkParams();
    }, []);

    const checkParams = () => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('success') === 'ebay_connected') {
            setMessage({ type: 'success', text: 'eBay account successfully connected!' });
        } else if (params.get('error')) {
            setMessage({ type: 'error', text: 'Failed to connect eBay account.' });
        }
    };

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

            // Check eBay connection
            const { data: ebayAccount } = await supabase
                .from('seller_accounts')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle();

            setEbayConnected(!!ebayAccount);
        }
        setLoading(false);
    };

    const handleConnectEbay = async () => {
        setConnectingEbay(true);
        try {
            const response = await fetch('/api/ebay/auth/url');
            const { url, error } = await response.json();
            if (error) throw new Error(error);
            window.location.href = url;
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
            setConnectingEbay(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
                    <p className="text-gray-400">Manage your subscription, preferences, and account security.</p>
                </div>

                {message && (
                    <div className={`p-4 rounded-xl border ${message.type === 'success'
                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                        {message.text}
                    </div>
                )}

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

                        {/* Connected Accounts Section */}
                        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                            <h2 className="text-lg font-bold text-white mb-6">Connected Accounts</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/1/1b/EBay_logo.svg" alt="eBay" className="w-8" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">eBay Store</h3>
                                            <p className="text-xs text-gray-500">Enable private analytics and sales tracking</p>
                                        </div>
                                    </div>
                                    {ebayConnected ? (
                                        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                                            <Check className="h-3 w-3 text-green-500" />
                                            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Connected</span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleConnectEbay}
                                            disabled={connectingEbay}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2"
                                        >
                                            {connectingEbay ? 'Connecting...' : 'Connect Store'}
                                            <ArrowRight className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
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
