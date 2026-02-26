# 🏏 TurfGameDen

**Premium Cricket Turf Booking Platform**

Book premium cricket turfs across the city — practice, compete, and play under the lights.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)

---

## ✨ Features

### 🏟️ For Players
- **Browse Turfs** — Explore available turfs with detailed info, pricing, and photos
- **Smart Booking** — Pick your date, time slot, and court with an intuitive booking widget
- **User Dashboard** — View and manage your upcoming and past bookings
- **Authentication** — Secure login and signup with Firebase Auth

### 👑 For Turf Owners
- **Owner Dashboard** — Overview of bookings, revenue, and court utilization
- **Court Management** — Add, edit, and manage courts with pricing and availability
- **Booking Management** — Track and manage all incoming bookings
- **Settings** — Configure turf details and preferences

### 🛠️ Admin Panel
- **Add Turfs** — Register new turfs to the platform
- **Manage Bookings** — Oversee all bookings across the platform
- **User Management** — View and manage registered users

---

## 🛠️ Tech Stack

| Layer        | Technology                        |
|--------------|-----------------------------------|
| Framework    | Next.js 16 (App Router)          |
| Frontend     | React 19, TypeScript 5           |
| Styling      | Tailwind CSS 4, Framer Motion    |
| Backend      | Firebase (Auth, Firestore, Storage) |
| Fonts        | Inter (Google Fonts)             |
| Deployment   | Netlify                          |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login & Signup pages
│   ├── admin/            # Admin panel (add turf, manage bookings, users)
│   ├── dashboard/        # Player dashboard
│   ├── owner/            # Owner dashboard, courts, bookings, settings
│   ├── turfs/            # Browse & view turfs
│   ├── layout.tsx        # Root layout with AuthProvider
│   └── page.tsx          # Landing page
├── components/
│   ├── ui/               # Reusable UI components (Button, Input, Select, GlassCard)
│   ├── BookingWidget.tsx  # Date & slot booking widget
│   ├── Hero.tsx          # Landing page hero section
│   ├── Navbar.tsx        # Navigation bar
│   └── SlotPicker.tsx    # Time slot picker
├── context/
│   └── AuthContext.tsx   # Firebase auth context provider
└── lib/
    ├── firebase/         # Firebase config & Firestore helpers
    └── utils.ts          # Utility functions
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn**

### Installation

```bash
# Clone the repository
git clone https://github.com/elangkumaranbs/turf.git
cd turf

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

| Command         | Description                |
|-----------------|----------------------------|
| `npm run dev`   | Start dev server           |
| `npm run build` | Build for production       |
| `npm run start` | Start production server    |
| `npm run lint`  | Run ESLint                 |

---

## 🔐 Firebase Setup

This project uses Firebase for authentication, database, and storage. The Firebase config is located in `src/lib/firebase/config.ts`. To use your own Firebase project:

1. Create a project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Authentication** (Email/Password)
3. Create a **Firestore** database
4. Enable **Storage**
5. Replace the config values in `src/lib/firebase/config.ts`

---

## 📄 License

This project is private and proprietary.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/elangkumaranbs">elangkumaranbs</a>
</p>
