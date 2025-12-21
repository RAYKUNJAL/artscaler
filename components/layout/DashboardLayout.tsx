'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu, Zap } from 'lucide-react';
import AdvisorChat from '../ai/AdvisorChat';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex h-screen bg-gray-950 overflow-hidden">
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800 fixed top-0 left-0 right-0 z-20 h-16">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                        <Zap className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent uppercase tracking-tighter">
                        ArtScaler
                    </span>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
                    aria-label="Open navigation menu"
                >
                    <Menu className="h-6 w-6" />
                </button>
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden lg:block h-full">
                <Sidebar />
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden flex">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />

                    {/* Sidebar */}
                    <div className="relative w-[300px] max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
                        <Sidebar
                            mobile
                            onClose={() => setIsMobileMenuOpen(false)}
                        />
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto w-full pt-16 lg:pt-0">
                <div className="container mx-auto p-4 lg:p-8 max-w-7xl">
                    {children}
                </div>
            </main>

            {/* AI Market Advisor Chat */}
            <AdvisorChat />
        </div>
    );
}
