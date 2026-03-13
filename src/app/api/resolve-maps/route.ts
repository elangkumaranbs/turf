import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }

    // Only allow Google Maps URLs
    if (!url.includes('google.com/maps') && !url.includes('maps.app.goo.gl') && !url.includes('goo.gl/maps')) {
        return NextResponse.json({ error: 'Not a valid Google Maps URL' }, { status: 400 });
    }

    try {
        // Fetch server-side to follow redirects (avoids CORS on client)
        const res = await fetch(url, {
            redirect: 'follow',
            headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        const finalUrl = res.url;

        // Extract @lat,lng from the resolved URL
        // Google Maps URLs contain: @lat,lng,zoom or @lat,lng,zoomt
        const coordMatch = finalUrl.match(/@(-?\d+\.?\d+),(-?\d+\.?\d+)/);
        if (coordMatch) {
            return NextResponse.json({
                lat: parseFloat(coordMatch[1]),
                lng: parseFloat(coordMatch[2]),
                resolvedUrl: finalUrl,
            });
        }

        // Sometimes coords are in query params: ?q=lat,lng or ll=lat,lng
        const qMatch = finalUrl.match(/[?&](?:q|ll)=(-?\d+\.?\d+),(-?\d+\.?\d+)/);
        if (qMatch) {
            return NextResponse.json({
                lat: parseFloat(qMatch[1]),
                lng: parseFloat(qMatch[2]),
                resolvedUrl: finalUrl,
            });
        }

        return NextResponse.json({ error: 'Could not extract coordinates from this link. Try right-clicking on the location in Google Maps instead.' }, { status: 422 });
    } catch {
        return NextResponse.json({ error: 'Failed to resolve URL. Check your network or try a different link.' }, { status: 500 });
    }
}
