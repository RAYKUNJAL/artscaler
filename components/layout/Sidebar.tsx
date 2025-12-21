'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
    LayoutDashboard,
    Search,
    TrendingUp,
    DollarSign,
    FileText,
    Database,
    Settings,
    LogOut,
    Sparkles,
    Palette,
    Zap,
    Eye,
    ChevronDown,
    ChevronUp,
    Calculator,
    Activity,
    Heart,
    MessageSquare,
    Calendar,
    Trophy,
    X,
} from 'lucide-react';

const navigation = [
    { name: 'Hub Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Market Scanner', href: '/market-scanner', icon: Search },
    {
        name: 'Pulse Intelligence',
        icon: Activity,
        children: [
            { name: 'Demand Pulse', href: '/trends', icon: TrendingUp },
            { name: 'Hot Opportunities', href: '/opportunities', icon: Sparkles },
        ]
    },
    { name: 'Profit Calculator', href: '/profit-calculator', icon: Calculator, badge: 'PRO' },
    { name: 'Listing Builder', href: '/listing-builder', icon: FileText, badge: 'NEW' },
    { name: 'Art Planner', href: '/art-planner', icon: Calendar, badge: 'WEEKLY' },
    {
        name: 'My Studio',
        icon: Palette,
        badge: 'NEW',
        children: [
            { name: 'Inventory', href: '/studio', icon: Eye },
            { name: 'COA Generator', href: '/studio/coa-generator', icon: FileText },
            { name: 'Brand Identity', href: '/studio/brand-generator', icon: Sparkles },
            { name: 'Thank You Cards', href: '/studio/thank-you-cards', icon: Heart },
        ]
    },
    { name: 'Art Pulse Coach', href: '/studio/art-coach', icon: MessageSquare, badge: 'AI' },
    { name: 'ArtScaler Roadmap', href: '/artscaler', icon: Trophy, badge: 'GROWTH' },
    { name: 'Pricing Engine', href: '/pricing-engine', icon: DollarSign },
    { name: 'System Logs', href: '/data-logs', icon: Database },
    { name: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
    onClose?: () => void;
    mobile?: boolean;
}

export default function Sidebar({ onClose, mobile }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [expandedMenus, setExpandedMenus] = useState<string[]>(['Pulse Intelligence']);
    const [user, setUser] = useState<any>(null);
    const [tier, setTier] = useState<string>('free');

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUser(user);

            // Load tier from subscription status
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('subscription_tier, roadmap_tier')
                .eq('id', user.id)
                .single();

            setTier(profile?.subscription_tier || 'Scout');
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    const toggleMenu = (name: string) => {
        setExpandedMenus(prev =>
            prev.includes(name)
                ? prev.filter(m => m !== name)
                : [...prev, name]
        );
    };

    const getTierBadge = () => {
        switch (tier.toLowerCase()) {
            case 'empire': return { text: 'STUDIO EMPIRE', color: 'bg-gradient-to-r from-yellow-500 to-amber-600' };
            case 'painter': return { text: 'PRO PAINTER', color: 'bg-gradient-to-r from-blue-500 to-indigo-600' };
            default: return { text: 'FREE SCOUT', color: 'bg-gray-700' };
        }
    };

    const tierBadge = getTierBadge();

    return (
        <div className={`flex flex-col h-full bg-gray-900 border-r border-gray-800 ${mobile ? 'w-full' : 'w-64 h-screen'}`}>
            {/* Logo */}
            <div className="flex h-16 items-center gap-3 px-4 border-b border-gray-800 flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <Zap className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                    <h1 className="text-sm font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent uppercase tracking-tighter">
                        ArtScaler
                    </h1>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">v4.0 FINAL</p>
                </div>
                {mobile && onClose && (
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
                    >
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
                {navigation.map((item) => {
                    const Icon = item.icon;

                    if (item.children) {
                        const isExpanded = expandedMenus.includes(item.name);
                        const hasActiveChild = item.children.some(child => pathname === child.href);

                        return (
                            <div key={item.name}>
                                <button
                                    onClick={() => toggleMenu(item.name)}
                                    className={`
                    w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all
                    ${hasActiveChild
                                            ? 'bg-gray-800 text-white'
                                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                        }
                   `}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon className="h-5 w-5" />
                                        {item.name}
                                    </div>
                                    {isExpanded ? (
                                        <ChevronUp className="h-4 w-4" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4" />
                                    )}
                                </button>

                                {isExpanded && (
                                    <div className="ml-4 mt-1 space-y-1 border-l border-gray-800 pl-3">
                                        {item.children.map((child) => {
                                            const ChildIcon = child.icon;
                                            const isActive = pathname === child.href;

                                            return (
                                                <Link
                                                    key={child.name}
                                                    href={child.href}
                                                    className={`
                             flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all
                             ${isActive
                                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                                        }
                           `}
                                                >
                                                    <ChildIcon className="h-4 w-4" />
                                                    {child.name}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`
                flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all
                ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                }
              `}
                        >
                            <Icon className="h-5 w-5" />
                            <span className="flex-1">{item.name}</span>
                            {item.badge && (
                                <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded text-white ${item.badge === 'PRO' ? 'bg-amber-500' : 'bg-blue-500'}`}>
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User section */}
            <div className="border-t border-gray-800 p-4">
                <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-lg">
                        {user?.email?.charAt(0).toUpperCase() || 'S'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                            {user?.email?.split('@')[0] || 'Scout'}
                        </p>
                        <span className={`inline-block px-2 py-0.5 text-[9px] font-bold text-white rounded shadow-sm ${tierBadge.color}`}>
                            {tierBadge.text}
                        </span>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-xs font-bold text-gray-500 hover:bg-red-900/10 hover:text-red-400 transition-all uppercase tracking-widest"
                >
                    <LogOut className="h-4 w-4" />
                    Exit Hub
                </button>
            </div>
        </div>
    );
}
