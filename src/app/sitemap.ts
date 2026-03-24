import type { MetadataRoute } from 'next';
import { getTurfs } from '@/lib/firebase/firestore';

const SITE_URL = 'https://turfgameden.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: SITE_URL,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${SITE_URL}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${SITE_URL}/services`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${SITE_URL}/contact`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${SITE_URL}/turfs`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${SITE_URL}/login`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${SITE_URL}/signup`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
    ];

    try {
        const turfs = await getTurfs();
        const turfRoutes: MetadataRoute.Sitemap = turfs.map((turf) => {
            const lastModDate = turf.createdAt ? new Date(turf.createdAt) : new Date();
            return {
                url: `${SITE_URL}/turfs/${turf.id}`,
                lastModified: lastModDate,
                changeFrequency: 'weekly',
                priority: 0.7,
            };
        });

        return [...staticRoutes, ...turfRoutes];
    } catch (error) {
        console.error('Error fetching turfs for sitemap:', error);
        return staticRoutes;
    }
}
