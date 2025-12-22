import { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
    themeColor: '#000000',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
};

export const defaultMetadata: Metadata = {
    metadataBase: new URL('https://artscaler.com'),
    title: {
        default: 'ArtScaler | Data-Driven Strategies for Art Sellers',
        template: '%s | ArtScaler'
    },
    description: 'The #1 AI market intelligence platform for eBay art sellers. Predict prices, spot trends, and optimize listings with ArtScaler.',
    keywords: [
        'eBay Art', 'Art Analytics', 'Art Market Research', 'Artist Business Tools',
        'Sell Art Online', 'Art Pricing Calculator', 'eBay SEO', 'Art Trends 2025'
    ],
    authors: [{ name: 'ArtScaler Team' }],
    creator: 'ArtScaler',
    publisher: 'ArtScaler',
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://artscaler.com',
        title: 'ArtScaler | Dominate the eBay Art Market',
        description: 'Stop guessing. Start scaling. Use AI to price your art, find winning subjects, and automate your eBay listings.',
        siteName: 'ArtScaler',
        images: [
            {
                url: 'https://artscaler.com/og-image.jpg', // We should verify if this exists or create a placeholder
                width: 1200,
                height: 630,
                alt: 'ArtScaler Dashboard',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'ArtScaler | AI Art Market Intelligence',
        description: 'Maximize your art sales with data-driven insights.',
        images: ['https://artscaler.com/og-image.jpg'],
        creator: '@artscaler',
    },
    icons: {
        icon: '/favicon.ico',
        shortcut: '/favicon-16x16.png',
        apple: '/apple-touch-icon.png',
    },
    manifest: '/manifest.json',
};
