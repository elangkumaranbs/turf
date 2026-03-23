import { useEffect, useState } from 'react';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import app, { db } from '@/lib/firebase/config';
import { useAuth } from '@/context/AuthContext';

export const useFCM = () => {
    const { user } = useAuth();
    const [fcmToken, setFcmToken] = useState<string | null>(null);
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | null>(null);

    useEffect(() => {
        if (!user) return; // Only process when user is logged in

        const initializeFCM = async () => {
            try {
                // Return early if messaging isn't supported (e.g. Safari Private Mode)
                const supported = await isSupported();
                if (!supported) {
                    console.log('FCM not supported on this browser.');
                    return;
                }

                // Request permission
                const permission = await Notification.requestPermission();
                setPermissionStatus(permission);

                if (permission === 'granted') {
                    const messaging = getMessaging(app);
                    
                    // Retrieve Token using the VAPID key given by the user
                    const currentToken = await getToken(messaging, {
                        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
                    });

                    if (currentToken) {
                        console.log('FCM Token Generated:', currentToken);
                        setFcmToken(currentToken);

                        // Save the token efficiently to the user's Firestore Document
                        await setDoc(doc(db, 'users', user.uid), {
                            fcmToken: currentToken,
                            lastActive: new Date().toISOString()
                        }, { merge: true });

                    } else {
                        console.log('No FCM registration token available. Request permission to generate one.');
                    }
                } else {
                    console.warn('Notification permission denied by user. Push notifications will not be available.');
                }
            } catch (error) {
                console.error('An error occurred while retrieving token. ', error);
            }
        };

        initializeFCM();
    }, [user?.uid]); // Run when user ID changes (i.e., someone logs in)

    // Optional foreground message listener
    useEffect(() => {
        const setupForegroundMessage = async () => {
            const supported = await isSupported();
            if (supported) {
                const messaging = getMessaging(app);
                onMessage(messaging, (payload) => {
                    console.log('Foreground push message received: ', payload);
                    // Standard browsers won't automatically pop a notification if standard app is foreground
                    // so we do it manually, or rely on internal alerts
                    if (payload.notification?.title) {
                        // Creating a browser-native alert banner while they are using the app!
                        new Notification(payload.notification.title, {
                            body: payload.notification.body,
                            icon: '/location type logo 001.png',
                        });
                    }
                });
            }
        };
        setupForegroundMessage();
    }, []);

    return { fcmToken, permissionStatus };
};
