'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { updateUserProfile } from '@/lib/firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader2, Save, CheckCircle } from 'lucide-react';

export default function OwnerSettingsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [profile, setProfile] = useState({
        businessName: '',
        contactPhone: '',
        contactEmail: '',
        address: '',
    });

    useEffect(() => {
        const fetchProfile = async () => {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    const data = userDoc.data();
                    if (data) {
                        setProfile({
                            businessName: data.businessName || data.name || '',
                            contactPhone: data.contactPhone || '',
                            contactEmail: data.contactEmail || data.email || '',
                            address: data.address || '',
                        });
                    }
                } catch (error) {
                    console.error("Error fetching profile:", error);
                }
                setLoading(false);
            }
        };
        fetchProfile();
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        setSaved(false);
        try {
            await updateUserProfile(user.uid, profile);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            alert('Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-[var(--turf-green)] w-10 h-10" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Settings</h1>
                <p className="text-gray-400 mt-1">Manage your business profile and contact information</p>
            </div>

            <GlassCard className="p-5 sm:p-8 border-white/10 max-w-2xl">
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Business Profile</h3>

                    <Input
                        label="Business Name"
                        value={profile.businessName}
                        onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                        placeholder="Your business name"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Contact Phone"
                            type="tel"
                            value={profile.contactPhone}
                            onChange={(e) => setProfile({ ...profile, contactPhone: e.target.value })}
                            placeholder="+91 98765 43210"
                        />
                        <Input
                            label="Contact Email"
                            type="email"
                            value={profile.contactEmail}
                            onChange={(e) => setProfile({ ...profile, contactEmail: e.target.value })}
                            placeholder="email@example.com"
                        />
                    </div>

                    <Input
                        label="Business Address"
                        value={profile.address}
                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                        placeholder="Full address"
                    />

                    <div className="flex items-center gap-4 pt-4">
                        <Button onClick={handleSave} isLoading={saving} className="gap-2">
                            {saved ? <CheckCircle size={16} /> : <Save size={16} />}
                            {saved ? 'Saved!' : 'Save Settings'}
                        </Button>
                        {saved && (
                            <span className="text-sm text-[var(--turf-green)] animate-pulse">Changes saved successfully</span>
                        )}
                    </div>
                </div>
            </GlassCard>

            {/* Account Info */}
            <GlassCard className="p-5 sm:p-8 border-white/10 max-w-2xl">
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Account Information</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between py-2">
                            <span className="text-gray-400">Email</span>
                            <span className="text-white">{user?.email}</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-gray-400">Display Name</span>
                            <span className="text-white">{user?.displayName || '—'}</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-gray-400">Role</span>
                            <span className="text-[var(--turf-green)] capitalize font-medium">{user?.role}</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-gray-400">User ID</span>
                            <span className="text-gray-500 font-mono text-xs">{user?.uid}</span>
                        </div>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}
