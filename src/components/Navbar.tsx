'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from './ui/Button';
import { Menu, X, User as UserIcon, LogOut, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar = () => {
    const { user, loading, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Home', href: '/' },
        { name: 'About', href: '/about' },
        { name: 'Services', href: '/services' },
        { name: 'Courts', href: '/turfs' },
        ...((user?.role === 'turf_admin' || user?.role === 'super_admin')
            ? [{ name: 'Owner Panel', href: '/owner' }]
            : [])
    ];

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-black/60 backdrop-blur-xl border-b border-white/10 py-3 sm:py-4 shadow-2xl shadow-black/50' : 'bg-transparent py-4 sm:py-6'
                }`}
        >
            <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16">
                        <Image 
                            src="/location type logo 001.png" 
                            alt="TurfGameDen Logo" 
                            width={64}
                            height={64}
                            className="w-full h-full object-contain transition-transform group-hover:scale-105"
                            priority
                        />
                    </div>
                    <span className="text-base sm:text-xl md:text-2xl font-bold font-sans tracking-tight">
                        Turf<span className="text-[var(--turf-green)]">GameDen</span>
                    </span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden lg:flex items-center space-x-1">
                    <div className="flex bg-white/5 backdrop-blur-sm rounded-full p-1 border border-white/10">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="px-4 lg:px-5 py-2 rounded-full text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Theme Toggle & Auth */}
                <div className="flex items-center space-x-2 sm:space-x-4">
                    <button
                        onClick={toggleTheme}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    {!loading && (
                        <div className="hidden md:block">
                            {user ? (
                                <div className="flex items-center gap-2">
                                    <Link href="/dashboard">
                                        <Button variant="ghost" className="flex items-center gap-2 text-sm">
                                            {user.photoURL ? (
                                                <Image
                                                    src={user.photoURL}
                                                    alt="Profile"
                                                    width={24}
                                                    height={24}
                                                    className="rounded-full object-cover"
                                                />
                                            ) : (
                                                <UserIcon size={16} />
                                            )}
                                            <span className="hidden lg:inline">{user.displayName?.split(' ')[0] || 'Dashboard'}</span>
                                            <span className="lg:hidden">Account</span>
                                        </Button>
                                    </Link>
                                    <button
                                        onClick={logout}
                                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                                        title="Log Out"
                                    >
                                        <LogOut size={18} />
                                    </button>
                                </div>
                            ) : (
                                <Link href="/login">
                                    <Button variant="primary" size="sm">Login / Sign Up</Button>
                                </Link>
                            )}
                        </div>
                    )}

                    <button
                        className="lg:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="lg:hidden bg-black/95 backdrop-blur-xl border-t border-white/10 overflow-hidden shadow-2xl"
                    >
                        <div className="flex flex-col p-4 sm:p-6 space-y-3 sm:space-y-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className="text-base sm:text-lg text-gray-300 hover:text-[var(--turf-green)] py-2 transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <div className="pt-3 sm:pt-4 border-t border-white/10">
                                {user ? (
                                    <div className="flex flex-col gap-2 sm:gap-3">
                                        <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                                            <Button className="w-full">Dashboard</Button>
                                        </Link>
                                        <Button variant="secondary" className="w-full" onClick={() => { logout(); setMobileMenuOpen(false); }}>
                                            Log Out
                                        </Button>
                                    </div>
                                ) : (
                                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                                        <Button className="w-full">Login / Sign Up</Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};
