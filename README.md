# 🏏 TurfGameDen

**Premium Cricket Turf Booking Platform & PWA**

Book premium cricket turfs across the city — practice, compete, and play under the lights with an enterprise-grade Progressive Web App experience.

![Next.js](https://imgshields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase)
![Razorpay](https://img.shields.io/badge/Razorpay-Gateway-0A2540?logo=razorpay)
![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa)

---

## ✨ Core Architecture Features

### 📱 Progressive Web App (PWA)
- Fully installable on iOS (Safari) and Android (Chrome) as a native-feeling app.
- Runs smoothly in standalone fullscreen mode without browser URL bars.
- Custom service-worker generation utilizing `@ducanh2912/next-pwa`.

### 🔔 Smart Firebase Cloud Messaging (FCM)
- **Instant Alerts**: Secure serverless Push Notifications utilizing Firebase Admin SDK.
- **Background Sync**: Deeply integrated `firebase-messaging-sw.js` ensures notifications arrive even if the app is entirely closed.
- **Time-Based Reminders**: Employs a secure `/api/cron/reminders` endpoint to broadcast 2-hour pre-game reminders to scheduled players.
- **Targeted Roles**: Segregated payloads alert Customers (Refunds/Confirmations) and Turf Owners (New Bookings/Revenue Updates) instantly.

### 💳 Razorpay Payments & Financial Logic
- **Full Gateway Integration**: End-to-end UPI, Card, and Netbanking processing natively.
- **Slot Locking**: Advanced robust lockings prevent double-booking collisions while users check out.
- **Automated Refunds**: Single-click cancellation logic instantly signals Razorpay to initiate full refunds, tracked accurately on the user dashboard.

### 🛡️ Multi-Tier Authentication
- **Passwordless OTP**: Lightning-fast MSG91 phone number OTP authentication layered alongside traditional Firebase accounts.
- **Role-Based Routing**: Strictly enforces boundaries between Players, Turf Owners, and Super Admins.

### 📧 EmailJS Automation
- Two-way transactional emails dispatch immediately upon valid bookings containing all relevant timestamps, pricing, and addresses directly to both the Turf Owner and the Customer.

---

## 🛠️ Tech Stack Overview

| Layer        | Technology                        |
|--------------|-----------------------------------|
| Framework    | Next.js 16 (App Router)          |
| Frontend     | React 19, TypeScript 5           |
| Styling      | Tailwind CSS 4, Framer Motion    |
| Database & Auth | Firebase (Firestore, Storage, OTP) |
| Payments     | Razorpay                         |
| Notifications| Firebase Cloud Messaging (FCM)   |
| Deployment   | DigitalOcean App Platform        |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ 
- **npm** or **yarn**

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/elangkumaranbs/turf.git
cd turf

# Install dependencies
npm install

# Start the development server
npm run dev
```

### 2. Required Environment Variables (`.env.local`)
To run this project securely, you must configure the following keys in your environment:

```env
# Razorpay Configuration
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# EmailJS Automation
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=
NEXT_PUBLIC_EMAILJS_OWNER_TEMPLATE_ID=
NEXT_PUBLIC_EMAILJS_CUSTOMER_TEMPLATE_ID=

# Firebase Client configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK (For secure FCM & Backend logic)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# FCM Client & Security 
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
CRON_SECRET_KEY= # Random secure string shared with cron-job.org
```

### Available Scripts

| Command         | Description                |
|-----------------|----------------------------|
| `npm run dev`   | Start dev server           |
| `npm run build` | Build for production       |
| `npm run start` | Start production server    |

---

## 📄 License & Rights
This project is private and proprietary. All features, UI dynamics, and source architecture belong strictly to the repository owner.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/elangkumaranbs">elangkumaranbs</a>
</p>
