'use client';

import { motion } from 'framer-motion';
import { BookingWidget } from './BookingWidget';
import Image from 'next/image';

export const Hero = () => {
    return (
        <section className="relative min-h-screen w-full flex items-center justify-center pt-24 pb-12 overflow-hidden">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2000&auto=format&fit=crop" // Placeholder: Cricket stadium night view
                    alt="Stadium Background"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
            </div>

            <div className="container mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                {/* Left Content */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="lg:col-span-7 space-y-8"
                >
                    <div className="inline-block px-4 py-1.5 rounded-full bg-[var(--turf-green)]/10 border border-[var(--turf-green)]/20 text-[var(--turf-green)] font-medium text-sm mb-4">
                        New: Priority Booking Available
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold leading-tight text-white tracking-tight">
                        Choose Your Turf <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--turf-green)] to-emerald-400">
                            Play Your Game.
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-gray-300 max-w-2xl leading-relaxed">
                        Book premium cricket turfs across the city — practice, compete, and play under the lights with just a few clicks.
                        Experience the best facilities with real-time availability.
                    </p>
                </motion.div>

                {/* Right Content - Booking Widget */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="lg:col-span-5 flex justify-center lg:justify-end"
                >
                    <BookingWidget />
                </motion.div>
            </div>

            {/* Decorative Football/Sports Element - Optional centered element from design */}
            {/* For cricket, we can add a subtle cricket ball or similar element logic here if needed, 
          but the design keeps it clean with the background. */}
        </section>
    );
};
