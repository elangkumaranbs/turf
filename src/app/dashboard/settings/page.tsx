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
import { Loader2, Save, CheckCircle, Camera, User, Shield, Loader } from 'lucide-react';
import Image from 'next/image';
import { Navbar } from '@/components/Navbar';

export default function UserSettingsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [saved, setSaved] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [profile, setProfile] = useState({
        displayName: '',
        phone: '',
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
                            phone: data.phone || data.contactPhone || '',
                            photoURL: data.photoURL || user.photoURL || '',
                        });
                        setPhotoPreview(data.photoURL || user.photoURL || null);
                    } else {
                        setProfile({
                            displayName: user.displayName || '',
                            phone: '',
                            photoURL: user.photoURL || '',
                        });
                        setPhotoPreview(user.photoURL || null);
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

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        try {
            setUploadingPhoto(true);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);

            // Upload to Firebase Storage
            const photoURL = await uploadProfilePhoto(user.uid, file);
            
            // Update Firebase Auth profile
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
            // Update Firestore
            await updateUserProfile(user.uid, {
                name: profile.displayName,
                phone: profile.phone,
            });

            // Update Firebase Auth displayName
            if (auth.currentUser && profile.displayName) {
                await updateProfile(auth.currentUser, {
                    displayName: profile.displayName,
                });
            }

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);

            // Reload page to reflect changes
            window.location.reload();
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-[#0a0a0a]">
                <Navbar />
                <div className="flex items-center justify-center py-20 pt-32">
                    <Loader2 className="animate-spin text-[var(--turf-green)] w-10 h-10" />
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#0a0a0a] pb-12">
            <Navbar />
            
            <div className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-28 lg:pt-32">
                <div className="mb-8 animate-fade-up">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                        Account <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">Settings</span>
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg">Manage your profile and account preferences</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Profile Photo Section */}
                    <div className="lg:col-span-1">
                        <GlassCard className="p-6 sm:p-8 border-white/10 animate-fade-up">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Camera className="w-5 h-5 text-blue-400" />
                                Profile Photo
                            </h3>
                            
                            <div className="flex flex-col items-center">
                                <div className="relative w-40 h-40 mb-6">
                                    {photoPreview ? (
                                        <Image
                                            src={photoPreview}
                                            alt="Profile"
                                            width={160}
                                            height={160}
                                            className="w-full h-full rounded-full object-cover border-4 border-white/10"
                                        />
                                    ) : (
                                        <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-4 border-white/10 flex items-center justify-center">
                                            <User className="w-16 h-16 text-gray-500" />
                                        </div>
                                    )}
                                    
                                    {uploadingPhoto && (
                                        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                                            <Loader className="animate-spin text-white w-8 h-8" />
                                        </div>
                                    )}

                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingPhoto}
                                        className="absolute bottom-0 right-0 p-3 bg-blue-500 hover:bg-blue-600 rounded-full text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Camera className="w-5 h-5" />
                                    </button>
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    className="hidden"
                                />

                                <p className="text-sm text-gray-400 text-center">
                                    Click the camera icon to upload a new photo
                                    <br />
                                    <span className="text-xs text-gray-500">Max size: 5MB</span>
                                </p>
                            </div>
                        </GlassCard>

                        {/* Account Info */}
                        <GlassCard className="p-6 sm:p-8 border-white/10 mt-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-purple-400" />
                                Account Info
                            </h3>
                            <div className="space-y-4 text-sm">
                                <div className="flex flex-col gap-1 pb-3 border-b border-white/5">
                                    <span className="text-gray-500 text-xs font-medium uppercase">Role</span>
                                    <span className="text-[var(--turf-green)] font-bold capitalize bg-[var(--turf-green)]/10 px-3 py-1.5 rounded-lg w-fit">
                                        {user?.role}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1 pb-3 border-b border-white/5">
                                    <span className="text-gray-500 text-xs font-medium uppercase">User ID</span>
                                    <span className="text-gray-400 font-mono text-xs break-all">{user?.uid}</span>
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Profile Information */}
                    <div className="lg:col-span-2">
                        <GlassCard className="p-6 sm:p-8 border-white/10 animate-fade-up" style={{ animationDelay: '0.2s' }}>
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <User className="w-5 h-5 text-green-400" />
                                Personal Information
                            </h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Display Name
                                    </label>
                                    <Input
                                        value={profile.displayName}
                                        onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                                        placeholder="Enter your name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Phone Number
                                    </label>
                                    <Input
                                        type="tel"
                                        value={profile.phone}
                                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                        placeholder="+91 98765 43210"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Email Address
                                    </label>
                                    <Input
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="opacity-60 cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">Email cannot be changed</p>
                                </div>

                                <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                                    <Button 
                                        onClick={handleSave} 
                                        isLoading={saving} 
                                        className="gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                                        disabled={uploadingPhoto}
                                    >
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

                        {/* Additional Settings */}
                        <GlassCard className="p-6 sm:p-8 border-white/10 mt-6 animate-fade-up" style={{ animationDelay: '0.3s' }}>
                            <h3 className="text-xl font-bold text-white mb-4">Additional Settings</h3>
                            <p className="text-gray-400 text-sm mb-4">More settings coming soon...</p>
                            
                            <div className="space-y-3">
                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                    <p className="text-sm font-medium text-gray-300 mb-1">Email Notifications</p>
                                    <p className="text-xs text-gray-500">Receive booking confirmations via email</p>
                                </div>
                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                    <p className="text-sm font-medium text-gray-300 mb-1">Privacy Settings</p>
                                    <p className="text-xs text-gray-500">Control who can see your bookings</p>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </div>
        </main>
    );
}
