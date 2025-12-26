'use client';

import { Search, Sparkles, Calculator, MousePointer2 } from 'lucide-react';
import Link from 'next/link';

export default function QuickTools() {
    const tools = [
        { name: 'Scan Market', icon: Search, color: 'blue', desc: 'Real-time intel', href: '/market-scanner' },
        { name: 'Build Listing', icon: Sparkles, color: 'purple', desc: 'AI optimization', href: '/listing-builder' },
        { name: 'Profit Calc', icon: Calculator, color: 'green', desc: 'Fee analysis', href: '/profit-calculator' },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {tools.map((tool) => (
                <Link
                    key={tool.name}
                    href={tool.href}
                    className="bg-gray-900 border border-gray-800 rounded-[32px] p-6 flex flex-col items-center text-center hover:-translate-y-2 transition-all group overflow-hidden relative"
                >
                    <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-${tool.color}-600/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity`}></div>

                    <div className={`w-16 h-16 bg-${tool.color}-600/10 border border-${tool.color}-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                        <tool.icon className={`h-8 w-8 text-${tool.color}-500`} />
                    </div>

                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">{tool.name}</h3>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{tool.desc}</p>

                    <div className="mt-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                        <span className="text-[10px] font-black text-blue-400 uppercase">Launch Tool</span>
                        <MousePointer2 className="h-3 w-3 text-blue-400" />
                    </div>
                </Link>
            ))}
        </div>
    );
}
