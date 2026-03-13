// Geocoding utility using OpenStreetMap Nominatim (free, no API key needed)
// Rate limit: 1 request/second. We use it only on court save, not per-render.

export interface Coordinates {
    lat: number;
    lng: number;
}

/**
 * Geocode a human-readable address to lat/lng using Nominatim.
 * Returns null if geocoding fails.
 */
export async function geocodeAddress(address: string, city: string): Promise<Coordinates | null> {
    const tryQuery = async (query: string): Promise<Coordinates | null> => {
        try {
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=in`;
            const res = await fetch(url, {
                headers: { 'Accept': 'application/json', 'User-Agent': 'TurfGameDen/1.0' }
            });
            if (!res.ok) return null;
            const data = await res.json();
            if (data && data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
            return null;
        } catch {
            return null;
        }
    };

    // Try full address first, then fall back to city only
    const fullQuery = [address, city].filter(Boolean).join(', ');
    const result = await tryQuery(fullQuery);
    if (result) return result;

    // Fallback: city only (helps with small towns in India)
    if (city) {
        await new Promise(r => setTimeout(r, 1100)); // respect rate limit
        return tryQuery(city);
    }
    return null;
}

/**
 * Haversine formula — returns distance in kilometers between two lat/lng points.
 */
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

/**
 * Format distance nicely: "0.8 km" or "12 km"
 */
export function formatDistance(km: number): string {
    if (km < 1) return `${Math.round(km * 1000)} m`;
    if (km < 10) return `${km.toFixed(1)} km`;
    return `${Math.round(km)} km`;
}
