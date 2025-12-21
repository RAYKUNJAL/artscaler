import Link from 'next/link';
import { Home, Search, LayoutDashboard } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-8">
            <div className="max-w-md w-full text-center">
                <div className="mb-8">
                    <div className="text-8xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
                        404
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
                    <p className="text-gray-400">
                        The page you're looking for doesn't exist or has been moved.
                    </p>
                </div>

                <div className="space-y-3">
                    <Link
                        href="/dashboard"
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all"
                    >
                        <LayoutDashboard className="h-5 w-5" />
                        Go to Dashboard
                    </Link>
                    <Link
                        href="/market-scanner"
                        className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all border border-gray-700"
                    >
                        <Search className="h-5 w-5" />
                        Market Scanner
                    </Link>
                    <Link
                        href="/"
                        className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-white px-6 py-3 rounded-lg font-semibold transition-all"
                    >
                        <Home className="h-5 w-5" />
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
