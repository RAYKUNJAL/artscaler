import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://artscaler.com'

    // Static pages
    const routes = [
        '',
        '/pricing',
        '/features',
        '/gallery',
        '/blog',
        '/legal/terms',
        '/legal/privacy',
        '/legal/refunds',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }))

    // In a real app, you would fetch dynamic blog posts or public art styles here
    // const posts = await getBlogPosts()
    // const postUrls = ...

    return [...routes]
}
