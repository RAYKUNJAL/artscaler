'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Palette,
    ArrowLeft,
    Plus,
    Trash2,
    Play,
    CheckCircle,
    SkipForward,
    RefreshCw,
    GripVertical,
    DollarSign,
    TrendingUp,
    Package,
    Sparkles,
    Download,
    Filter,
} from 'lucide-react';

interface QueueItem {
    id: string;
    style: string;
    size?: string;
    medium?: string;
    listingType: 'Auction' | 'BuyItNow' | 'Both';
    targetPrice: number;
    priceRangeLow?: number;
    priceRangeHigh?: number;
    estDemandScore: number;
    estWvs: number;
    competitionLevel: 'Low' | 'Medium' | 'High';
    priority: number;
    status: 'queued' | 'in_progress' | 'completed' | 'skipped';
    notes?: string;
    createdAt?: string;
}

interface QueueSummary {
    totalItems: number;
    byStatus: {
        queued: number;
        inProgress: number;
        completed: number;
        skipped: number;
    };
    estimatedRevenue: number;
    topStyle: string;
    avgDemandScore: number;
}

export default function PaintQueuePage() {
    const router = useRouter();
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [summary, setSummary] = useState<QueueSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [filter, setFilter] = useState<string>('all');
    const [showAddModal, setShowAddModal] = useState(false);

    // Form state for adding custom item
    const [newItem, setNewItem] = useState({
        style: '',
        size: '',
        medium: '',
        targetPrice: 200,
        notes: '',
    });

    useEffect(() => {
        loadQueue();
        loadSummary();
    }, []);

    const loadQueue = async () => {
        try {
            const res = await fetch('/api/paint-queue');
            const data = await res.json();
            if (data.success) {
                setQueue(data.queue || []);
            }
        } catch (err) {
            console.error('Error loading queue:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const loadSummary = async () => {
        try {
            const res = await fetch('/api/paint-queue?summary=true');
            const data = await res.json();
            if (data.success) {
                setSummary(data.summary);
            }
        } catch (err) {
            console.error('Error loading summary:', err);
        }
    };

    const generateQueue = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch('/api/paint-queue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'generate', weeklyCapacity: 5 }),
            });
            const data = await res.json();
            if (data.success) {
                await loadQueue();
                await loadSummary();
            }
        } catch (err) {
            console.error('Error generating queue:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    const updateStatus = async (itemId: string, status: string) => {
        try {
            const res = await fetch('/api/paint-queue', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId, status }),
            });
            if (res.ok) {
                setQueue(queue.map(item =>
                    item.id === itemId ? { ...item, status: status as any } : item
                ));
                loadSummary();
            }
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    const deleteItem = async (itemId: string) => {
        try {
            const res = await fetch(`/api/paint-queue?itemId=${itemId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setQueue(queue.filter(item => item.id !== itemId));
                loadSummary();
            }
        } catch (err) {
            console.error('Error deleting item:', err);
        }
    };

    const addCustomItem = async () => {
        try {
            const res = await fetch('/api/paint-queue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'add',
                    item: newItem
                }),
            });
            if (res.ok) {
                setShowAddModal(false);
                setNewItem({ style: '', size: '', medium: '', targetPrice: 200, notes: '' });
                loadQueue();
                loadSummary();
            }
        } catch (err) {
            console.error('Error adding item:', err);
        }
    };

    const clearCompleted = async () => {
        try {
            const res = await fetch('/api/paint-queue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'clear-completed' }),
            });
            if (res.ok) {
                loadQueue();
                loadSummary();
            }
        } catch (err) {
            console.error('Error clearing completed:', err);
        }
    };

    const filteredQueue = queue.filter(item => {
        if (filter === 'all') return true;
        return item.status === filter;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'queued': return 'bg-gray-700 text-gray-300';
            case 'in_progress': return 'bg-blue-600 text-white';
            case 'completed': return 'bg-green-600 text-white';
            case 'skipped': return 'bg-yellow-600 text-white';
            default: return 'bg-gray-700 text-gray-300';
        }
    };

    const getDemandColor = (score: number) => {
        if (score >= 70) return 'text-green-400';
        if (score >= 40) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getCompetitionBadge = (level: string) => {
        switch (level) {
            case 'Low': return 'bg-green-500/20 text-green-400';
            case 'Medium': return 'bg-yellow-500/20 text-yellow-400';
            case 'High': return 'bg-red-500/20 text-red-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-blue-950">
            {/* Header */}
            <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-600 rounded-lg">
                                <Palette className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">Paint Queue</h1>
                                <p className="text-sm text-gray-400">Your actionable painting list</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Add Custom
                        </button>
                        <button
                            onClick={generateQueue}
                            disabled={isGenerating}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isGenerating ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="h-4 w-4" />
                            )}
                            Generate Queue
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Package className="h-5 w-5 text-purple-400" />
                                <span className="text-gray-400 text-sm">Total Items</span>
                            </div>
                            <p className="text-3xl font-bold text-white">{summary.totalItems}</p>
                            <p className="text-sm text-gray-500 mt-1">
                                {summary.byStatus.queued} queued • {summary.byStatus.inProgress} in progress
                            </p>
                        </div>

                        <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <DollarSign className="h-5 w-5 text-green-400" />
                                <span className="text-gray-400 text-sm">Est. Revenue</span>
                            </div>
                            <p className="text-3xl font-bold text-white">${summary.estimatedRevenue.toLocaleString()}</p>
                            <p className="text-sm text-gray-500 mt-1">At target prices</p>
                        </div>

                        <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <TrendingUp className="h-5 w-5 text-blue-400" />
                                <span className="text-gray-400 text-sm">Avg Demand</span>
                            </div>
                            <p className={`text-3xl font-bold ${getDemandColor(summary.avgDemandScore)}`}>
                                {summary.avgDemandScore.toFixed(0)}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">Demand score</p>
                        </div>

                        <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <CheckCircle className="h-5 w-5 text-emerald-400" />
                                <span className="text-gray-400 text-sm">Completed</span>
                            </div>
                            <p className="text-3xl font-bold text-white">{summary.byStatus.completed}</p>
                            <p className="text-sm text-gray-500 mt-1">{summary.byStatus.skipped} skipped</p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <div className="flex bg-gray-800 rounded-lg p-1">
                            {['all', 'queued', 'in_progress', 'completed', 'skipped'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1.5 rounded text-sm transition-colors ${filter === f
                                            ? 'bg-purple-600 text-white'
                                            : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    {f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {summary && summary.byStatus.completed > 0 && (
                        <button
                            onClick={clearCompleted}
                            className="text-sm text-gray-400 hover:text-red-400 transition-colors"
                        >
                            Clear Completed
                        </button>
                    )}
                </div>

                {/* Queue List */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <RefreshCw className="h-8 w-8 text-purple-400 animate-spin" />
                    </div>
                ) : filteredQueue.length === 0 ? (
                    <div className="text-center py-20">
                        <Palette className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No items in queue</h3>
                        <p className="text-gray-400 mb-6">
                            Generate a queue based on market demand or add custom items
                        </p>
                        <button
                            onClick={generateQueue}
                            disabled={isGenerating}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
                        >
                            <Sparkles className="h-5 w-5" />
                            Generate Smart Queue
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredQueue.map((item, index) => (
                            <div
                                key={item.id}
                                className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6 hover:border-purple-500/30 transition-all group"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Drag handle */}
                                    <div className="flex-shrink-0 pt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
                                        <GripVertical className="h-5 w-5 text-gray-500" />
                                    </div>

                                    {/* Priority number */}
                                    <div className="flex-shrink-0 w-8 h-8 bg-purple-600/20 rounded-full flex items-center justify-center">
                                        <span className="text-purple-400 font-bold text-sm">{index + 1}</span>
                                    </div>

                                    {/* Main content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div>
                                                <h3 className="text-lg font-semibold text-white capitalize">
                                                    {item.style} {item.size && `• ${item.size}`}
                                                </h3>
                                                <p className="text-sm text-gray-400">
                                                    {item.medium && `${item.medium} • `}
                                                    {item.listingType}
                                                </p>
                                            </div>

                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                                {item.status === 'in_progress' ? 'In Progress' : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-6 text-sm">
                                            <div>
                                                <span className="text-gray-500">Target Price</span>
                                                <p className="text-white font-semibold">${item.targetPrice}</p>
                                                {item.priceRangeLow && item.priceRangeHigh && (
                                                    <p className="text-xs text-gray-500">
                                                        ${item.priceRangeLow} - ${item.priceRangeHigh}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <span className="text-gray-500">Demand Score</span>
                                                <p className={`font-semibold ${getDemandColor(item.estDemandScore)}`}>
                                                    {item.estDemandScore.toFixed(0)}/100
                                                </p>
                                            </div>

                                            <div>
                                                <span className="text-gray-500">WVS</span>
                                                <p className="text-white font-semibold">{item.estWvs.toFixed(2)}</p>
                                            </div>

                                            <span className={`px-2 py-0.5 rounded text-xs ${getCompetitionBadge(item.competitionLevel)}`}>
                                                {item.competitionLevel} Competition
                                            </span>
                                        </div>

                                        {item.notes && (
                                            <p className="mt-3 text-sm text-gray-400 italic">{item.notes}</p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex-shrink-0 flex items-center gap-2">
                                        {item.status === 'queued' && (
                                            <button
                                                onClick={() => updateStatus(item.id, 'in_progress')}
                                                className="p-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg transition-colors"
                                                title="Start"
                                            >
                                                <Play className="h-4 w-4" />
                                            </button>
                                        )}

                                        {item.status === 'in_progress' && (
                                            <button
                                                onClick={() => updateStatus(item.id, 'completed')}
                                                className="p-2 bg-green-600/20 hover:bg-green-600/40 text-green-400 rounded-lg transition-colors"
                                                title="Complete"
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                            </button>
                                        )}

                                        {(item.status === 'queued' || item.status === 'in_progress') && (
                                            <button
                                                onClick={() => updateStatus(item.id, 'skipped')}
                                                className="p-2 bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-400 rounded-lg transition-colors"
                                                title="Skip"
                                            >
                                                <SkipForward className="h-4 w-4" />
                                            </button>
                                        )}

                                        <button
                                            onClick={() => deleteItem(item.id)}
                                            className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Add Custom Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-white mb-6">Add Custom Item</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Style *</label>
                                <input
                                    type="text"
                                    value={newItem.style}
                                    onChange={(e) => setNewItem({ ...newItem, style: e.target.value })}
                                    placeholder="e.g., abstract, landscape"
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Size</label>
                                    <input
                                        type="text"
                                        value={newItem.size}
                                        onChange={(e) => setNewItem({ ...newItem, size: e.target.value })}
                                        placeholder="e.g., 24x36"
                                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Medium</label>
                                    <input
                                        type="text"
                                        value={newItem.medium}
                                        onChange={(e) => setNewItem({ ...newItem, medium: e.target.value })}
                                        placeholder="e.g., acrylic"
                                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Target Price ($)</label>
                                <input
                                    type="number"
                                    value={newItem.targetPrice}
                                    onChange={(e) => setNewItem({ ...newItem, targetPrice: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Notes</label>
                                <textarea
                                    value={newItem.notes}
                                    onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                                    placeholder="Any additional notes..."
                                    rows={2}
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={addCustomItem}
                                disabled={!newItem.style}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors disabled:opacity-50"
                            >
                                Add to Queue
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
