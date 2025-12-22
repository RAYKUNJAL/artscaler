'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
    Image,
    Upload,
    X,
    CheckCircle,
    Info,
    DollarSign,
    Box,
    Palette
} from 'lucide-react';
import Link from 'next/link';

export default function AddArtworkPage() {
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUploading(true);
        // Simulate upload
        setTimeout(() => {
            setIsUploading(false);
            setSuccess(true);
        }, 1500);
    };

    if (success) {
        return (
            <DashboardLayout>
                <div className="max-w-2xl mx-auto py-20 text-center">
                    <div className="h-20 w-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="h-10 w-10 text-green-500" />
                    </div>
                    <h1 className="text-3xl font-black text-white mb-4 uppercase">Artwork Added!</h1>
                    <p className="text-gray-400 mb-8">Your masterpiece has been successfully added to your studio inventory.</p>
                    <div className="flex gap-4 justify-center">
                        <Link
                            href="/studio"
                            className="px-8 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white font-bold hover:border-gray-700 transition-all"
                        >
                            Back to Studio
                        </Link>
                        <button
                            onClick={() => setSuccess(false)}
                            className="px-8 py-3 bg-blue-600 rounded-xl text-white font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20"
                        >
                            Add Another
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Add New <span className="text-blue-500">Artwork</span></h1>
                    <p className="text-gray-400">Initialize your artwork in the global pulse tracking system.</p>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column: Image Upload */}
                    <div className="md:col-span-1">
                        <div className="aspect-square bg-gray-900 border-2 border-dashed border-gray-800 rounded-3xl flex flex-col items-center justify-center p-8 text-center group hover:border-blue-500/50 transition-all cursor-pointer">
                            <div className="h-16 w-16 bg-gray-800 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Upload className="h-8 w-8 text-gray-400" />
                            </div>
                            <span className="text-sm font-bold text-white mb-1">Click to Upload</span>
                            <span className="text-xs text-gray-500">PNG, JPG up to 10MB</span>
                        </div>
                    </div>

                    {/* Right Column: Details */}
                    <div className="md:col-span-2 space-y-6 bg-gray-900/50 border border-gray-800 rounded-3xl p-8">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Artwork Title</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                                placeholder="e.g. Abstract Sunset Over Pacific"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Target Price ($)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                    <input
                                        type="number"
                                        required
                                        className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                                        placeholder="0.00"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Category</label>
                                <select className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all appearance-none">
                                    <option>Originalized Painting</option>
                                    <option>Limited Edition Print</option>
                                    <option>Canvas Wrap</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Description / Story</label>
                            <textarea
                                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all h-32"
                                placeholder="The inspiration behind this piece..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="pt-4 border-t border-gray-800 flex items-center justify-between">
                            <span className="text-xs text-gray-500 flex items-center gap-2">
                                <Info className="h-4 w-4" />
                                This artwork will be tracked in your Pulse dashboard.
                            </span>
                            <button
                                type="submit"
                                disabled={isUploading}
                                className="px-10 py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                            >
                                {isUploading ? 'Initializing...' : 'Add to Studio'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
