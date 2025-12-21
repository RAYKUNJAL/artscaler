import Link from 'next/link';
import { FileText, Shield, RefreshCcw, ArrowLeft, ChevronRight } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function LegalIndexPage() {
    const documents = [
        {
            title: 'Terms of Service',
            description: 'The rules and guidelines for using ArtScaler.',
            href: '/legal/terms',
            icon: FileText,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
        },
        {
            title: 'Privacy Policy',
            description: 'How we collect, use, and protect your data.',
            href: '/legal/privacy',
            icon: Shield,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10'
        },
        {
            title: 'Refund Policy',
            description: 'Our 14-day money-back guarantee details.',
            href: '/legal/refunds',
            icon: RefreshCcw,
            color: 'text-green-500',
            bg: 'bg-green-500/10'
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-20 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter">
                        Legal <span className="text-blue-500">Center</span>
                    </h1>
                    <p className="text-gray-400">Everything you need to know about our policies and terms.</p>
                </div>

                <div className="grid gap-6">
                    {documents.map((doc) => {
                        const Icon = doc.icon;
                        return (
                            <Link
                                key={doc.href}
                                href={doc.href}
                                className="group bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 flex items-center justify-between transition-all hover:border-blue-500 hover:scale-[1.02]"
                            >
                                <div className="flex items-center gap-6">
                                    <div className={`p-4 rounded-xl ${doc.bg}`}>
                                        <Icon className={`h-8 w-8 ${doc.color}`} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                                            {doc.title}
                                        </h2>
                                        <p className="text-gray-400 text-sm">{doc.description}</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-6 w-6 text-gray-700 group-hover:text-blue-500 transition-all group-hover:translate-x-1" />
                            </Link>
                        );
                    })}
                </div>

                <div className="mt-12 text-center">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
