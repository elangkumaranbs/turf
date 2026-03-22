import { NextResponse } from 'next/server';
import { adminMessaging, adminDb } from '@/lib/firebaseAdmin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { targetUserId, title, body: messageBody, data } = body;

        // If a specific userId is passed, we fetch their FCM token. Otherwise, an array of tokens could also be processed.
        if (!targetUserId) {
            return NextResponse.json({ error: 'Missing targetUserId' }, { status: 400 });
        }

        // 1. Fetch the user's document from Firestore using Admin SDK
        const userDoc = await adminDb.collection('users').doc(targetUserId).get();

        if (!userDoc.exists) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const fcmToken = userDoc.data()?.fcmToken;

        if (!fcmToken) {
            return NextResponse.json({ error: 'User does not have an FCM token registered' }, { status: 400 });
        }

        // 2. Build the Firebase Message payload
        const message = {
            notification: {
                title: title || 'TurfGameDen Alert',
                body: messageBody || 'You have a new update.',
                // Optionally add image URL for rich pushes: imageUrl: '...'
            },
            data: data || { click_action: "FLUTTER_NOTIFICATION_CLICK" },
            token: fcmToken,
        };

        // 3. Send securely
        const response = await adminMessaging.send(message);

        return NextResponse.json({
            success: true,
            messageId: response,
            message: 'Push notification sent securely.'
        });
    } catch (error: any) {
        console.error('Error sending push notification:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
