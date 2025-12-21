import Link from 'next/link';
import { ArrowLeft, Shield, FileText, RefreshCcw } from 'lucide-react';

export default function RefundsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to pricing
                </Link>

                <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
                    <h1 className="text-3xl font-bold text-white mb-2">Refund Policy</h1>
                    <p className="text-gray-400 mb-8">Last updated: December 2024</p>

                    <div className="prose prose-invert max-w-none space-y-6">
                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">1. 14-Day Money-Back Guarantee</h2>
                            <p className="text-gray-300 leading-relaxed">
                                We offer a full 14-day money-back guarantee for all new subscriptions. If you are not
                                satisfied with ArtScaler for any reason, you can request a full refund within 14 days
                                of your initial purchase.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">2. Recurring Subscriptions</h2>
                            <p className="text-gray-300 leading-relaxed">
                                Subscription fees are non-refundable after the initial 14-day period. However, you can
                                cancel your subscription at any time to prevent future charges. Your access will
                                remain active until the end of the current billing cycle.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">3. How to Request a Refund</h2>
                            <p className="text-gray-300 leading-relaxed">
                                To request a refund, please contact our support team at support@artscaler.com with
                                your account email and transaction details. Refunds are processed within 5-10 business
                                days.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">4. Abuse of Policy</h2>
                            <p className="text-gray-300 leading-relaxed">
                                We reserve the right to refuse refunds to users who show a pattern of abusing our
                                refund policy or violating our Terms of Service.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
