import type { Metadata } from 'next';
import { getTurfById } from '@/lib/firebase/firestore';
import { getReviewsForTurf } from '@/lib/firebase/reviews';

const SITE_URL = 'https://turfgameden.com';

interface Props {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const turf = await getTurfById(id).catch(() => null);

    if (!turf) {
        return {
            title: 'Cricket Turf Booking | TurfGameDen',
            description: 'Book a premium cricket turf near you on TurfGameDen.',
        };
    }

    const locationStr = [turf.address, turf.city].filter(Boolean).join(', ') || turf.location || 'Tamil Nadu';
    const ratingText =
        turf.averageRating && turf.reviewCount
            ? ` Rated ${turf.averageRating.toFixed(1)}/5 by ${turf.reviewCount} players.`
            : '';

    return {
        title: `${turf.name} – Book Cricket Turf in ${turf.city || turf.location || 'Tamil Nadu'} | TurfGameDen`,
        description: `Book ${turf.name} in ${locationStr}.${ratingText} Starting at ₹${turf.pricePerHour}/hr. ${turf.wicketType} wicket pitch. Instant online booking on TurfGameDen.`,
        keywords: [
            turf.name,
            `${turf.name} booking`,
            `cricket turf ${turf.city || turf.location}`,
            `turf booking ${turf.city || turf.location}`,
            `${turf.city || turf.location} cricket ground`,
            `${turf.wicketType} wicket turf`,
            'online turf booking', 'TurfGameDen', 'Elangkumaran BS', 'elangkumaranbs',
        ],
        alternates: { canonical: `/turfs/${id}` },
        openGraph: {
            title: `${turf.name} – Cricket Turf in ${turf.city || turf.location || 'Tamil Nadu'}`,
            description: `Book ${turf.name} on TurfGameDen. ${locationStr}.${ratingText} From ₹${turf.pricePerHour}/hr.`,
            url: `/turfs/${id}`,
            type: 'website',
            images: turf.images?.[0]
                ? [{ url: turf.images[0], width: 1200, height: 630, alt: turf.name }]
                : [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: 'TurfGameDen' }],
        },
        twitter: {
            card: 'summary_large_image',
            title: `${turf.name} | TurfGameDen`,
            description: `Book ${turf.name} in ${locationStr}. From ₹${turf.pricePerHour}/hr. Verified cricket turf.`,
        },
    };
}

export default async function TurfDetailLayout({ children, params }: Props) {
    const { id } = await params;

    // Fetch turf + reviews server-side to inject JSON-LD
    const [turf, reviews] = await Promise.all([
        getTurfById(id).catch(() => null),
        getReviewsForTurf(id).catch(() => []),
    ]);

    const locationStr = turf
        ? ([turf.address, turf.city].filter(Boolean).join(', ') || turf.location || 'Tamil Nadu')
        : 'Tamil Nadu';

    // Build SportsActivityLocation + AggregateRating + individual Review JSON-LD
    const jsonLd = turf
        ? {
              '@context': 'https://schema.org',
              '@graph': [
                  {
                      '@type': 'SportsActivityLocation',
                      name: turf.name,
                      url: `${SITE_URL}/turfs/${id}`,
                      description: turf.description || `Book ${turf.name} – a premium cricket turf in ${locationStr}. ${turf.wicketType} wicket pitch, from ₹${turf.pricePerHour}/hr.`,
                      image: turf.images?.[0] || `${SITE_URL}/og-image.png`,
                      address: {
                          '@type': 'PostalAddress',
                          streetAddress: turf.address || '',
                          addressLocality: turf.city || turf.location || 'Gobi',
                          addressRegion: 'Tamil Nadu',
                          postalCode: '638452',
                          addressCountry: 'IN',
                      },
                      ...(turf.lat && turf.lng
                          ? { geo: { '@type': 'GeoCoordinates', latitude: turf.lat, longitude: turf.lng } }
                          : {}),
                      ...(turf.directionsLink ? { hasMap: turf.directionsLink } : {}),
                      telephone: turf.contactPhone || '+919025516930',
                      email: turf.contactEmail || 'turfgameden@gmail.com',
                      priceRange: `₹${turf.pricePerHour}/hr`,
                      amenityFeature: (turf.amenities || []).map((a: string) => ({
                          '@type': 'LocationFeatureSpecification',
                          name: a,
                          value: true,
                      })),
                      ...(turf.averageRating && turf.reviewCount && turf.reviewCount > 0
                          ? {
                                aggregateRating: {
                                    '@type': 'AggregateRating',
                                    ratingValue: turf.averageRating.toFixed(1),
                                    reviewCount: turf.reviewCount,
                                    bestRating: '5',
                                    worstRating: '1',
                                },
                            }
                          : {}),
                      review: reviews.slice(0, 10).map((r) => ({
                          '@type': 'Review',
                          author: { '@type': 'Person', name: r.userName },
                          datePublished: r.createdAt,
                          reviewRating: {
                              '@type': 'Rating',
                              ratingValue: r.rating,
                              bestRating: '5',
                              worstRating: '1',
                          },
                          reviewBody: r.comment,
                      })),
                      potentialAction: {
                          '@type': 'ReserveAction',
                          target: `${SITE_URL}/turfs/${id}`,
                          name: `Book ${turf.name}`,
                      },
                  },
                  {
                      '@type': 'BreadcrumbList',
                      itemListElement: [
                          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
                          { '@type': 'ListItem', position: 2, name: 'Turfs', item: `${SITE_URL}/turfs` },
                          { '@type': 'ListItem', position: 3, name: turf.name, item: `${SITE_URL}/turfs/${id}` },
                      ],
                  },
              ],
          }
        : null;

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            {children}
        </>
    );
}
