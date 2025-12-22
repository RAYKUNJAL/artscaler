import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = 'https://artscaler.com'

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/api/',
                '/dashboard/', // Private user pages
                '/settings/',
                '/onboarding/',
                '/auth/',
                '/studio/*?*' // Prevent crawling with query params
            ],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
