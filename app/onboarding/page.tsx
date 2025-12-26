'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Check, Loader2, Sparkles, LayoutGrid, Maximize, Search, ArrowRight } from 'lucide-react';

const STYLE_OPTIONS = [
    { value: "abstract", label: "Abstract", icon: "🎨" },
    { value: "landscape", label: "Landscape", icon: "🏞️" },
    { value: "portrait", label: "Portrait", icon: "👤" },
    { value: "pop_art", label: "Pop Art/Fan Art", icon: "🚀" },
    { value: "surrealism", label: "Surrealism", icon: "👁️" },
    { value: "impressionism", label: "Impressionism", icon: "🌸" },
    { value: "mixed_media", label: "Mixed Media", icon: "🧵" },
    { value: "still_life", label: "Still Life", icon: "🍎" },
    { value: "animal", label: "Animal Art", icon: "🐾" },
    { value: "urban", label: "Urban/Cityscape", icon: "🏙️" },
    { value: "other", label: "Other", icon: "✨" }
];

const SIZE_OPTIONS = [
    { value: "small", label: "Small (8×10 to 11×14)" },
    { value: "medium", label: "Medium (16×20 to 18×24)" },
    { value: "large", label: "Large (24×30 to 36×48)" },
    { value: "varied", label: "Varies" }
];

export default function OnboardingPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Preferences
    const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth/signup');
        }
    }, [user, authLoading, router]);

    const toggleStyle = (val: string) => {
        setSelectedStyles(prev =>
            prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
        );
    };

    const toggleSize = (val: string) => {
        setSelectedSizes(prev =>
            prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
        );
    };

    const handleSaveAndNext = async () => {
        if (step < 3) {
            setStep(step + 1);
            return;
        }

        // Final completion logic
        setLoading(true);
        try {
            // Save to user_profiles
            await supabase
                .from('user_profiles')
                .upsert({
                    id: user?.id,
                    onboarding_completed: true,
                }, { onConflict: 'id' });

            // Store preferences for UX Synergy
            if (typeof window !== 'undefined') {
                localStorage.setItem('artscaler_pref_styles', JSON.stringify(selectedStyles));
                localStorage.setItem('artscaler_pref_sizes', JSON.stringify(selectedSizes));
            }

            // Generate query for step 3 logic usually redirecting
            const primaryStyle = selectedStyles[0] || 'modern';
            const primarySize = selectedSizes[0] || '';
            const query = encodeURIComponent(`${primaryStyle} painting ${primarySize}`);

            router.push(`/market-scanner?q=${query}&onboarding=true`);
        } catch (error) {
            console.error('Onboarding save error:', error);
            router.push('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) return null;

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full -z-10 opacity-30">
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[150px] rounded-full"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-purple-600/20 blur-[150px] rounded-full"></div>
            </div>

            <div className="w-full max-w-2xl relative z-10">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full mb-6">
                        <Sparkles className="h-4 w-4 text-blue-400" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Personalizing your experience</span>
                    </div>
                    <div className="flex items-center justify-center gap-4 mb-4">
                        {[1, 2, 3].map(s => (
                            <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${s <= step ? 'w-12 bg-blue-500' : 'w-4 bg-white/10'}`}></div>
                        ))}
                    </div>
                </div>

                {/* Content Card */}
                <div className="bg-gray-900/40 backdrop-blur-2xl border border-white/5 rounded-[40px] p-10 md:p-16 shadow-2xl relative overflow-hidden">
                    {/* Step 1: Styles */}
                    {step === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-500">
                            <div className="text-center">
                                <h1 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight italic uppercase">What do you <span className="text-blue-500">create?</span></h1>
                                <p className="text-gray-400 font-medium">Help us tailor your market intelligence</p>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                {STYLE_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => toggleStyle(opt.value)}
                                        className={`p-6 rounded-3xl border transition-all flex flex-col items-center gap-4 group ${selectedStyles.includes(opt.value)
                                            ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/20'
                                            : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/10 hover:bg-white/10'}`}
                                    >
                                        <span className="text-3xl group-hover:scale-125 transition-transform">{opt.icon}</span>
                                        <span className="font-bold text-sm uppercase tracking-widest">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Sizes */}
                    {step === 2 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-500">
                            <div className="text-center">
                                <h1 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight italic uppercase">What <span className="text-purple-500">sizes</span> do you typically create?</h1>
                                <p className="text-gray-400 font-medium">We'll filter market data to match your formats</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {SIZE_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => toggleSize(opt.value)}
                                        className={`p-8 rounded-[32px] border transition-all flex items-center justify-between group ${selectedSizes.includes(opt.value)
                                            ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-600/20'
                                            : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/10 hover:bg-white/10'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedSizes.includes(opt.value) ? 'border-white bg-white/20' : 'border-white/10'}`}>
                                                {selectedSizes.includes(opt.value) && <Check className="h-4 w-4" />}
                                            </div>
                                            <span className="font-bold uppercase tracking-widest text-sm">{opt.label}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Run First Scan */}
                    {step === 3 && (
                        <div className="text-center space-y-10 animate-in fade-in zoom-in duration-500">
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-[32px] mx-auto flex items-center justify-center shadow-2xl animate-bounce">
                                <Search className="h-10 w-10 text-white" />
                            </div>

                            <div className="space-y-4">
                                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter italic uppercase">Let's run your <br /><span className="text-blue-500">first market scan</span></h1>
                                <p className="text-gray-400 font-medium max-w-md mx-auto leading-relaxed">
                                    We've pre-filled a search based on your preferences. Click below to see what's selling right now.
                                </p>
                            </div>

                            <div className="p-8 bg-blue-600/5 border border-blue-500/10 rounded-3xl inline-block w-full text-left">
                                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Auto-generated research query:</p>
                                <div className="text-xl font-mono text-blue-400 font-bold">
                                    {selectedStyles[0] || 'abstract'} {selectedSizes[0] || 'medium'} painting
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between gap-6">
                        {step > 1 ? (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="text-gray-500 font-black uppercase tracking-widest text-xs hover:text-white transition-colors"
                            >
                                Back
                            </button>
                        ) : (
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="text-gray-500 font-black uppercase tracking-widest text-xs hover:text-white transition-colors"
                            >
                                Skip Onboarding
                            </button>
                        )}

                        <button
                            onClick={handleSaveAndNext}
                            disabled={loading || (step === 1 && selectedStyles.length === 0) || (step === 2 && selectedSizes.length === 0)}
                            className="bg-white text-black px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 transition-all shadow-xl disabled:opacity-30 disabled:hover:scale-100 flex items-center gap-3"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    {step === 3 ? 'Run My First Scan' : 'Next Step'}
                                    <ArrowRight className="h-5 w-5" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
