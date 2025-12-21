import { createServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { Sparkles, ArrowLeft, Share2 } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: { slug: string } }) {
    const supabase = await createServerClient();
    const { data: post } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', params.slug)
        .single();

    if (!post) return { title: 'Post Not Found' };

    return {
        title: `${post.title} | ArtIntel Analysis`,
        description: post.meta_description,
        openGraph: {
            title: post.title,
            description: post.meta_description,
            type: 'article',
            publishedTime: post.published_at,
            authors: [post.author_name],
        }
    };
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
    const supabase = await createServerClient();

    // Using await on params.slug for Next.js 15 compatibility if needed
    const { slug } = await params;

    const { data: post, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

    if (error || !post) {
        notFound();
    }

    // JSON-LD Schema for Google Fast Indexing
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        'headline': post.title,
        'image': post.featured_image_url || 'https://artintel.ai/og-image.jpg',
        'datePublished': post.published_at,
        'author': {
            '@type': 'Organization',
            'name': 'ArtIntel AI Research'
        },
        'publisher': {
            '@type': 'Organization',
            'name': 'ArtIntel',
            'logo': {
                '@type': 'ImageObject',
                'url': 'https://artintel.ai/logo.png'
            }
        },
        'description': post.meta_description,
        'mainEntityOfPage': {
            '@type': 'WebPage',
            '@id': `https://artintel.ai/blog/${post.slug}`
        }
    };

    return (
        <article className="min-h-screen bg-[#050505] text-white pt-32 pb-20 px-6">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div className="max-w-3xl mx-auto">
                <Link
                    href="/blog"
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-12 text-sm font-bold"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Feed
                </Link>

                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest">
                            {post.keywords?.[0] || 'Market Pulse'}
                        </span>
                        <span className="text-gray-600 text-[10px] font-black uppercase tracking-widest">
                            {new Date(post.published_at).toLocaleDateString()} • 5 min read
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black mb-8 leading-[1.1] tracking-tighter">
                        {post.title}
                    </h1>

                    <div className="flex items-center justify-between border-y border-gray-800 py-6 text-sm text-gray-500">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <Sparkles className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-white font-bold">{post.author_name}</p>
                                <p className="text-[10px] uppercase tracking-widest font-black">AI Intelligence Agent</p>
                            </div>
                        </div>
                        <button
                            aria-label="Share this analysis"
                            title="Share this analysis"
                            className="h-10 w-10 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center hover:bg-gray-800 transition-all"
                        >
                            <Share2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="prose prose-invert prose-blue max-w-none 
                    prose-headings:font-black prose-headings:tracking-tighter
                    prose-p:text-gray-300 prose-p:leading-relaxed prose-p:text-lg
                    prose-li:text-gray-300
                    prose-strong:text-white prose-strong:font-black
                    prose-img:rounded-3xl prose-img:border prose-img:border-gray-800
                ">
                    <ReactMarkdown>{post.content}</ReactMarkdown>
                </div>

                <div className="mt-20 p-10 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-purple-700 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px] rounded-full -mr-32 -mt-32" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="max-w-md">
                            <h3 className="text-3xl font-black mb-4 tracking-tighter">Scan your art for hidden value.</h3>
                            <p className="text-white/80 font-medium">Use our proprietary AI demand engine to see the exact velocity score of your style.</p>
                        </div>
                        <Link href="/pricing">
                            <button className="bg-white text-blue-600 font-black px-8 py-4 rounded-2xl whitespace-nowrap hover:scale-105 active:scale-95 transition-all shadow-2xl">
                                Unlock Professional Data
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </article>
    );
}
