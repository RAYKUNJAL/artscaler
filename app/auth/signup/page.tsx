'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import Link from 'next/link';
import { Mail, Lock, User, Loader2, Chrome, Check, Eye, EyeOff, Zap } from 'lucide-react';

export default function SignupPage() {
    const { signUp, signInWithGoogle } = useAuth();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!acceptedTerms) {
            setError('Please accept the Terms of Service and Privacy Policy');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);
        setError('');

        const { error, data } = await signUp(email, password, fullName);

        if (error) {
            setError(error.message);
            setLoading(false);
        } else if (data?.user && !data.session) {
            // User created but email confirmation required
            setError('Account created! Please check your email to confirm your account before logging in.');
            setLoading(false);
        }
        // If successful with session, AuthProvider will handle redirect to onboarding
    };

    const handleGoogleSignIn = async () => {
        if (!acceptedTerms) {
            setError('Please accept the Terms of Service and Privacy Policy');
            return;
        }
        setLoading(true);
        await signInWithGoogle();
    };

    const passwordStrength = password.length >= 8 ? 'strong' : password.length >= 6 ? 'medium' : 'weak';

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
                            <Zap className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-2xl font-black text-white tracking-tighter uppercase italic">
                            ArtScaler
                        </span>
                    </Link>
                    <p className="text-blue-200 font-medium">Real-Time eBay Market Intelligence for Artists</p>
                    <div className="mt-4 flex items-center justify-center gap-4">
                        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Step 1: Account Setup</span>
                        </div>
                        <div className="w-4 h-px bg-white/10"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Onboarding</span>
                        <div className="w-4 h-px bg-white/10"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Dashboard</span>
                    </div>
                </div>

                {/* Signup Card */}
                <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-2xl font-bold text-white mb-6">Create your account</h2>

                    {error && (
                        <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 mb-6">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-12 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-1"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {password && (
                                <div className="mt-2 flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all ${passwordStrength === 'strong'
                                                ? 'bg-green-500 w-full'
                                                : passwordStrength === 'medium'
                                                    ? 'bg-yellow-500 w-2/3'
                                                    : 'bg-red-500 w-1/3'
                                                }`}
                                        />
                                    </div>
                                    <span className="text-xs text-gray-400 capitalize">{passwordStrength}</span>
                                </div>
                            )}
                        </div>

                        {/* Terms Acceptance */}
                        <div className="flex items-start gap-3">
                            <button
                                type="button"
                                onClick={() => setAcceptedTerms(!acceptedTerms)}
                                className={`mt-1 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${acceptedTerms
                                    ? 'bg-blue-600 border-blue-600'
                                    : 'bg-gray-800 border-gray-600 hover:border-gray-500'
                                    }`}
                            >
                                {acceptedTerms && <Check className="h-3 w-3 text-white" />}
                            </button>
                            <label className="text-sm text-gray-400 cursor-pointer" onClick={() => setAcceptedTerms(!acceptedTerms)}>
                                I agree to the{' '}
                                <Link href="/legal/terms" className="text-blue-400 hover:text-blue-300" onClick={(e) => e.stopPropagation()}>
                                    Terms of Service
                                </Link>{' '}
                                and{' '}
                                <Link href="/legal/privacy" className="text-blue-400 hover:text-blue-300" onClick={(e) => e.stopPropagation()}>
                                    Privacy Policy
                                </Link>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                'Create account'
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-gray-900/50 text-gray-400">Or continue with</span>
                        </div>
                    </div>

                    {/* Google Sign In */}
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="w-full bg-white text-gray-900 font-semibold py-3 rounded-lg hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Chrome className="h-5 w-5" />
                        Google
                    </button>

                    {/* Login Link */}
                    <p className="text-center text-gray-400 mt-6">
                        Already have an account?{' '}
                        <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 font-semibold">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
