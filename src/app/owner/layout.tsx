'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { LayoutDashboard, MapPin, PlusCircle, CalendarDays, Settings, Loader2, ChevronRight, Menu, X, Users, ShieldCheck, Building2, MapPinned } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';

const sidebarLinks = [
    { name: 'Dashboard', href: '/owner', icon: LayoutDashboard },
    { name: 'My Courts', href: '/owner/courts', icon: MapPin },
    { name: 'Add Court', href: '/owner/courts/add', icon: PlusCircle },
    { name: 'Bookings', href: '/owner/bookings', icon: CalendarDays },
    { name: 'Settings', href: '/owner/settings', icon: Settings },
];

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    useEffect(() => {
        if (!loading && (!user || (user.role !== 'turf_admin' && user.role !== 'super_admin' && user.role !== 'pending_approval'))) {
            router.push('/dashboard');
        }
    }, [user, loading, router]);

    // Close mobile nav on route change
    useEffect(() => {
        setMobileNavOpen(false);
    }, [pathname]);

    if (loading) {
        return (
            <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <Loader2 className="animate-spin text-[var(--turf-green)] w-10 h-10" />
            </main>
        );
    }

    if (!user || (user.role !== 'turf_admin' && user.role !== 'super_admin' && user.role !== 'pending_approval')) {
        return null;
    }

    // Show pending approval message for owners awaiting approval
    if (user.role === 'pending_approval') {
        return (
            <main className="min-h-screen bg-[#0a0a0a]">
                <Navbar />
                <div className="container mx-auto px-6 pt-32 max-w-lg">
                    <GlassCard className="p-8 text-center border-yellow-500/20 bg-yellow-500/5">
                        <div className="p-4 rounded-full bg-yellow-500/10 inline-block mb-4">
                            <ShieldCheck size={48} className="text-yellow-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Account Pending Approval</h2>
                        <p className="text-gray-400 mb-4">
                            Your turf owner account is awaiting approval from the administrator.
                            You'll be able to add courts and manage bookings once your account is approved.
                        </p>
                        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                            <p className="text-xs text-gray-500">Registered as: <span className="text-white">{user.email}</span></p>
                        </div>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="mt-6 text-sm text-[var(--turf-green)] hover:underline"
                        >
                            ← Go to Player Dashboard
                        </button>
                    </GlassCard>
                </div>
            </main>
        );
    }

    // Build nav links — add "Manage All Courts", "Manage Locations" and "Manage Users" for super_admin
    const allLinks = user.role === 'super_admin'
        ? [
            ...sidebarLinks,
            { name: 'Manage All Courts', href: '/admin/courts', icon: Building2 },
            { name: 'Manage Locations', href: '/admin/locations', icon: MapPinned },
            { name: 'Manage Users', href: '/admin/users', icon: Users }
        ]
        : sidebarLinks;

    return (
        <main className="min-h-screen bg-[#0a0a0a]">
            <Navbar />

            {/* Mobile: Top nav bar with hamburger */}
            <div className="lg:hidden fixed top-[64px] left-0 right-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10">
                <div className="container mx-auto px-4 flex items-center justify-between h-12">
                    <span className="text-sm font-semibold text-white">
                        {user.role === 'super_admin' ? '⚡ Super Admin Panel' : 'Owner Panel'}
                    </span>
                    <button
                        onClick={() => setMobileNavOpen(!mobileNavOpen)}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                        {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {/* Mobile dropdown nav */}
                <AnimatePresence>
                    {mobileNavOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/10"
                        >
                            <nav className="p-3 space-y-1">
                                {allLinks.map((link) => {
                                    const isActive = pathname === link.href;
                                    const Icon = link.icon;
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                                                ? 'bg-[var(--turf-green)] text-white'
                                                : link.name === 'Manage Users'
                                                    ? 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10'
                                                    : link.name === 'Manage All Courts'
                                                        ? 'text-orange-400 hover:text-orange-300 hover:bg-orange-500/10'
                                                        : link.name === 'Manage Locations'
                                                            ? 'text-teal-400 hover:text-teal-300 hover:bg-teal-500/10'
                                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                                }`}
                                        >
                                            <Icon size={18} />
                                            {link.name}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Main layout */}
            <div className="container mx-auto px-4 md:px-6 pt-[7.5rem] lg:pt-28 pb-12">
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                    {/* Desktop Sidebar */}
                    <aside className="hidden lg:block lg:w-60 xl:w-64 flex-shrink-0">
                        <div className="glass-card rounded-2xl p-4 sticky top-28">
                            <div className="mb-5 px-3 pt-2">
                                <h2 className="text-lg font-bold text-white">
                                    {user.role === 'super_admin' ? '⚡ Super Admin' : 'Owner Panel'}
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">
                                    {user.role === 'super_admin' ? 'Full system access' : 'Manage your turfs & bookings'}
                                </p>
                            </div>
                            <nav className="space-y-1">
                                {allLinks.map((link) => {
                                    const isActive = pathname === link.href;
                                    const Icon = link.icon;
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${isActive
                                                ? link.name === 'Manage Users'
                                                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                                                    : link.name === 'Manage All Courts'
                                                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                                                        : link.name === 'Manage Locations'
                                                            ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
                                                            : 'bg-[var(--turf-green)] text-white shadow-lg shadow-[var(--turf-green)]/20'
                                                : link.name === 'Manage Users'
                                                    ? 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10'
                                                    : link.name === 'Manage All Courts'
                                                        ? 'text-orange-400 hover:text-orange-300 hover:bg-orange-500/10'
                                                        : link.name === 'Manage Locations'
                                                            ? 'text-teal-400 hover:text-teal-300 hover:bg-teal-500/10'
                                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                                }`}
                                        >
                                            <Icon size={18} className={isActive ? 'text-white' : link.name === 'Manage Users' ? 'text-purple-500' : link.name === 'Manage All Courts' ? 'text-orange-500' : link.name === 'Manage Locations' ? 'text-teal-500' : 'text-gray-500 group-hover:text-[var(--turf-green)]'} />
                                            {link.name}
                                            {isActive && <ChevronRight size={14} className="ml-auto" />}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        {children}
                    </div>
                </div>
            </div>
        </main>
    );
}
