// src/lib/firebase/config.ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCc86rUYi9EWCY0xd8Xyp81gZAkZzXE9wY",
  authDomain: "turf-3cb76.firebaseapp.com",
  projectId: "turf-3cb76",
  storageBucket: "turf-3cb76.firebasestorage.app",
  messagingSenderId: "443588724592",
  appId: "1:443588724592:web:ddd04fd960a4ba371871b5",
  measurementId: "G-1RX880VHCW"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Analytics (only on client side)
let analytics;
if (typeof window !== 'undefined') {
  isSupported().then((yes) => {
    if (yes) {
      analytics = getAnalytics(app);
    }
  });
}

export { analytics };
export default app;
