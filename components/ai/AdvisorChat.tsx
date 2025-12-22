'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles, TrendingUp, Info, Lock } from 'lucide-react';
import { PricingService, TierLimits } from '@/services/pricing-service';
import { supabase } from '@/lib/supabase/client';
import PremiumPaywall from '../ui/PremiumPaywall';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

export default function AdvisorChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Hello! I'm your ArtIntel Market Advisor. Ask me anything about eBay price trends, high-demand styles, or optimal sizes to flip!"
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        checkAccess();
    }, []);

    const checkAccess = async () => {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) throw error;

            if (user) {
                const { limits } = await PricingService.getUserUsage(supabase, user.id);
                setHasAccess(limits.hasAIAdvisor);
            } else {
                setHasAccess(false);
            }
        } catch (err) {
            console.error('Error checking advisor access:', err);
            setHasAccess(false); // Default to no access on error
        }
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/chat/advisor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: input, history: messages })
            });

            const data = await res.json();

            const assistMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.response || "I'm having trouble analyzing the market right now."
            };

            setMessages(prev => [...prev, assistMsg]);
        } catch (err) {
            console.error('Chat error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-8 right-8 z-50">
            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    aria-label="Open AI Advisor Chat"
                    title="Open AI Advisor Chat"
                    className="group relative flex items-center justify-center w-16 h-16 bg-blue-600 hover:bg-blue-500 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95"
                >
                    {hasAccess === false ? (
                        <Lock className="h-7 w-7 text-white/50" />
                    ) : (
                        <MessageCircle className="h-8 w-8 text-white" />
                    )}
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500"></span>
                    </span>
                    <div className="absolute right-20 bg-gray-900 border border-gray-800 text-white text-xs font-bold py-2 px-4 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                        {hasAccess === false ? 'Premium Feature' : 'Talk to Market Advisor'}
                    </div>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="flex flex-col w-96 max-h-[600px] h-[600px] bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in duration-300">
                    {hasAccess === false ? (
                        <div className="flex flex-col h-full">
                            <div className="p-5 flex justify-end">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    aria-label="Close"
                                    title="Close"
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="flex-1 flex items-center justify-center px-6">
                                <PremiumPaywall
                                    title="AI Market Advisor"
                                    description="Get personalized, data-backed strategy from our AI expert. Exclusive to Artist, Studio, and Empire plans."
                                    icon="advisor"
                                />
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className="p-5 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                        <Bot className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-sm">ArtIntel Advisor</h3>
                                        <div className="flex items-center gap-1">
                                            <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Online Context</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    aria-label="Close Chat"
                                    title="Close Chat"
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Quick Stats Banner */}
                            <div className="px-5 py-2 bg-blue-950/30 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-3 w-3 text-blue-400" />
                                    <span className="text-[10px] text-blue-300 font-bold uppercase tracking-tighter">Global Pulse Active</span>
                                </div>
                                <Info className="h-3 w-3 text-gray-500 cursor-help" />
                            </div>

                            {/* Messages Body */}
                            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-gray-800">
                                {messages.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <div className={`h-8 w-8 rounded-xl flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-gray-800' : 'bg-blue-600/20'}`}>
                                                {msg.role === 'user' ? <User className="h-4 w-4 text-gray-400" /> : <Sparkles className="h-4 w-4 text-blue-400" />}
                                            </div>
                                            <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                                ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-500/10'
                                                : 'bg-gray-800/50 text-gray-200 border border-gray-700/50 rounded-tl-none'
                                                }`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {loading && (
                                    <div className="flex justify-start">
                                        <div className="flex gap-3 max-w-[85%]">
                                            <div className="h-8 w-8 rounded-xl bg-blue-600/20 flex items-center justify-center">
                                                <Bot className="h-4 w-4 text-blue-400" />
                                            </div>
                                            <div className="p-4 rounded-2xl bg-gray-800/50 flex gap-1 items-center">
                                                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="p-5 border-t border-white/5 bg-gray-900/50">
                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="Ask about market trends..."
                                        className="w-full bg-gray-800/80 border border-gray-700/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-2xl py-3 pl-4 pr-12 text-sm text-white placeholder-gray-500 outline-none transition-all"
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={!input.trim() || loading}
                                        aria-label="Send message"
                                        title="Send message"
                                        className="absolute right-2 top-2 h-8 w-8 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 rounded-xl flex items-center justify-center text-white transition-all active:scale-90"
                                    >
                                        <Send className="h-4 w-4" />
                                    </button>
                                </div>
                                <p className="mt-3 text-[10px] text-center text-gray-500 uppercase tracking-widest">Powered by Pulse Intelligence</p>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
