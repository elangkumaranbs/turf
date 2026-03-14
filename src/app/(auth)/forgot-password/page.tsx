'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { Navbar } from '@/components/Navbar';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            await sendPasswordResetEmail(auth, email);
            setSuccess(true);
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/user-not-found') {
                setError('No user found with this email address.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Please enter a valid email address.');
            } else {
                setError(err.message || 'Failed to send password reset email');
            }
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
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />

                <GlassCard className="w-full max-w-md p-6 sm:p-8 space-y-6 sm:space-y-8 relative z-10 border-white/10">
                    <div className="text-center space-y-2">
                        <Link href="/login" className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors mb-4 group">
                            <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                            Back to login
                        </Link>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white">Reset Password</h1>
                        <p className="text-sm sm:text-base text-gray-400">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>
                    </div>

                    {!success ? (
                        <form onSubmit={handleResetPassword} className="space-y-5 sm:space-y-6">
                            <Input
                                label="Email Address"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />

                            {error && <p className="text-red-500 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg p-3">{error}</p>}

                            <Button type="submit" className="w-full" size="lg" isLoading={loading}>
                                Send Reset Link
                            </Button>
                        </form>
                    ) : (
                        <div className="space-y-6 text-center">
                            <div className="w-16 h-16 bg-[var(--turf-green)]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--turf-green)]/20 shadow-[0_0_20px_rgba(46,204,113,0.15)]">
                                <CheckCircle className="w-8 h-8 text-[var(--turf-green)]" />
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                <p className="text-white font-medium mb-1">Check your email</p>
                                <p className="text-sm text-gray-400">
                                    We've sent a password reset link to <span className="text-white font-medium">{email}</span>. 
                                </p>
                            </div>
                            <Button onClick={() => router.push('/login')} className="w-full" size="lg">
                                Return to Login
                            </Button>
                        </div>
                    )}
                </GlassCard>
            </div>
        </main>
    );
}
