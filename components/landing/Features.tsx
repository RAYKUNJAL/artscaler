'use client';

import {
    Search,
    DollarSign,
    FileText,
    Calendar,
    Calculator,
    TrendingUp,
    MessageCircle,
    BarChart2
} from 'lucide-react';

const features = [
    {
        name: "Market Intelligence Scanner",
        icon: Search,
        description: "Scan live eBay markets for demand signals. See what's getting bids, watchers, and final sale prices.",
        benefit: "Know which subjects and formats actually sell before you paint them.",
        availability: "Free Scout (3 scans/day), Pro Painter (Unlimited)",
        color: "blue"
    },
    {
        name: "Pulse Pricing Engine",
        icon: DollarSign,
        description: "AI price predictions based on 90 days of real eBay sales data with confidence scores.",
        benefit: "Avoid underpricing originals or overpricing prints; get a smart price range.",
        availability: "Pro Painter, Studio Empire",
        color: "emerald"
    },
    {
        name: "AI Listing Builder",
        icon: FileText,
        description: "Generate SEO-optimized titles, descriptions, and price advice in seconds.",
        benefit: "Turn your art into a high-converting eBay listing in seconds.",
        availability: "All plans",
        color: "purple"
    },
    {
        name: "Weekly Art Planner",
        icon: Calendar,
        description: "Get ranked recommendations on what to paint next, based on Pulse Velocity scores.",
        benefit: "Stop guessing what buyers want. Paint what's proven to sell this week.",
        availability: "Pro Painter, Studio Empire",
        color: "amber"
    },
    {
        name: "Profit Margin Calculator",
        icon: Calculator,
        description: "Calculate exact eBay fee deductions and net margins for your art sales.",
        benefit: "Know your real profit before you list. Find your highest-margin niches.",
        availability: "All plans",
        color: "rose"
    },
    {
        name: "Market Heatmap & Alerts",
        icon: TrendingUp,
        description: "See which art categories are trending up in real-time and get alerts when demand spikes.",
        benefit: "Ride demand spikes by quickly creating similar works when a subject heats up.",
        availability: "Pro Painter, Studio Empire",
        color: "indigo"
    },
    {
        name: "Art Pulse Coach (AI)",
        icon: MessageCircle,
        description: "Ask anything about eBay sales, pricing strategies, or trending art subjects.",
        benefit: "Get personalized advice like a gallery owner mentor, available 24/7.",
        availability: "Pro Painter, Studio Empire",
        color: "cyan"
    },
    {
        name: "My Listings Tracker",
        icon: BarChart2,
        description: "Connect your eBay account and track performance of listings created with ArtScaler data.",
        benefit: "See proof that ArtScaler's advice works. Track impressions and watchers.",
        availability: "Pro Painter, Studio Empire (NEW)",
        color: "orange"
    }
];

export default function Features() {
    return (
        <section id="features" className="py-24 bg-gray-950/50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-20">
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-6 uppercase tracking-tighter italic">
                        The <span className="text-blue-500">Toolkit</span> for $20k/mo
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto font-medium">
                        Everything you need to scale your artist studio from hobbyist to full-time professional.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, idx) => (
                        <div key={idx} className="group bg-gray-900/40 backdrop-blur-sm border border-white/5 rounded-3xl p-8 hover:border-white/10 transition-all duration-300 flex flex-col items-start">
                            <div className={`w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-6 text-${feature.color}-400 group-hover:scale-110 group-hover:bg-${feature.color}-500/10 transition-all duration-300`}>
                                <feature.icon className="h-6 w-6" />
                            </div>

                            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                                {feature.name}
                            </h3>

                            <p className="text-gray-400 text-sm leading-relaxed mb-4 flex-1">
                                {feature.description}
                            </p>

                            <div className="space-y-3 pt-4 border-t border-white/5 w-full">
                                <p className="text-xs font-bold text-gray-200">
                                    <span className="text-blue-500">Benefit:</span> {feature.benefit}
                                </p>
                                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                                    {feature.availability}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
