
import { useEffect, useRef } from 'react';
import { Search, Info } from 'lucide-react';

interface UsageMeterProps {
    used: number;
    limit: number;
}

export default function UsageMeter({ used, limit }: UsageMeterProps) {
    const barRef = useRef<HTMLDivElement>(null);
    const percentage = Math.min((used / limit) * 100, 100);
    const isNearLimit = percentage >= 80;
    const isAtLimit = percentage >= 100;

    useEffect(() => {
        if (barRef.current) {
            barRef.current.style.width = `${percentage}%`;
        }
    }, [percentage]);

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 md:p-6 hover:border-blue-500/30 transition-all group relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest">Daily Usage</h3>
                <Search className={`h-5 w-5 ${isAtLimit ? 'text-red-500' : 'text-blue-500'} group-hover:scale-110 transition-transform`} />
            </div>

            <div className="space-y-4">
                <div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl md:text-4xl font-black text-white">{used}</span>
                        <span className="text-gray-500 font-bold">/ {limit}</span>
                    </div>
                    <p className="text-xs text-gray-400 font-medium mt-1">Market Searches Today</p>
                </div>

                <div className="relative pt-1">
                    <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-800">
                        <div
                            ref={barRef}
                            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-blue-600'
                                }`}
                        ></div>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-gray-500 bg-gray-800/50 p-2 rounded-lg">
                    <Info className="h-3 w-3 flex-shrink-0" />
                    <span>Resets at midnight UTC. {isAtLimit ? 'Upgrade for more searches.' : 'Usage follows policy-compliant API limits.'}</span>
                </div>
            </div>

            {/* Background Accent */}
            <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl -mr-16 -mt-16 opacity-10 transition-colors ${isAtLimit ? 'bg-red-500' : 'bg-blue-500'
                }`} />
        </div>
    );
}
