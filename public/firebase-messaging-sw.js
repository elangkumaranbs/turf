importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyCc86rUYi9EWCY0xd8Xyp81gZAkZzXE9wY",
  authDomain: "turf-3cb76.firebaseapp.com",
  projectId: "turf-3cb76",
  storageBucket: "turf-3cb76.firebasestorage.app",
  messagingSenderId: "443588724592",
  appId: "1:443588724592:web:ddd04fd960a4ba371871b5",
  measurementId: "G-1RX880VHCW"
};

// Initialize Firebase app in the service worker
firebase.initializeApp(firebaseConfig);

// Retrieve firebase messaging
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'TurfGameDen Update';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new alert regarding your booking.',
    icon: '/location type logo 001.png',
    badge: '/location type logo 001.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
