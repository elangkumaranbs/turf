'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { updateUserProfile, uploadProfilePhoto } from '@/lib/firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader2, Save, CheckCircle, Camera, User, Phone, Mail, Building, MapPin, Shield } from 'lucide-react';
import Image from 'next/image';
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm';

export default function OwnerSettingsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [saved, setSaved] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [profile, setProfile] = useState({
        displayName: '',
        businessName: '',
        contactPhone: '',
        contactEmail: '',
        address: '',
        photoURL: '',
    });

    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    const data = userDoc.data();
                    if (data) {
                        setProfile({
                            displayName: data.name || user.displayName || '',
                            businessName: data.businessName || data.name || '',
                            contactPhone: data.contactPhone || data.phone || '',
                            contactEmail: data.contactEmail || data.email || user.email || '',
                            address: data.address || '',
                            photoURL: data.photoURL || user.photoURL || '',
                        });
                        setPhotoPreview(data.photoURL || user.photoURL || null);
                    }
                } catch (error) {
                    console.error("Error fetching profile:", error);
                }
                setLoading(false);
            }
        };
        fetchProfile();
    }, [user]);

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        try {
            setUploadingPhoto(true);

            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);

            const photoURL = await uploadProfilePhoto(user.uid, file);
            
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { photoURL });
            }

            setProfile(prev => ({ ...prev, photoURL }));
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Failed to upload photo. Please try again.');
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        setSaved(false);
        try {
            await updateUserProfile(user.uid, {
                name: profile.displayName,
                businessName: profile.businessName,
                contactPhone: profile.contactPhone,
                phone: profile.contactPhone,
                contactEmail: profile.contactEmail,
                address: profile.address,
            });

            if (auth.currentUser && profile.displayName) {
                await updateProfile(auth.currentUser, {
                    displayName: profile.displayName,
                });
            }

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
            window.location.reload();
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
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Owner Settings</h1>
                <p className="text-gray-400 mt-1">Manage your profile and business information</p>
            </div>

            {/* Profile Photo Card */}
            <GlassCard className="p-6 sm:p-8 border-white/10 max-w-2xl">
                <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-3 mb-6 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-blue-400" />
                    Profile Photo
                </h3>
                <div className="flex items-center gap-6">
                    <div className="relative w-32 h-32 shrink-0">
                        {photoPreview ? (
                            <Image
                                src={photoPreview}
                                alt="Profile"
                                width={128}
                                height={128}
                                className="w-full h-full rounded-full object-cover border-4 border-white/10"
                            />
                        ) : (
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-4 border-white/10 flex items-center justify-center">
                                <User className="w-12 h-12 text-gray-500" />
                            </div>
                        )}
                        
                        {uploadingPhoto && (
                            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                                <Loader2 className="animate-spin text-white w-8 h-8" />
                            </div>
                        )}

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingPhoto}
                            className="absolute bottom-0 right-0 p-2.5 bg-blue-500 hover:bg-blue-600 rounded-full text-white shadow-lg transition-all disabled:opacity-50"
                        >
                            <Camera className="w-4 h-4" />
                        </button>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                    />

                    <div className="flex-1">
                        <p className="text-white font-medium mb-1">Update your profile picture</p>
                        <p className="text-sm text-gray-400 mb-3">
                            Click the camera icon to upload a new photo
                        </p>
                        <p className="text-xs text-gray-500">Max size: 5MB • Formats: JPG, PNG, GIF</p>
                    </div>
                </div>
            </GlassCard>

            <GlassCard className="p-5 sm:p-8 border-white/10 max-w-2xl">
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-3 mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-green-400" />
                        Personal & Business Information
                    </h3>

                    <Input
                        label="Display Name"
                        value={profile.displayName}
                        onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                        placeholder="Your name"
                    />

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

                    <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                        <Button onClick={handleSave} isLoading={saving} disabled={uploadingPhoto} className="gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
                            {saved ? <CheckCircle size={16} /> : <Save size={16} />}
                            {saved ? 'Saved!' : 'Save Changes'}
                        </Button>
                        {saved && (
                            <span className="text-sm text-[var(--turf-green)] animate-pulse flex items-center gap-2">
                                <CheckCircle size={16} />
                                Changes saved successfully
                            </span>
                        )}
                    </div>
                </div>
            </GlassCard>

            {/* Account Info */}
            <GlassCard className="p-5 sm:p-8 border-white/10 max-w-2xl">
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-3 mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-purple-400" />
                        Account Information
                    </h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between py-3 border-b border-white/5">
                            <span className="text-gray-400 font-medium">Email</span>
                            <span className="text-white font-medium">{user?.email}</span>
                        </div>
                        <div className="flex justify-between py-3 border-b border-white/5">
                            <span className="text-gray-400 font-medium">Role</span>
                            <span className="text-[var(--turf-green)] capitalize font-bold bg-[var(--turf-green)]/10 px-3 py-1.5 rounded-lg">{user?.role}</span>
                        </div>
                        <div className="flex justify-between py-3">
                            <span className="text-gray-400 font-medium">User ID</span>
                            <span className="text-gray-500 font-mono text-xs">{user?.uid}</span>
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Security Section (Change Password) */}
            <GlassCard className="p-5 sm:p-8 border-white/10 max-w-2xl">
                <ChangePasswordForm />
            </GlassCard>
        </div>
    );
}
