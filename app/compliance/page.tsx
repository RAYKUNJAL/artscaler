
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ShieldCheck, Database, Lock, Scale, Mail } from 'lucide-react';

export default function CompliancePage() {
    const sections = [
        {
            id: 'data_sources',
            title: 'Data Sources',
            icon: <Database className="h-6 w-6 text-blue-500" />,
            points: [
                'ArtScaler only uses official eBay APIs where required and permitted by eBay.',
                'All marketplace connections use secure OAuth flows with explicit seller consent.',
                'ArtScaler may also use non-eBay data sources (social media trends, internal sales data, surveys) to enhance insights.',
            ],
        },
        {
            id: 'data_usage',
            title: 'How We Use Your Data',
            icon: <Lock className="h-6 w-6 text-purple-500" />,
            points: [
                'Data is accessed via seller OAuth consent and used only to provide services back to that seller.',
                'No bulk redistribution or resale of eBay listing content or personal data.',
                'We store normalized, derived metrics rather than exposing raw eBay data in bulk.',
            ],
        },
        {
            id: 'license_alignment',
            title: 'Alignment with eBay API License Agreement',
            icon: <Scale className="h-6 w-6 text-green-500" />,
            points: [
                'We follow the eBay API License Agreement for all API-based integrations.',
                'We do not use eBay content to train general-purpose AI models without explicit written approval.',
                'We do not operate bulk pricing engines that compete with eBay’s own tools on restricted data without written approval.',
            ],
        },
        {
            id: 'privacy',
            title: 'Privacy & Personal Data',
            icon: <ShieldCheck className="h-6 w-6 text-amber-500" />,
            points: [
                'We do not resell or reshare buyer or watcher personal information.',
                'We limit storage and use of personal data to what is required to deliver ArtScaler services.',
                'Sellers can request data export or deletion in accordance with our data retention policies.',
            ],
        },
    ];

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <div className="container mx-auto px-4 py-20 max-w-4xl">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold mb-4">Compliance & Data Policy</h1>
                    <p className="text-gray-400">
                        Our commitment to marketplace integrity, seller privacy, and official API alignment.
                    </p>
                </div>

                <div className="space-y-12">
                    {sections.map((section) => (
                        <div key={section.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-gray-800 rounded-xl">
                                    {section.icon}
                                </div>
                                <h2 className="text-2xl font-bold">{section.title}</h2>
                            </div>
                            <ul className="space-y-4">
                                {section.points.map((point, i) => (
                                    <li key={i} className="flex gap-3 text-gray-300 leading-relaxed">
                                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2.5 flex-shrink-0" />
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-16 bg-blue-600/10 border border-blue-500/20 rounded-2xl p-8 text-center">
                    <Mail className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Have compliance questions?</h3>
                    <p className="text-gray-400 mb-6">
                        Our compliance team is available to discuss or clarify our data acquisition and usage policies.
                    </p>
                    <a href="mailto:compliance@artscaler.com" className="text-blue-400 font-bold hover:underline">
                        compliance@artscaler.com
                    </a>
                </div>
            </div>
        </div>
    );
}
