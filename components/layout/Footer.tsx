/**
 * Footer Component
 * Displays legal links and company information
 */

import Link from 'next/link';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-slate-900/50 backdrop-blur-sm border-t border-white/10 mt-auto">
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Company Info */}
                    <div>
                        <h3 className="text-lg font-semibold text-purple-400 mb-3">ArtScaler</h3>
                        <p className="text-sm text-gray-400">
                            Empowering artists to scale their eBay businesses with AI-powered tools and insights.
                        </p>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-3">Product</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/dashboard" className="text-sm text-gray-400 hover:text-purple-400 transition-colors">
                                    Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link href="/market-scanner" className="text-sm text-gray-400 hover:text-purple-400 transition-colors">
                                    Market Scanner
                                </Link>
                            </li>
                            <li>
                                <Link href="/pricing" className="text-sm text-gray-400 hover:text-purple-400 transition-colors">
                                    Pricing
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-3">Resources</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/ebay/notifications" className="text-sm text-gray-400 hover:text-purple-400 transition-colors">
                                    eBay Integration
                                </Link>
                            </li>
                            <li>
                                <a
                                    href="mailto:support@artscaler.com"
                                    className="text-sm text-gray-400 hover:text-purple-400 transition-colors"
                                >
                                    Support
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-3">Legal</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/legal/terms" className="text-sm text-gray-400 hover:text-purple-400 transition-colors">
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link href="/legal/privacy" className="text-sm text-gray-400 hover:text-purple-400 transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-8 pt-6 border-t border-white/10">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-gray-400">
                            © {currentYear} ArtScaler. All rights reserved.
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>Made for artists, by artists</span>
                            <span className="hidden md:inline">•</span>
                            <a
                                href="mailto:dev@artscaler.com"
                                className="hover:text-purple-400 transition-colors"
                            >
                                Contact
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
