'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { auth } from '@/lib/firebase/config';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { KeyRound, CheckCircle } from 'lucide-react';

export function ChangePasswordForm() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        const user = auth.currentUser;
        if (!user || (!user.email && !user.phoneNumber)) {
            setError('You must be logged in to change your password.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match.');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setLoading(true);

        try {
            // 1. Re-authenticate user
            if (user.email) {
                const credential = EmailAuthProvider.credential(user.email, currentPassword);
                await reauthenticateWithCredential(user, credential);
            } else {
                 throw new Error("Password updates are only supported for email accounts right now.");
            }

            // 2. Update password
            await updatePassword(user, newPassword);

            // 3. Cleanup & Success state
            setSuccess(true);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            
            setTimeout(() => {
                setSuccess(false);
            }, 5000);
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/invalid-credential') {
                setError('Current password is incorrect.');
            } else if (err.code === 'auth/requires-recent-login') {
                 setError('This operation is sensitive and requires recent authentication. Please log out and log back in before retrying.');
            } else {
                setError(err.message || 'Failed to change password.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleChangePassword} className="space-y-5">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-purple-400" />
                Change Password
            </h3>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-xl mb-4">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm p-3 rounded-xl mb-4 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Password updated successfully!
                </div>
            )}

            <Input
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
            />

            <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
            />

            <Input
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
            />

            <div className="pt-2">
                <Button 
                    type="submit" 
                    isLoading={loading} 
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                >
                    Update Password
                </Button>
            </div>
        </form>
    );
}
