'use client';

const stats = [
    {
        number: "90 days",
        label: "of eBay sales data analyzed"
    },
    {
        number: "Real-time",
        label: "bid & watcher tracking"
    },
    {
        number: "10-20k",
        label: "monthly revenue target range"
    }
];

export default function SocialProof() {
    return (
        <section className="py-24 bg-gray-950/50 overflow-hidden relative">
            {/* Background Decorative Element */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border-[1px] border-white/5 rounded-full pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] border-[1px] border-white/5 rounded-full pointer-events-none"></div>

            <div className="container mx-auto px-4 relative">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-24">
                    {/* Founder Note */}
                    <div className="space-y-8">
                        <h2 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tighter uppercase italic">
                            Built by artists, <br />
                            <span className="text-blue-500">for artists</span>
                        </h2>

                        <div className="relative">
                            <div className="absolute -top-10 -left-10 text-[12rem] text-blue-500/10 font-black pointer-events-none select-none">“</div>
                            <blockquote className="text-2xl md:text-3xl text-gray-300 font-medium leading-relaxed italic relative z-10">
                                Built by an eBay seller who got tired of guessing what would sell. After years of trial and error, I turned that painful process into ArtScaler so you never have to guess again.
                            </blockquote>
                            <div className="mt-8 flex items-center gap-4">
                                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center font-black text-white text-xl shadow-lg shadow-blue-600/20">
                                    R
                                </div>
                                <div>
                                    <p className="text-white font-black uppercase tracking-widest">— Ray</p>
                                    <p className="text-blue-500 font-bold text-sm">Founder, ArtScaler</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-6">
                        {stats.map((stat, idx) => (
                            <div key={idx} className="bg-gray-900/60 backdrop-blur-xl border border-white/5 p-10 rounded-[32px] text-center lg:text-left hover:border-white/10 transition-all duration-300">
                                <div className="text-4xl md:text-6xl font-black text-white mb-2 tracking-tighter">
                                    {stat.number}
                                </div>
                                <div className="text-sm font-black text-gray-500 uppercase tracking-widest">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Additional Testimonials */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        {
                            name: "Sarah Jenkins",
                            role: "Oil Painter",
                            content: "ArtScaler completely changed how I list. I used to guess my prices, but now I have the data to back up $500+ listings with confidence.",
                            avatar: "SJ"
                        },
                        {
                            name: "Marcus Thorne",
                            role: "Digital Artist",
                            content: "The 'Pulse Velocity' signal is real. I saw Minecraft portraits were trending, listed 5, and sold 3 in the first week. Insane.",
                            avatar: "MT"
                        },
                        {
                            name: "Elena Ross",
                            role: "Mixed Media",
                            content: "Finally a tool that understands the art market. The 90-day guarantee made it a no-brainer, and I'll never go back to generic research.",
                            avatar: "ER"
                        }
                    ].map((testimonial, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-all">
                            <p className="text-gray-300 italic mb-6">"{testimonial.content}"</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                    {testimonial.avatar}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{testimonial.name}</p>
                                    <p className="text-xs text-blue-400">{testimonial.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
