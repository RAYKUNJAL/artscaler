/**
 * eBay Notifications Endpoint
 * Required by eBay for API application approval
 */

export default function EbayNotificationsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
            <div className="container mx-auto px-4 py-16 max-w-4xl">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            ArtScaler eBay Integration
                        </h1>
                        <p className="text-xl text-purple-200">
                            Official eBay API Notifications Endpoint
                        </p>
                    </div>

                    <div className="space-y-6 text-gray-200">
                        <section>
                            <h2 className="text-2xl font-semibold mb-3 text-purple-300">
                                Application Information
                            </h2>
                            <div className="bg-black/30 rounded-lg p-6 space-y-2">
                                <p><strong className="text-purple-300">Application Name:</strong> ArtScaler</p>
                                <p><strong className="text-purple-300">Application URL:</strong> https://www.artscaler.com</p>
                                <p><strong className="text-purple-300">Notifications Endpoint:</strong> https://www.artscaler.com/ebay/notifications</p>
                                <p><strong className="text-purple-300">Developer:</strong> Ray Kunja</p>
                                <p><strong className="text-purple-300">App ID:</strong> ArtScaler-Production</p>
                                <p><strong className="text-purple-300">Environment:</strong> Production</p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-3 text-purple-300">
                                Application Purpose
                            </h2>
                            <div className="bg-black/30 rounded-lg p-6">
                                <p className="mb-4">
                                    ArtScaler is a comprehensive business management platform designed specifically for artists
                                    selling on eBay. Our application provides:
                                </p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Market intelligence and pricing analysis for art listings</li>
                                    <li>Automated listing creation and optimization</li>
                                    <li>Sales tracking and order management</li>
                                    <li>AI-powered branding tools (COA generation, thank you cards)</li>
                                    <li>Inventory management and analytics</li>
                                </ul>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-3 text-purple-300">
                                eBay APIs Used
                            </h2>
                            <div className="bg-black/30 rounded-lg p-6">
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li><strong>Finding API:</strong> Market research and sold listings analysis</li>
                                    <li><strong>Trading API:</strong> Listing creation, order management, and sales tracking</li>
                                    <li><strong>Browse API:</strong> Active listing data and search functionality</li>
                                    <li><strong>Sell APIs:</strong> Inventory and fulfillment management</li>
                                </ul>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-3 text-purple-300">
                                Authentication & Security
                            </h2>
                            <div className="bg-black/30 rounded-lg p-6">
                                <p className="mb-4">
                                    ArtScaler implements OAuth 2.0 for secure user authentication and authorization:
                                </p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>OAuth 2.0 authorization flow for user consent</li>
                                    <li>Secure token storage and management</li>
                                    <li>HTTPS encryption for all API communications</li>
                                    <li>Compliance with eBay API terms and conditions</li>
                                    <li>User data privacy and protection</li>
                                </ul>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-3 text-purple-300">
                                Webhook Notifications
                            </h2>
                            <div className="bg-black/30 rounded-lg p-6">
                                <p className="mb-4">
                                    ArtScaler implements a secure webhook endpoint to receive real-time notifications from eBay:
                                </p>
                                <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-4 mb-4">
                                    <p className="font-mono text-sm text-purple-200">
                                        POST https://www.artscaler.com/api/ebay/notifications
                                    </p>
                                </div>
                                <p className="mb-3 font-semibold text-purple-200">Supported Events:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li><strong>Marketplace Account Deletion:</strong> Handles user account deletion/closure notifications (GDPR/CCPA compliance)</li>
                                    <li><strong>Order Events:</strong> Order shipped, cancelled, and status updates</li>
                                    <li><strong>Listing Events:</strong> Item listed, revised, sold, and ended</li>
                                    <li><strong>Sales Events:</strong> Fixed price transactions and auction completions</li>
                                </ul>
                                <div className="mt-4 p-3 bg-blue-900/30 border border-blue-500/50 rounded-lg">
                                    <p className="text-sm text-blue-200">
                                        <strong>✓ GDPR & CCPA Compliant:</strong> Automatically processes marketplace account deletion
                                        notifications and removes user data as required by privacy regulations.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-3 text-purple-300">
                                Compliance & Legal
                            </h2>
                            <div className="bg-black/30 rounded-lg p-6 space-y-2">
                                <p>
                                    <strong className="text-purple-300">Terms of Service:</strong>{' '}
                                    <a href="/legal/terms" className="text-blue-400 hover:text-blue-300 underline">
                                        https://www.artscaler.com/legal/terms
                                    </a>
                                </p>
                                <p>
                                    <strong className="text-purple-300">Privacy Policy:</strong>{' '}
                                    <a href="/legal/privacy" className="text-blue-400 hover:text-blue-300 underline">
                                        https://www.artscaler.com/legal/privacy
                                    </a>
                                </p>
                                <p className="mt-4 text-sm text-gray-300">
                                    ArtScaler complies with all eBay Developer Program policies and guidelines.
                                    We are committed to protecting user data and providing a secure, reliable service.
                                </p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-3 text-purple-300">
                                Contact Information
                            </h2>
                            <div className="bg-black/30 rounded-lg p-6 space-y-2">
                                <p><strong className="text-purple-300">Support Email:</strong> support@artscaler.com</p>
                                <p><strong className="text-purple-300">Developer Email:</strong> dev@artscaler.com</p>
                                <p><strong className="text-purple-300">Website:</strong> https://www.artscaler.com</p>
                            </div>
                        </section>

                        <div className="mt-8 p-6 bg-green-900/30 border border-green-500/50 rounded-lg">
                            <p className="text-center text-green-300">
                                ✓ This endpoint is active and ready for eBay API integration
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export const metadata = {
    title: 'eBay Notifications - ArtScaler',
    description: 'Official eBay API notifications endpoint for ArtScaler application',
    robots: 'noindex, nofollow'
};
