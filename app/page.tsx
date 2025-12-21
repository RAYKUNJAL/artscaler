import Link from 'next/link';
import { TrendingUp, Search, DollarSign, Zap, Eye, Palette, Target, BarChart3, CheckCircle, Flame, Calendar, MousePointer2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-purple-950">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-1.5 mb-8">
            <Zap className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-blue-300">New: Real-Time eBay Completed Scraper Active</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6">
            The #1 Art Research
            <span className="block bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Engine for eBay Sellers
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-2xl mx-auto">
            ArtScaler uses AI to track sold listings, bid heatmaps, and watch counts.
            Stop guessing and start selling with data-driven price predictions.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
            >
              Start Free Scout Trial
              <TrendingUp className="h-5 w-5" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 bg-gray-800/50 backdrop-blur hover:bg-gray-700/50 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all border border-gray-700"
            >
              Sign In
              <Search className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Core Killers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 max-w-6xl mx-auto">
          <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-8 hover:border-blue-500/50 transition-all group">
            <div className="h-14 w-14 bg-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Bid & Watch Tracker</h3>
            <p className="text-gray-400 leading-relaxed">
              Track bid heatmaps and watch count velocity. Identify high-demand items before the auction ends.
            </p>
          </div>

          <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-8 hover:border-purple-500/50 transition-all group">
            <div className="h-14 w-14 bg-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Zap className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">AI Price Predictions</h3>
            <p className="text-gray-400 leading-relaxed">
              Our ML model analyzes 90 days of historical data to predict the final sale price with 94% accuracy.
            </p>
          </div>

          <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-8 hover:border-green-500/50 transition-all group">
            <div className="h-14 w-14 bg-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MousePointer2 className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">One-Click Templates</h3>
            <p className="text-gray-400 leading-relaxed">
              Automatically generate SEO-optimized eBay listing templates based on trending keywords.
            </p>
          </div>
        </div>

        {/* Membership Tiers */}
        <div className="mt-32 max-w-6xl mx-auto" id="pricing">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Membership Tiers
          </h2>
          <p className="text-gray-400 text-center mb-16">
            Choose the pulse that matches your business scale
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Scout */}
            <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-white mb-2">Free Scout</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold text-white">$0</span>
              </div>
              <p className="text-gray-400 text-sm mb-6">Perfect for casual research</p>
              <ul className="space-y-3 mb-8">
                {['10 Daily Scrapes', '5 Keywords Tracked', '7 Days Historical Data', 'CSV Export'].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-gray-300 text-sm">
                    <CheckCircle className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/signup"
                className="block w-full text-center py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
              >
                Start Scanning
              </Link>
            </div>

            {/* Pro Painter */}
            <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 backdrop-blur border-2 border-blue-500 rounded-2xl p-8 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                BEST SELLER
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Pro Painter</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold text-white">$29.99</span>
                <span className="text-gray-400">/mo</span>
              </div>
              <p className="text-gray-400 text-sm mb-6">For serious eBay sellers</p>
              <ul className="space-y-3 mb-8">
                {[
                  '500 Daily Scrapes',
                  '150 Keywords Tracked',
                  'ML Price Predictions',
                  'Auto Listing Generator',
                  'Competing Seller Tracker',
                  'Telegram Alerts',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-gray-300 text-sm">
                    <CheckCircle className="h-4 w-4 text-blue-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/signup"
                className="block w-full text-center py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors shadow-lg shadow-blue-500/20"
              >
                Go Pro Now
              </Link>
            </div>

            {/* Studio Empire */}
            <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-white mb-2">Studio Empire</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold text-white">$99.99</span>
                <span className="text-gray-400">/mo</span>
              </div>
              <p className="text-gray-400 text-sm mb-6">For high-volume art studios</p>
              <ul className="space-y-3 mb-8">
                {[
                  '5000 Daily Scrapes',
                  'Unlimited Historical Data',
                  'Custom Niche Discovery',
                  'White-Label Reports',
                  'Team Accounts (5)',
                  'API Access',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-gray-300 text-sm">
                    <CheckCircle className="h-4 w-4 text-purple-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/signup"
                className="block w-full text-center py-3 bg-purple-800 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
              >
                Launch Empire
              </Link>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">Real-Time eBay Pulse</h2>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Our engine doesn't just look at past sales. We analyze the **current pulse** of the art market by monitoring active auctions, bid velocity, and watcher accumulation in real-time.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span className="text-gray-300">Trending Niche Riser Detector</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                <span className="text-gray-300">Seasonal Trend Calendar</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-pink-500"></div>
                <span className="text-gray-300">Best Listing Time Recommender</span>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-gray-800 rounded-3xl p-8 aspect-video flex items-center justify-center relative group">
            <div className="absolute inset-0 bg-blue-500/5 blur-3xl group-hover:bg-blue-500/10 transition-all"></div>
            <Flame className="h-20 w-20 text-blue-500 animate-pulse" />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-32 pt-10 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-6 text-gray-500 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Flame className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-white">ArtScaler</span>
          </div>
          <div className="flex items-center gap-8">
            <Link href="/blog" className="hover:text-blue-400 font-bold transition-colors">Blog</Link>
            <Link href="/legal/terms" className="hover:text-blue-400 transition-colors">Terms</Link>
            <Link href="/legal/privacy" className="hover:text-blue-400 transition-colors">Privacy</Link>
            <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full border border-green-500/20">90-Day Money Back Guarantee</span>
          </div>
          <div className="text-gray-600">
            © 2025 ArtScaler. Version 2.0
          </div>
        </footer>
      </div>
    </div>
  );
}
