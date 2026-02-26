'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export const Hero = () => {
    const router = useRouter();

    return (
        <section className="relative min-h-[calc(100vh-80px)] sm:min-h-screen w-full flex items-center justify-center pt-20 sm:pt-24 pb-12 sm:pb-16 px-4 overflow-hidden">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2000&auto=format&fit=crop"
                    alt="Stadium Background"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
            </div>

            <div className="container mx-auto px-4 sm:px-6 relative z-10 flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="space-y-6 sm:space-y-8 max-w-3xl w-full"
                >
                    <div className="inline-block px-3 py-1.5 sm:px-4 rounded-full bg-[var(--turf-green)]/10 border border-[var(--turf-green)]/20 text-[var(--turf-green)] font-medium text-xs sm:text-sm">
                        New: Priority Booking Available
                    </div>

                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold leading-tight text-white tracking-tight px-2">
                        Choose Your Turf <br className="hidden sm:block" />
                        <span className="sm:hidden"> </span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--turf-green)] to-emerald-400">
                            Play Your Game.
                        </span>
                    </h1>

                    <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed px-2">
                        Book premium cricket turfs across the city — practice, compete, and play under the lights with just a few clicks.
                        <span className="hidden sm:inline"> Experience the best facilities with real-time availability.</span>
                    </p>

                    <motion.button
                        onClick={() => router.push('/turfs')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        className="mt-4 px-8 sm:px-12 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl bg-gradient-to-r from-[var(--turf-green)] to-emerald-500 text-black shadow-lg shadow-[var(--turf-green)]/25 hover:shadow-[var(--turf-green)]/40 transition-shadow cursor-pointer w-full sm:w-auto max-w-xs mx-auto"
                    >
                        Book Now
                    </motion.button>
                </motion.div>
            </div>
        </section>
    );
};
