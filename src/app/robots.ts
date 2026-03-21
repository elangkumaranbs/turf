import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/admin/',
                    '/owner/',
                    '/dashboard/',
                    '/api/',
                ],
            },
        ],
        sitemap: 'https://turfgameden.com/sitemap.xml',
    };
}
