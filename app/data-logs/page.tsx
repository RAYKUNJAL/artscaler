'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase/client';
import {
    Database,
    Clock,
    CheckCircle,
    XCircle,
    Activity,
    RefreshCcw,
    ChevronRight,
    Search,
    Brain,
    Upload
} from 'lucide-react';

interface LogEntry {
    id: string;
    keyword: string;
    status: 'pending' | 'scraping' | 'completed' | 'failed';
    items_found: number;
    created_at: string;
    started_at?: string;
    completed_at?: string;
    error_message?: string;
}

export default function DataLogsPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('scrape_jobs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (data) setLogs(data);
        setLoading(false);
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'failed': return 'bg-red-500/10 text-red-400 border-red-500/20';
            case 'scraping': return 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse';
            default: return 'bg-gray-800 text-gray-400 border-gray-700';
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">System Activity Logs</h1>
                        <p className="text-gray-400">Monitor background intelligence pipelines and data ingestion jobs.</p>
                    </div>
                    <button
                        onClick={fetchLogs}
                        className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 transition-all"
                    >
                        <RefreshCcw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl">
                        <div className="flex items-center gap-3 mb-2">
                            <Search className="h-5 w-5 text-blue-400" />
                            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Market Scans</span>
                        </div>
                        <p className="text-3xl font-black text-white">{logs.length}</p>
                        <p className="text-xs text-green-500 mt-1">Last 30 days active</p>
                    </div>
                    <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl">
                        <div className="flex items-center gap-3 mb-2">
                            <Brain className="h-5 w-5 text-purple-400" />
                            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">AI Analyses</span>
                        </div>
                        <p className="text-3xl font-black text-white">{logs.filter(l => l.status === 'completed').length}</p>
                        <p className="text-xs text-gray-500 mt-1">Processed signals</p>
                    </div>
                    <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl">
                        <div className="flex items-center gap-3 mb-2">
                            <Upload className="h-5 w-5 text-green-400" />
                            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Inbound Items</span>
                        </div>
                        <p className="text-3xl font-black text-white">
                            {logs.reduce((acc, curr) => acc + (curr.items_found || 0), 0)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Data points synced</p>
                    </div>
                    <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl">
                        <div className="flex items-center gap-3 mb-2">
                            <Activity className="h-5 w-5 text-amber-400" />
                            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Success Rate</span>
                        </div>
                        <p className="text-3xl font-black text-white">
                            {logs.length > 0 ? Math.round((logs.filter(l => l.status === 'completed').length / logs.length) * 100) : 0}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Uptime reliability</p>
                    </div>
                </div>

                <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-800/80">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Intelligence Job</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Signals Found</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Started</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Duration</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-800/20 transition-all">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-white">Market Scan: {log.keyword}</span>
                                                <span className="text-[10px] text-gray-500 font-mono">{log.id}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusStyles(log.status)}`}>
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-white">{log.items_found || 0}</td>
                                        <td className="px-6 py-4 text-sm text-gray-400">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {log.completed_at && log.started_at
                                                ? `${Math.round((new Date(log.completed_at).getTime() - new Date(log.started_at).getTime()) / 1000)}s`
                                                : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
