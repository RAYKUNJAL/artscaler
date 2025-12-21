'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Check, Loader2, Sparkles, Target, Search, Rocket } from 'lucide-react';

const ART_CATEGORIES = [
    'Canvas Art',
    'Street Art',
    'Vintage Prints',
    'Photography',
    'Contemporary',
    'Pop Culture',
    'Stencil & Airbrush',
    'Hand-Signed',
    'Limited Edition',
    'Abstract',
    'Minimalist',
    'Mixed Media',
];

export default function OnboardingPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Redirect to signup if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            console.log('No user found in onboarding, redirecting to signup');
            router.push('/auth/signup');
        }
    }, [user, authLoading, router]);

    // Step 2: Art categories
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    // Step 3: Initial keywords
    const [keywords, setKeywords] = useState<string[]>(['']);

    const toggleCategory = (category: string) => {
        setSelectedCategories((prev) =>
            prev.includes(category)
                ? prev.filter((c) => c !== category)
                : [...prev, category]
        );
    };

    const addKeyword = () => {
        if (keywords.length < 5) {
            setKeywords([...keywords, '']);
        }
    };

    const updateKeyword = (index: number, value: string) => {
        const newKeywords = [...keywords];
        newKeywords[index] = value;
        setKeywords(newKeywords);
    };

    const removeKeyword = (index: number) => {
        setKeywords(keywords.filter((_, i) => i !== index));
    };

    const handleComplete = async () => {
        if (!user) {
            console.error('No user found - redirecting to signup');
            alert('You must be logged in to complete onboarding. Redirecting to signup...');
            router.push('/auth/signup');
            return;
        }

        console.log('Starting onboarding completion for user:', user.id);
        setLoading(true);

        try {
            // Update user profile
            console.log('Updating user profile...');
            const { error: profileError } = await supabase
                .from('user_profiles')
                .update({
                    onboarding_completed: true,
                    onboarding_step: 4,
                })
                .eq('id', user.id);

            if (profileError) {
                console.error('Profile update error:', profileError);
                throw profileError;
            }
            console.log('✓ Profile updated');

            // Save keywords
            const validKeywords = keywords.filter((k) => k.trim() !== '');
            console.log('Saving keywords:', validKeywords);

            if (validKeywords.length > 0) {
                const keywordRecords = validKeywords.map((keyword) => ({
                    user_id: user.id,
                    keyword: keyword.trim().toLowerCase(),
                    is_active: true,
                }));

                const { error: keywordError } = await supabase
                    .from('user_keywords')
                    .insert(keywordRecords);

                if (keywordError) {
                    console.error('Keyword insert error:', keywordError);
                    // Don't throw - keywords are optional
                } else {
                    console.log('✓ Keywords saved');
                }
            }

            // Redirect to dashboard
            console.log('Redirecting to dashboard...');
            router.push('/dashboard');
        } catch (error) {
            console.error('Onboarding error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            alert(`Error completing onboarding: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const canProceed = () => {
        if (step === 2) return selectedCategories.length > 0;
        if (step === 3) return keywords.some((k) => k.trim() !== '');
        return true;
    };

    // Show loading state while checking auth
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-gray-300">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        {[1, 2, 3, 4].map((s) => (
                            <div
                                key={s}
                                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${s <= step
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : 'bg-gray-800 border-gray-700 text-gray-500'
                                    }`}
                            >
                                {s < step ? <Check className="h-5 w-5" /> : s}
                            </div>
                        ))}
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500"
                            style={{ width: `${(step / 4) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Content Card */}
                <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
                    {/* Step 1: Welcome */}
                    {step === 1 && (
                        <div className="text-center space-y-6">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 mb-4">
                                <Sparkles className="h-10 w-10 text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-white">Welcome to ArtScaler!</h2>
                            <p className="text-gray-300 text-lg max-w-lg mx-auto">
                                The #1 art research engine for eBay sellers. We track real-time demand,
                                bid velocity, and watch counts to maximize your sales.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                                <div className="bg-gray-800/50 rounded-xl p-4">
                                    <Target className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                                    <h3 className="font-semibold text-white mb-1">Pulse Tracking</h3>
                                    <p className="text-sm text-gray-400">
                                        Monitor live bid heatmaps and watch counts
                                    </p>
                                </div>
                                <div className="bg-gray-800/50 rounded-xl p-4">
                                    <Search className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                                    <h3 className="font-semibold text-white mb-1">Price ML</h3>
                                    <p className="text-sm text-gray-400">
                                        Predict sale prices with 94% accuracy
                                    </p>
                                </div>
                                <div className="bg-gray-800/50 rounded-xl p-4">
                                    <Rocket className="h-8 w-8 text-green-400 mx-auto mb-2" />
                                    <h3 className="font-semibold text-white mb-1">Auto Listing</h3>
                                    <p className="text-sm text-gray-400">
                                        Generate optimized templates in one click
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Art Categories */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">
                                    What types of art do you sell?
                                </h2>
                                <p className="text-gray-400">Select all that apply</p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {ART_CATEGORIES.map((category) => (
                                    <button
                                        key={category}
                                        onClick={() => toggleCategory(category)}
                                        className={`p-4 rounded-lg border-2 transition-all ${selectedCategories.includes(category)
                                            ? 'bg-blue-600/20 border-blue-600 text-blue-400'
                                            : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-gray-600'
                                            }`}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Initial Keywords */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">
                                    Pulse Keywords
                                </h2>
                                <p className="text-gray-400">
                                    Which niches should we pulse first? Add 3-5 keywords.
                                </p>
                            </div>
                            <div className="space-y-3">
                                {keywords.map((keyword, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={keyword}
                                            onChange={(e) => updateKeyword(index, e.target.value)}
                                            placeholder={`Keyword ${index + 1} (e.g., "banksy art")`}
                                            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            data-testid={`keyword-input-${index}`}
                                        />
                                        {keywords.length > 1 && (
                                            <button
                                                onClick={() => removeKeyword(index)}
                                                className="px-4 py-3 bg-red-900/20 border border-red-700/50 rounded-lg text-red-400 hover:bg-red-900/30 transition-all"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {keywords.length < 5 && (
                                    <button
                                        onClick={addKeyword}
                                        className="w-full py-3 border-2 border-dashed border-gray-700 rounded-lg text-gray-400 hover:border-gray-600 hover:text-gray-300 transition-all"
                                        data-testid="add-keyword-btn"
                                    >
                                        + Add another keyword
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 4: Ready to Launch */}
                    {step === 4 && (
                        <div className="text-center space-y-6">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-600 to-blue-600 mb-4">
                                <Rocket className="h-10 w-10 text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-white">System Ready!</h2>
                            <p className="text-gray-300 text-lg max-w-lg mx-auto">
                                Your eBay pulse monitor is initialized. We're scanning the markets now.
                            </p>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-800">
                        {step > 1 && (
                            <button
                                onClick={() => setStep(step - 1)}
                                disabled={loading}
                                className="px-6 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-all disabled:opacity-50"
                            >
                                Back
                            </button>
                        )}
                        <div className="flex-1" />
                        {step < 4 ? (
                            <button
                                onClick={() => setStep(step + 1)}
                                disabled={!canProceed()}
                                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                data-testid="continue-btn"
                            >
                                Continue
                            </button>
                        ) : (
                            <button
                                onClick={handleComplete}
                                disabled={loading}
                                className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
                                data-testid="go-to-dashboard-btn"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Syncing Pulse...
                                    </>
                                ) : (
                                    <>
                                        <Rocket className="h-5 w-5" />
                                        Enter Hub
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
