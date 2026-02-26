'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from './ui/Button';
import { Menu, X, User as UserIcon, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar = () => {
    const { user, loading, logout } = useAuth();
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
        { name: 'About', href: '#about' },
        { name: 'Service', href: '#service' },
        { name: 'Courts', href: '/turfs' },
        ...((user?.role === 'turf_admin' || user?.role === 'super_admin')
            ? [{ name: 'Owner Panel', href: '/owner' }]
            : []),
    ];

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-black/50 backdrop-blur-md py-3 sm:py-4' : 'bg-transparent py-4 sm:py-6'
                }`}
        >
            <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="text-xl sm:text-2xl font-bold font-sans tracking-tight">
                    Turf<span className="text-[var(--turf-green)]">GameDen</span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center space-x-1">
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

                {/* Auth / Mobile Toggle */}
                <div className="flex items-center space-x-2 sm:space-x-4">
                    {!loading && (
                        <div className="hidden md:block">
                            {user ? (
                                <div className="flex items-center gap-2">
                                    <Link href="/dashboard">
                                        <Button variant="ghost" className="flex items-center gap-2 text-sm">
                                            <UserIcon size={16} />
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
                        className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
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
                        className="md:hidden bg-black/95 backdrop-blur-xl border-t border-white/10 overflow-hidden"
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
