'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export const Hero = () => {
    const router = useRouter();

    return (
        <section className="relative min-h-svh sm:min-h-screen w-full flex items-center justify-center pt-16 sm:pt-24 pb-0 sm:pb-16 px-4 overflow-hidden">
            {/* Background Container */}
            <div className="absolute inset-0 z-0 bg-[#0a0a0a]">
                {/* Desktop Video */}
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="hidden md:block absolute inset-0 w-full h-full object-cover"
                    src="/videos/hero-desktop.mp4"
                />
            {/* Mobile Video */}
            <video
                autoPlay
                muted
                loop
                playsInline
                className="block md:hidden absolute inset-0 w-full h-full object-cover z-0"
                src="/videos/hero-mobile.mp4"
            />
            
            <div className="absolute inset-0 bg-black/60 z-10" />
                
                {/* Glowing Orbs */}
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[var(--turf-green)]/10 rounded-full blur-[120px] mix-blend-screen animate-float" />
                <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[150px] mix-blend-screen animate-float" style={{ animationDelay: '2s' }} />
            </div>

            <div className="container mx-auto px-4 sm:px-6 relative z-10 flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="space-y-4 sm:space-y-8 max-w-3xl w-full"
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
                        whileTap={{ scale: 0.95 }}
                        className="mt-4 px-8 sm:px-12 py-3 sm:py-4 text-base sm:text-lg font-bold rounded-2xl bg-gradient-to-r from-[var(--turf-green)] to-emerald-500 text-black shadow-lg shadow-[var(--turf-green)]/20 hover:shadow-[var(--turf-green)]/40 hover:ring-2 hover:ring-white/20 transition-all cursor-pointer w-full sm:w-auto max-w-xs mx-auto animate-pulse-glow"
                    >
                        Book Now
                    </motion.button>
                </motion.div>
            </div>
        </section>
    );
};
