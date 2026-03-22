import * as admin from 'firebase-admin';

// Initialize Firebase Admin only if not already initialized
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Handle newlines formatting in the environment variables
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
        console.log('Firebase Admin Initialized successfully.');
    } catch (error) {
        console.error('Firebase Admin Initialization Error:', error);
    }
}

export const adminMessaging = admin.messaging();
export const adminDb = admin.firestore();
