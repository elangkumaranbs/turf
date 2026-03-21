'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createUserWithEmailAndPassword, updateProfile, deleteUser, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { Navbar } from '@/components/Navbar';
import { SUPER_ADMIN_EMAIL } from '@/context/AuthContext';

export default function SignupPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const getUserRole = (userEmail: string) => {
        if (userEmail === SUPER_ADMIN_EMAIL) return 'super_admin';
        return 'user';
    };

    const checkAndCreateUser = async (user: any) => {
        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (!userDoc.exists()) {
                const role = getUserRole(user.email || '');
                await setDoc(doc(db, 'users', user.uid), {
                    uid: user.uid,
                    name: user.displayName || 'User',
                    email: user.email || '',
                    phone: phone || '',
                    role,
                    createdAt: new Date().toISOString()
                });
            }
        } catch (error: any) {
            console.error("Firestore user creation failed (likely permissions):", error);
        }
    };

    const handleAuthError = (err: any) => {
        console.error(err);
        if (err.code === 'permission-denied') {
            setError('Database permission denied. Please check your Firestore Security Rules.');
        } else {
            setError(err.message || 'Authentication failed');
        }
    };

    const handleGoogleSignup = async () => {
        setLoading(true);
        setError('');
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            await checkAndCreateUser(user);
            router.push('/');
        } catch (err: any) {
            handleAuthError(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update display name
            await updateProfile(user, { displayName: name });

            // Create user document in Firestore
            await checkAndCreateUser({ ...user, displayName: name });

            router.push('/'); // Redirect to home
        } catch (err: any) {
            console.error(err);
            if (auth.currentUser) {
                await deleteUser(auth.currentUser).catch(e => console.error("Failed to rollback user", e));
            }
            handleAuthError(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#0a0a0a] flex flex-col">
            <Navbar />
            <div className="flex-1 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
                {/* Background blobs */}
                <div className="absolute top-1/2 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-[var(--turf-green)]/20 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none" />

                <GlassCard className="w-full max-w-md p-6 sm:p-8 space-y-6 sm:space-y-8 relative z-10 border-white/10">
                    <div className="text-center space-y-2">
                        <h1 className="text-2xl sm:text-3xl font-bold text-white">Create Account</h1>
                        <p className="text-sm sm:text-base text-gray-400">Join the community and start booking turfs</p>
                    </div>

                    <form onSubmit={handleSignup} className="space-y-5 sm:space-y-6">
                        <Input
                            label="Full Name"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <Input
                            label="Phone Number"
                            type="tel"
                            placeholder="+91 98765 43210"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />
                        <Input
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                <p className="text-red-500 text-sm text-center">{error}</p>
                            </div>
                        )}

                        <Button type="submit" className="w-full" size="lg" isLoading={loading}>
                            Sign Up
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-black px-2 text-gray-400">Or continue with</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <button
                            onClick={handleGoogleSignup}
                            type="button"
                            className="flex items-center justify-center px-4 py-2 border border-white/10 rounded-lg text-sm font-medium text-white hover:bg-white/5 transition-colors"
                        >
                            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Google
                        </button>
                    </div>

                    <div className="text-center text-sm text-gray-400">
                        Already have an account?{' '}
                        <Link href="/login" className="text-[var(--turf-green)] hover:underline font-medium">
                            Sign In
                        </Link>
                    </div>
                </GlassCard>
            </div>
        </main>
    );
}
