'use client';

import { useState, useRef, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
    Send,
    Bot,
    User,
    Sparkles,
    TrendingUp,
    Target,
    Zap,
    Loader2,
    MessageSquare,
    RefreshCw,
    Plus,
    History,
    ChevronRight,
    Search
} from 'lucide-react';

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
    id: string;
}

interface CoachSession {
    id: string;
    title: string;
    last_message: string;
    updated_at: string;
}

export default function ArtCoachPage() {
    const [sessions, setSessions] = useState<CoachSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [stats, setStats] = useState({
        monthlyTarget: 0,
        activeStyles: [] as string[],
        pulseVelocity: 0
    });

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        fetchStats();
        fetchSessions();

        // Handle pre-filled prompt from query params
        const params = new URLSearchParams(window.location.search);
        const prompt = params.get('prompt');
        if (prompt) {
            setInput(prompt);
        }
    }, []);

    const fetchSessions = async () => {
        try {
            const res = await fetch('/api/art-coach/chat');
            const data = await res.json();
            if (data.success) {
                setSessions(data.sessions);
            }
        } catch (err) {
            console.error('Error fetching sessions:', err);
        } finally {
            setIsInitialLoading(false);
        }
    };

    const fetchSessionMessages = async (sessionId: string) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/art-coach/chat?sessionId=${sessionId}`);
            const data = await res.json();
            if (data.success) {
                setMessages(data.messages.map((m: any) => ({
                    role: m.role,
                    text: m.content,
                    id: m.id
                })));
                setCurrentSessionId(sessionId);
            }
        } catch (err) {
            console.error('Error fetching session messages:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/revenue-plan?progress=true');
            const data = await res.json();
            if (data.success && data.plan) {
                setStats({
                    monthlyTarget: data.plan.target_monthly || data.plan.targetMonthly || 0,
                    activeStyles: data.plan.breakdown?.map((b: any) => b.style) || [],
                    pulseVelocity: 3.8
                });
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    const handleNewSession = () => {
        setCurrentSessionId(null);
        setMessages([
            {
                role: 'model',
                text: "Starting a fresh coaching session. What's on your mind today? We can talk about your revenue goals, trending subjects, or eBay listing optimization.",
                id: 'welcome-' + Date.now()
            }
        ]);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg: ChatMessage = {
            role: 'user',
            text: input,
            id: 'temp-' + Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/art-coach/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: input,
                    sessionId: currentSessionId
                })
            });

            const data = await res.json();
            if (data.success) {
                const coachMsg: ChatMessage = {
                    role: 'model',
                    text: data.advice,
                    id: data.id || (Date.now() + 1).toString()
                };
                setMessages(prev => [...prev, coachMsg]);

                if (!currentSessionId && data.sessionId) {
                    setCurrentSessionId(data.sessionId);
                    fetchSessions(); // Refresh list to show new session
                }
            }
        } catch (err) {
            console.error('Chat error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-120px)] overflow-hidden">

                {/* Session List Sidebar (Desktop) */}
                <div className="hidden lg:flex w-72 flex-col bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                    <div className="p-4 border-b border-gray-800">
                        <button
                            onClick={handleNewSession}
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-2.5 text-sm font-bold transition-all shadow-lg shadow-blue-600/20"
                        >
                            <Plus className="h-4 w-4" />
                            New Coaching
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                        <div className="px-3 py-2 text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <History className="h-3 w-3" />
                            Session Memory
                        </div>

                        {isInitialLoading ? (
                            <div className="p-4 flex flex-col items-center gap-2">
                                <Loader2 className="h-5 w-5 text-gray-600 animate-spin" />
                                <span className="text-[10px] text-gray-600 font-bold">Syncing Hub...</span>
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                                <p className="text-xs text-gray-600">No previous sessions found. Start your first one!</p>
                            </div>
                        ) : (
                            sessions.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => fetchSessionMessages(s.id)}
                                    className={`w-full text-left p-3 rounded-xl transition-all group ${currentSessionId === s.id
                                        ? 'bg-blue-600 text-white'
                                        : 'hover:bg-gray-900 border border-transparent hover:border-gray-800'
                                        }`}
                                >
                                    <h4 className={`text-xs font-bold truncate ${currentSessionId === s.id ? 'text-white' : 'text-gray-300'}`}>
                                        {s.title}
                                    </h4>
                                    <p className={`text-[10px] mt-1 truncate ${currentSessionId === s.id ? 'text-blue-100' : 'text-gray-500'}`}>
                                        {s.last_message || 'No messages yet'}
                                    </p>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className={`text-[8px] font-bold ${currentSessionId === s.id ? 'text-blue-200' : 'text-gray-600'}`}>
                                            {new Date(s.updated_at).toLocaleDateString()}
                                        </span>
                                        <ChevronRight className={`h-3 w-3 transition-transform ${currentSessionId === s.id ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-2xl overflow-hidden shadow-2xl relative">

                    {/* Chat Header */}
                    <div className="p-4 border-b border-gray-800 bg-gray-900/80 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                                <Bot className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white leading-tight">Art Pulse Coach</h2>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-[10px] text-green-400 font-black uppercase tracking-widest">Connected to Market Feed</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={fetchSessions} className="p-2 text-gray-500 hover:text-white transition-colors" title="Reload History">
                                <RefreshCw className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        {messages.length === 0 && !isLoading && (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
                                    <MessageSquare className="h-8 w-8 text-gray-600" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">Art Strategy Coach</h3>
                                <p className="text-sm text-gray-500 max-w-xs">
                                    Ask anything about eBay sales, pricing strategies, or trending art subjects.
                                </p>
                            </div>
                        )}

                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 ${msg.role === 'user' ? 'bg-gray-700' : 'bg-blue-600 shadow-md shadow-blue-600/10'
                                        }`}>
                                        {msg.role === 'user' ? <User className="h-4 w-4 text-gray-300" /> : <Bot className="h-4 w-4 text-white" />}
                                    </div>
                                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none shadow-lg'
                                        : 'bg-gray-800/80 text-gray-100 border border-gray-700/50 rounded-tl-none'
                                        }`}>
                                        <div className="whitespace-pre-wrap">{msg.text}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="flex gap-3 max-w-[80%]">
                                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center animate-pulse mt-1">
                                        <Bot className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="bg-gray-800/80 p-4 rounded-2xl rounded-tl-none border border-gray-700/50 flex items-center gap-3">
                                        <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
                                        <span className="text-sm text-gray-400">Analyzing pulse velocities...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-6 border-t border-gray-800 bg-gray-900/80">
                        <form onSubmit={handleSendMessage} className="relative group">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Message your Art Pulse Coach..."
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl py-4 pl-6 pr-14 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all shadow-inner"
                                disabled={isLoading}
                                title="Chat Input"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition-all shadow-lg shadow-blue-600/20"
                                title="Send Message"
                            >
                                <Send className="h-5 w-5" />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right Context Sidebar (Desktop Only) */}
                <div className="hidden xl:flex w-80 flex-col gap-6 overflow-y-auto custom-scrollbar">

                    {/* Real-time Indicators */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg">
                        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            Hub Context
                        </h3>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-green-500/10 rounded-lg">
                                    <Target className="h-5 w-5 text-green-500" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-black text-gray-500 uppercase truncate">Revenue Goal</p>
                                    <p className="text-lg font-black text-white">${stats.monthlyTarget.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <TrendingUp className="h-5 w-5 text-blue-500" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-black text-gray-500 uppercase truncate">Market Pulse</p>
                                    <p className="text-lg font-black text-white">{stats.pulseVelocity} WVS</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-800">
                            <p className="text-[10px] font-black text-gray-500 uppercase mb-4">Focus Categories</p>
                            <div className="flex flex-wrap gap-2">
                                {stats.activeStyles.length > 0 ? stats.activeStyles.map(s => (
                                    <span key={s} className="px-2.5 py-1 bg-gray-800 text-[10px] font-bold text-gray-300 rounded-md border border-gray-700">
                                        {s}
                                    </span>
                                )) : (
                                    <span className="text-[10px] text-gray-600 italic">No styles defined yet</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Prompts */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 rounded-2xl p-5 shadow-lg">
                        <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Quick Strategies
                        </h3>
                        <div className="space-y-3">
                            {[
                                "What should I paint next to hit my goal?",
                                "How do I optimize my titles for SEO?",
                                "Which size is selling fastest today?"
                            ].map((hint, i) => (
                                <button
                                    key={i}
                                    onClick={() => setInput(hint)}
                                    className="w-full text-left p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 text-[11px] text-gray-400 border border-transparent hover:border-gray-700 transition-all leading-snug group"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="flex-1">{hint}</span>
                                        <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <Zap className="h-4 w-4 text-blue-400" />
                            <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Premium Feature</h4>
                        </div>
                        <p className="text-[11px] text-gray-400 leading-relaxed">
                            Your coach has full memory of these conversations. Reference past advice to track your business growth.
                        </p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
