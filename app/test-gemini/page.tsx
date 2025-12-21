'use client';

import { useState } from 'react';
import { Sparkles, CheckCircle, XCircle } from 'lucide-react';
import { GeminiAIService } from '@/services/ai/gemini-service';

export default function TestGeminiPage() {
    const [testing, setTesting] = useState(false);
    const [results, setResults] = useState<any>(null);

    const runTests = async () => {
        setTesting(true);
        const testResults: any = {
            brandIdentity: null,
            thankYouCard: null,
            artworkDescription: null,
            errors: []
        };

        try {
            // Test 1: Brand Identity Generation
            console.log('Testing Brand Identity...');
            testResults.brandIdentity = await GeminiAIService.generateBrandIdentity({
                artistName: 'Test Artist',
                artStyle: 'abstract',
                medium: 'acrylic',
                targetAudience: 'Art collectors'
            });
            console.log('✓ Brand Identity:', testResults.brandIdentity);
        } catch (error) {
            console.error('✗ Brand Identity failed:', error);
            testResults.errors.push(`Brand Identity: ${error}`);
        }

        try {
            // Test 2: Thank You Card
            console.log('Testing Thank You Card...');
            testResults.thankYouCard = await GeminiAIService.generateThankYouCard({
                buyerName: 'John Doe',
                artworkTitle: 'Sunset Dreams',
                artistName: 'Test Artist',
                tone: 'warm'
            });
            console.log('✓ Thank You Card:', testResults.thankYouCard);
        } catch (error) {
            console.error('✗ Thank You Card failed:', error);
            testResults.errors.push(`Thank You Card: ${error}`);
        }

        try {
            // Test 3: Artwork Description
            console.log('Testing Artwork Description...');
            testResults.artworkDescription = await GeminiAIService.generateArtworkDescription({
                title: 'Ocean Waves',
                medium: 'oil on canvas',
                size: '24x36 inches',
                style: 'impressionism',
                colors: ['blue', 'white', 'turquoise']
            });
            console.log('✓ Artwork Description:', testResults.artworkDescription);
        } catch (error) {
            console.error('✗ Artwork Description failed:', error);
            testResults.errors.push(`Artwork Description: ${error}`);
        }

        setResults(testResults);
        setTesting(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-black text-white mb-4">
                        🧪 Gemini AI <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">Test Suite</span>
                    </h1>
                    <p className="text-xl text-gray-300">
                        Verify Google Gemini API integration
                    </p>
                </div>

                <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 mb-8">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-white mb-2">API Status</h2>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-gray-300">
                                Ready to test - API key configured server-side
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                            Click "Run All Tests" below to verify Gemini AI integration
                        </p>
                    </div>

                    <button
                        onClick={runTests}
                        disabled={testing}
                        className="w-full py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white font-black rounded-xl hover:shadow-2xl hover:shadow-green-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Sparkles className={`h-5 w-5 ${testing ? 'animate-spin' : ''}`} />
                        {testing ? 'Running Tests...' : 'Run All Tests'}
                    </button>
                </div>

                {results && (
                    <div className="space-y-6">
                        {/* Test Results */}
                        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-8">
                            <h3 className="text-xl font-bold text-white mb-6">Test Results</h3>

                            {/* Brand Identity */}
                            <div className="mb-6 p-4 bg-gray-800/50 rounded-xl">
                                <div className="flex items-center gap-2 mb-3">
                                    {results.brandIdentity ? (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-red-500" />
                                    )}
                                    <h4 className="font-bold text-white">Brand Identity Generation</h4>
                                </div>
                                {results.brandIdentity && (
                                    <div className="text-sm text-gray-300 space-y-2">
                                        <p><strong>Tagline:</strong> {results.brandIdentity.tagline}</p>
                                        <p><strong>Bio:</strong> {results.brandIdentity.bio}</p>
                                        <p><strong>Colors:</strong> {Object.values(results.brandIdentity.colorPalette).join(', ')}</p>
                                    </div>
                                )}
                            </div>

                            {/* Thank You Card */}
                            <div className="mb-6 p-4 bg-gray-800/50 rounded-xl">
                                <div className="flex items-center gap-2 mb-3">
                                    {results.thankYouCard ? (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-red-500" />
                                    )}
                                    <h4 className="font-bold text-white">Thank You Card Generation</h4>
                                </div>
                                {results.thankYouCard && (
                                    <div className="text-sm text-gray-300 space-y-2">
                                        <p><strong>Greeting:</strong> {results.thankYouCard.greeting}</p>
                                        <p><strong>Message:</strong> {results.thankYouCard.message}</p>
                                        <p><strong>Closing:</strong> {results.thankYouCard.closing}</p>
                                    </div>
                                )}
                            </div>

                            {/* Artwork Description */}
                            <div className="mb-6 p-4 bg-gray-800/50 rounded-xl">
                                <div className="flex items-center gap-2 mb-3">
                                    {results.artworkDescription ? (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-red-500" />
                                    )}
                                    <h4 className="font-bold text-white">Artwork Description Generation</h4>
                                </div>
                                {results.artworkDescription && (
                                    <div className="text-sm text-gray-300">
                                        <p>{results.artworkDescription}</p>
                                    </div>
                                )}
                            </div>

                            {/* Errors */}
                            {results.errors.length > 0 && (
                                <div className="p-4 bg-red-900/20 border border-red-600/30 rounded-xl">
                                    <h4 className="font-bold text-red-400 mb-2">Errors:</h4>
                                    <ul className="text-sm text-red-300 space-y-1">
                                        {results.errors.map((error: string, idx: number) => (
                                            <li key={idx}>• {error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Summary */}
                            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-600/30 rounded-xl">
                                <div className="text-center">
                                    <div className="text-4xl font-black text-white mb-2">
                                        {3 - results.errors.length}/3
                                    </div>
                                    <div className="text-gray-300">Tests Passed</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
