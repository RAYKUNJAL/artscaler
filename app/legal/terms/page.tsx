import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                {/* Back Link */}
                <Link
                    href="/auth/signup"
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to signup
                </Link>

                {/* Content */}
                <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
                    <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
                    <p className="text-gray-400 mb-8">Last updated: December 2024</p>

                    <div className="prose prose-invert max-w-none space-y-6">
                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
                            <p className="text-gray-300 leading-relaxed">
                                By accessing or using ArtScaler, you agree to be bound by these Terms of Service.
                                If you do not agree to these terms, please do not use our service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
                            <p className="text-gray-300 leading-relaxed">
                                ArtScaler provides marketplace data analysis and insights for artists. Our service includes
                                data scraping from public marketplace listings, AI-powered analysis, and pricing recommendations.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">3. User Responsibilities</h2>
                            <p className="text-gray-300 leading-relaxed">
                                You are responsible for maintaining the confidentiality of your account credentials.
                                You agree to use the service only for lawful purposes and in accordance with these terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">4. Data Usage</h2>
                            <p className="text-gray-300 leading-relaxed">
                                We collect and analyze publicly available marketplace data. This data is used to provide
                                insights and recommendations. We do not guarantee the accuracy or completeness of this data.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">5. Intellectual Property</h2>
                            <p className="text-gray-300 leading-relaxed">
                                All content, features, and functionality of ArtScaler are owned by us and are protected
                                by international copyright, trademark, and other intellectual property laws.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">6. Limitation of Liability</h2>
                            <p className="text-gray-300 leading-relaxed">
                                ArtScaler is provided "as is" without warranties of any kind. We are not liable for any
                                indirect, incidental, or consequential damages arising from your use of the service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">7. Changes to Terms</h2>
                            <p className="text-gray-300 leading-relaxed">
                                We reserve the right to modify these terms at any time. We will notify users of significant
                                changes. Continued use of the service constitutes acceptance of the modified terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">8. Contact</h2>
                            <p className="text-gray-300 leading-relaxed">
                                If you have questions about these Terms of Service, please contact us at support@ArtScaler.com.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
