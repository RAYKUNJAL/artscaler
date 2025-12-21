'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Palette, Type, Sparkles, Download, Copy } from 'lucide-react';

export default function BrandGeneratorPage() {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        artistName: '',
        artStyle: 'abstract',
        medium: 'acrylic',
        targetAudience: ''
    });
    const [brandIdentity, setBrandIdentity] = useState<any>(null);

    const artStyles = [
        'Abstract', 'Realism', 'Impressionism', 'Expressionism', 'Surrealism',
        'Pop Art', 'Minimalism', 'Contemporary', 'Landscape', 'Portrait'
    ];

    const mediums = [
        'Acrylic', 'Oil', 'Watercolor', 'Mixed Media', 'Digital',
        'Charcoal', 'Pastel', 'Ink', 'Collage', 'Sculpture'
    ];

    const handleGenerate = async () => {
        if (!formData.artistName) {
            alert('Please enter your artist name');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/brand-generator', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Failed to generate brand identity');
            }

            const data = await response.json();

            if (data.success && data.brandIdentity) {
                setBrandIdentity(data.brandIdentity);
            } else {
                throw new Error(data.error || 'Failed to generate brand identity');
            }
        } catch (error) {
            console.error('Error generating brand:', error);
            alert('Failed to generate brand identity. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-left">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        AI Brand Generator
                    </h1>
                    <p className="text-gray-400">
                        Create a professional brand identity for your art business in seconds
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 sticky top-8">
                            <h2 className="text-xl font-bold text-white mb-6">Your Details</h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest text-[10px]">
                                        Artist Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.artistName}
                                        onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all font-bold"
                                        placeholder="Jane Artist"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest text-[10px]">
                                        Art Style
                                    </label>
                                    <select
                                        value={formData.artStyle}
                                        onChange={(e) => setFormData({ ...formData, artStyle: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 font-bold"
                                    >
                                        {artStyles.map(style => (
                                            <option key={style} value={style.toLowerCase()}>{style}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest text-[10px]">
                                        Primary Medium
                                    </label>
                                    <select
                                        value={formData.medium}
                                        onChange={(e) => setFormData({ ...formData, medium: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 font-bold"
                                    >
                                        {mediums.map(medium => (
                                            <option key={medium} value={medium.toLowerCase()}>{medium}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest text-[10px]">
                                        Target Audience (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.targetAudience}
                                        onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all font-bold"
                                        placeholder="Art collectors"
                                    />
                                </div>

                                <button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black rounded-xl hover:shadow-2xl hover:shadow-blue-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <Sparkles className="h-5 w-5" />
                                    {loading ? 'Generating...' : 'Generate Brand Identity'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="lg:col-span-2 space-y-6">
                        {brandIdentity ? (
                            <>
                                <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest">Tagline</h3>
                                        <button onClick={() => copyToClipboard(brandIdentity.tagline)} className="text-gray-500 hover:text-white transition-colors">
                                            <Copy className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <p className="text-2xl font-black text-blue-400 italic">"{brandIdentity.tagline}"</p>
                                </div>

                                <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest">Artist Bio</h3>
                                        <button onClick={() => copyToClipboard(brandIdentity.bio)} className="text-gray-500 hover:text-white transition-colors">
                                            <Copy className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <p className="text-gray-300 leading-relaxed">{brandIdentity.bio}</p>
                                </div>

                                <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
                                    <h3 className="text-sm font-black text-gray-500 mb-6 uppercase tracking-widest">Visual Strategy</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {Object.entries(brandIdentity.colorPalette || {}).map(([name, color]: [string, any]) => (
                                            <div key={name} className="space-y-2">
                                                <div className="w-full h-12 rounded-lg border border-gray-700 shadow-xl" style={{ backgroundColor: color }} />
                                                <div className="text-[10px] font-black text-white uppercase truncate">{name}</div>
                                                <div className="text-[10px] text-gray-500 font-mono">{color}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        const data = JSON.stringify(brandIdentity, null, 2);
                                        const blob = new Blob([data], { type: 'application/json' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `brand-identity.json`;
                                        a.click();
                                    }}
                                    className="w-full py-4 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-2 border border-gray-700"
                                >
                                    <Download className="h-4 w-4" />
                                    Export Brand Bible
                                </button>
                            </>
                        ) : (
                            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-24 text-center">
                                <Sparkles className="h-16 w-16 mx-auto mb-6 text-gray-700" />
                                <h3 className="text-xl font-bold text-white mb-2">Identity Engine Ready</h3>
                                <p className="text-gray-500 text-sm max-w-xs mx-auto">Input your studio details to generate professional branding.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
