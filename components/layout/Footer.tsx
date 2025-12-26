/**
 * Footer Component - ArtScaler v5.0
 * Displays legal links, product resources, and company information
 */

import Link from 'next/link';
import { Zap } from 'lucide-react';

const footerLinks = {
    product: [
        { text: "Features", url: "/#features" },
        { text: "Pricing", url: "/pricing" },
        { text: "How It Works", url: "/#how-it-works" },
        { text: "Market Scopes", url: "/market-scanner" }
    ],
    resources: [
        { text: "Sell Guide", url: "/#how-it-works" },
        { text: "Pricing Engine", url: "/pricing-engine" },
        { text: "Art Planner", url: "/art-planner" },
        { text: "Roadmap", url: "/artscaler" }
    ],
    company: [
        { text: "Dashboard", url: "/dashboard" },
        { text: "Settings", url: "/settings" },
        { text: "Terms", url: "/legal/terms" },
        { text: "Privacy", url: "/legal/privacy" }
    ]
};

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-950 border-t border-white/5 py-20">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
                    {/* Brand Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
                                <Zap className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-black text-white tracking-tighter uppercase italic">
                                ArtScaler <span className="text-blue-500">v5.0</span>
                            </span>
                        </Link>
                        <p className="text-gray-500 text-sm leading-relaxed max-w-sm font-medium">
                            Built for artists aiming for $10k-$20k/month on eBay. Data-driven intelligence that tells you what to paint, how to price, and when to list.
                        </p>
                        <div className="flex items-center gap-4 pt-4">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Global Market Intelligence Active</span>
                        </div>
                    </div>

                    {/* Link Columns */}
                    <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6">Product</h4>
                        <ul className="space-y-4">
                            {footerLinks.product.map((link, idx) => (
                                <li key={idx}>
                                    <Link href={link.url} className="text-sm text-gray-500 hover:text-blue-400 transition-colors font-medium">
                                        {link.text}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6">Resources</h4>
                        <ul className="space-y-4">
                            {footerLinks.resources.map((link, idx) => (
                                <li key={idx}>
                                    <Link href={link.url} className="text-sm text-gray-500 hover:text-blue-400 transition-colors font-medium">
                                        {link.text}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6">Company</h4>
                        <ul className="space-y-4">
                            {footerLinks.company.map((link, idx) => (
                                <li key={idx}>
                                    <Link href={link.url} className="text-sm text-gray-500 hover:text-blue-400 transition-colors font-medium">
                                        {link.text}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                        © {currentYear} ArtScaler. Built for eBay art sellers.
                    </p>
                    <div className="flex items-center gap-8 text-[10px] font-black text-gray-700 uppercase tracking-tighter">
                        <span>Official Partner Program</span>
                        <span>Pulse Intelligence Engine v5.1.2</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
