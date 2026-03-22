import { NextRequest, NextResponse } from 'next/server';
import { adminMessaging, adminDb } from '@/lib/firebaseAdmin';

// Revalidate entirely down to 0 so the cron is never cached
export const dynamic = 'force-dynamic';

function parseISTDate(dateStr: string, timeStr: string): Date {
    // Extracts "06:00 AM" from "06:00 AM - 07:00 AM" if it's a range
    const startTimeStr = timeStr.split(' - ')[0].trim();
    const [time, period] = startTimeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period.toUpperCase() === 'PM' && hours < 12) hours += 12;
    if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
    
    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    
    const isoDateStr = new Date(dateStr).toISOString().split('T')[0]; // Grabs YYYY-MM-DD reliably
    // Create an exact match date using the +05:30 IST timezone offset
    // so DigitalOcean UTC servers don't calculate it incorrectly.
    return new Date(`${isoDateStr}T${formattedHours}:${formattedMinutes}:00+05:30`);
}

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        
        // Security: Ensure request comes only from our authenticated Cron-Job provider
        if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
            return NextResponse.json({ error: 'Unauthorized access to cron engine' }, { status: 401 });
        }

        const now = Date.now();
        // Look for matches starting within the next 2.5 hours
        const NOTIFICATION_WINDOW_MS = 2.5 * 60 * 60 * 1000; 

        // 1. Fetch upcoming confirmed bookings
        const bookingsSnapshot = await adminDb.collection('bookings')
            .where('status', '==', 'confirmed')
            .get();

        if (bookingsSnapshot.empty) {
            return NextResponse.json({ message: 'No confirmed bookings found' }, { status: 200 });
        }

        let sentCount = 0;

        // 2. Process chronologically
        for (const doc of bookingsSnapshot.docs) {
            const booking = doc.data();
            
            // Skip if reminder already sent or missing crucial timing info
            if (booking.reminderSent) continue;
            
            const firstTimeSlot = booking.times?.[0] || booking.time;
            if (!firstTimeSlot || !booking.date || !booking.userId) continue;

            const matchStartTime = parseISTDate(booking.date, firstTimeSlot);
            const timeUntilMatch = matchStartTime.getTime() - now;

            // If the match is in the future AND starts within our 2.5-hour alert window
            if (timeUntilMatch > 0 && timeUntilMatch <= NOTIFICATION_WINDOW_MS) {
                // Fetch user data for the target Token
                const userDoc = await adminDb.collection('users').doc(booking.userId).get();
                if (!userDoc.exists) continue;
                
                const fcmToken = userDoc.data()?.fcmToken;

                if (fcmToken) {
                    await adminMessaging.send({
                        notification: {
                            title: 'Game Time Soon! ⏰',
                            body: `Get your gear ready! Your match starts in under 2 hours.`,
                        },
                        data: { click_action: "FLUTTER_NOTIFICATION_CLICK" },
                        token: fcmToken,
                    }).catch(error => {
                        console.error(`Failed to send reminder FCM to user ${booking.userId}:`, error);
                    });
                    
                    sentCount++;
                }

                // Mark the booking so we NEVER spam them again on the next 30-min cron cycle
                await adminDb.collection('bookings').doc(doc.id).update({
                    reminderSent: true,
                });
            }
        }

        return NextResponse.json({
            success: true,
            remindersSent: sentCount,
            message: 'Cron job executed successfully'
        }, { status: 200 });

    } catch (error: any) {
        console.error('Reminder Cron Job Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
