import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
                    <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
                    <p className="text-gray-400 mb-8">Last updated: December 2024</p>

                    <div className="prose prose-invert max-w-none space-y-6">
                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
                            <p className="text-gray-300 leading-relaxed">
                                We collect information you provide directly, including your name, email address, and
                                account preferences. We also collect usage data to improve our service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Your Information</h2>
                            <p className="text-gray-300 leading-relaxed">
                                We use your information to provide and improve our services, communicate with you,
                                and personalize your experience. We analyze marketplace data to generate insights for you.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">3. Data Storage and Security</h2>
                            <p className="text-gray-300 leading-relaxed">
                                Your data is stored securely using industry-standard encryption. We use Supabase for
                                authentication and data storage, which provides enterprise-grade security.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">4. Third-Party Services</h2>
                            <p className="text-gray-300 leading-relaxed">
                                We use third-party services including Supabase for authentication and database,
                                and Google Gemini for AI-powered analysis. These services have their own privacy policies.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">5. Cookies and Tracking</h2>
                            <p className="text-gray-300 leading-relaxed">
                                We use cookies to maintain your session and preferences. We may use analytics tools
                                to understand how our service is used. You can disable cookies in your browser settings.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">6. Data Retention</h2>
                            <p className="text-gray-300 leading-relaxed">
                                We retain your data as long as your account is active. You can request deletion of
                                your data at any time by contacting us or through your account settings.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">7. Your Rights</h2>
                            <p className="text-gray-300 leading-relaxed">
                                You have the right to access, correct, or delete your personal data. You can also
                                request a copy of your data or object to certain processing activities.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">8. Changes to This Policy</h2>
                            <p className="text-gray-300 leading-relaxed">
                                We may update this policy from time to time. We will notify you of significant changes
                                via email or through our service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">9. Contact Us</h2>
                            <p className="text-gray-300 leading-relaxed">
                                If you have questions about this Privacy Policy, please contact us at privacy@ArtScaler.com.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
