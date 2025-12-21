'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
    Package,
    DollarSign,
    TrendingUp,
    FileText,
    Image,
    MessageSquare,
    Upload,
    Download,
    Eye,
    Edit,
    Trash2,
    Plus,
    ExternalLink,
    CheckCircle,
    Clock,
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function CustomerDashboard() {
    const [activeTab, setActiveTab] = useState<'inventory' | 'templates' | 'sales' | 'messages'>('inventory');
    const [inventory, setInventory] = useState([
        {
            id: '1',
            title: 'Abstract Ocean Waves',
            image: '/placeholder-art.jpg',
            status: 'available',
            price: 250,
            created: '2024-12-15',
            coaNumber: 'ART-2024-001'
        },
        {
            id: '2',
            title: 'Mountain Sunset',
            image: '/placeholder-art.jpg',
            status: 'sold',
            price: 180,
            soldDate: '2024-12-18',
            coaNumber: 'ART-2024-002'
        }
    ]);

    const [templates, setTemplates] = useState([
        { id: '1', name: 'Classic COA Template', type: 'coa', lastUsed: '2024-12-18' },
        { id: '2', name: 'Thank You Card - Warm', type: 'card', lastUsed: '2024-12-17' },
        { id: '3', name: 'Artist Logo - Blue', type: 'logo', lastUsed: '2024-12-16' }
    ]);

    const [sales, setSales] = useState([
        {
            id: '1',
            artwork: 'Mountain Sunset',
            buyer: 'artlover123',
            price: 180,
            fees: 24.15,
            profit: 155.85,
            date: '2024-12-18',
            status: 'shipped',
            tracking: '1Z999AA10123456784'
        }
    ]);

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">My Studio</h1>
                        <p className="text-gray-400">Manage your artwork, templates, and sales</p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href="/studio/coa-generator"
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all font-semibold"
                        >
                            <Plus className="h-4 w-4" />
                            New COA
                        </Link>
                        <Link
                            href="/studio/add-artwork"
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-all font-semibold"
                        >
                            <Upload className="h-4 w-4" />
                            Add Artwork
                        </Link>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm font-medium">Total Artworks</span>
                            <Package className="h-5 w-5 text-blue-500" />
                        </div>
                        <p className="text-3xl font-bold text-white">24</p>
                        <p className="text-xs text-gray-500 mt-1">12 available, 12 sold</p>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm font-medium">This Month</span>
                            <DollarSign className="h-5 w-5 text-green-500" />
                        </div>
                        <p className="text-3xl font-bold text-white">$1,240</p>
                        <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            +18% from last month
                        </p>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm font-medium">Active Listings</span>
                            <Eye className="h-5 w-5 text-purple-500" />
                        </div>
                        <p className="text-3xl font-bold text-white">8</p>
                        <p className="text-xs text-gray-500 mt-1">On eBay</p>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm font-medium">Pending Orders</span>
                            <Clock className="h-5 w-5 text-amber-500" />
                        </div>
                        <p className="text-3xl font-bold text-white">2</p>
                        <p className="text-xs text-amber-500 mt-1">Awaiting shipment</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-800">
                    <div className="flex gap-8">
                        {[
                            { id: 'inventory', label: 'Inventory', icon: Package },
                            { id: 'templates', label: 'Templates', icon: FileText },
                            { id: 'sales', label: 'Sales', icon: DollarSign },
                            { id: 'messages', label: 'Messages', icon: MessageSquare }
                        ].map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-4 py-3 font-semibold transition-all border-b-2 ${activeTab === tab.id
                                            ? 'border-blue-500 text-white'
                                            : 'border-transparent text-gray-500 hover:text-gray-300'
                                        }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Content */}
                <div>
                    {activeTab === 'inventory' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">Artwork Inventory</h2>
                                <div className="flex gap-2">
                                    <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-semibold transition-all">
                                        Filter
                                    </button>
                                    <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-semibold transition-all">
                                        <Download className="h-4 w-4 inline mr-2" />
                                        Export CSV
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {inventory.map(item => (
                                    <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all group">
                                        <div className="aspect-square bg-gray-800 relative">
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Image className="h-16 w-16 text-gray-700" />
                                            </div>
                                            {item.status === 'sold' && (
                                                <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                                                    SOLD
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-6">
                                            <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Price</span>
                                                    <span className="text-white font-semibold">${item.price}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">COA</span>
                                                    <span className="text-blue-400 font-mono text-xs">{item.coaNumber}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Created</span>
                                                    <span className="text-gray-300">{item.created}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 mt-4">
                                                <button className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-all">
                                                    <Eye className="h-4 w-4 inline mr-1" />
                                                    View
                                                </button>
                                                <button className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-all">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button className="p-2 bg-gray-800 hover:bg-red-900 text-white rounded-lg transition-all">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'templates' && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-white mb-6">Saved Templates</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {templates.map(template => (
                                    <div key={template.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-purple-500/50 transition-all">
                                        <div className="flex items-start justify-between mb-4">
                                            <FileText className="h-8 w-8 text-purple-500" />
                                            <span className="px-2 py-1 bg-purple-900/30 text-purple-400 text-xs font-bold rounded uppercase">
                                                {template.type}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-2">{template.name}</h3>
                                        <p className="text-sm text-gray-400 mb-4">Last used: {template.lastUsed}</p>
                                        <div className="flex gap-2">
                                            <button className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-semibold transition-all">
                                                Use Template
                                            </button>
                                            <button className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-all">
                                                <Edit className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'sales' && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-white mb-6">Recent Sales</h2>
                            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-gray-800/50 text-gray-400 text-xs uppercase">
                                        <tr>
                                            <th className="px-6 py-4 text-left">Artwork</th>
                                            <th className="px-6 py-4 text-left">Buyer</th>
                                            <th className="px-6 py-4 text-right">Price</th>
                                            <th className="px-6 py-4 text-right">Profit</th>
                                            <th className="px-6 py-4 text-center">Status</th>
                                            <th className="px-6 py-4 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {sales.map(sale => (
                                            <tr key={sale.id} className="hover:bg-gray-800/30 transition-colors">
                                                <td className="px-6 py-4 text-white font-semibold">{sale.artwork}</td>
                                                <td className="px-6 py-4 text-gray-300">{sale.buyer}</td>
                                                <td className="px-6 py-4 text-right text-white font-semibold">${sale.price}</td>
                                                <td className="px-6 py-4 text-right text-green-500 font-semibold">${sale.profit}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="px-3 py-1 bg-green-900/30 text-green-400 text-xs font-bold rounded-full">
                                                        {sale.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button className="text-blue-400 hover:text-blue-300 text-sm font-semibold">
                                                        <ExternalLink className="h-4 w-4 inline" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'messages' && (
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
                            <MessageSquare className="h-16 w-16 text-gray-700 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">AI Customer Support Coming Soon</h3>
                            <p className="text-gray-400 max-w-md mx-auto">
                                Auto-respond to buyer questions with AI-powered support. Available in Studio tier.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
