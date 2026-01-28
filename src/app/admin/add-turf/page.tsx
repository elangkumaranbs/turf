'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { addTurf } from '@/lib/firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { Loader2, Plus, X } from 'lucide-react';

export default function AddTurfPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        location: '',
        pricePerHour: '',
        description: '',
        wicketType: 'turf',
    });

    const [amenities, setAmenities] = useState<string[]>([]);
    const [newAmenity, setNewAmenity] = useState('');
    const [images, setImages] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);

    const handleAddAmenity = () => {
        if (newAmenity.trim()) {
            setAmenities([...amenities, newAmenity.trim()]);
            setNewAmenity('');
        }
    };

    const handleRemoveAmenity = (index: number) => {
        setAmenities(amenities.filter((_, i) => i !== index));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setImages(Array.from(e.target.files));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setUploading(true);

        try {
            const imageUrls: string[] = [];

            // Upload images
            for (const file of images) {
                const storageRef = ref(storage, `turfs/${Date.now()}_${file.name}`);
                await uploadBytes(storageRef, file);
                const url = await getDownloadURL(storageRef);
                imageUrls.push(url);
            }

            // Create Turf
            await addTurf({
                name: formData.name,
                location: formData.location,
                pricePerHour: Number(formData.pricePerHour),
                description: formData.description,
                wicketType: formData.wicketType as 'turf' | 'mat' | 'cement',
                images: imageUrls.length > 0 ? imageUrls : ['https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=2000&auto=format&fit=crop'], // Fallback
                amenities,
            }, user.uid);

            alert('Turf Added Successfully!');
            router.push('/dashboard');
        } catch (error) {
            console.error("Error adding turf:", error);
            alert('Failed to add turf.');
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#0a0a0a] pb-12">
            <Navbar />
            <div className="container mx-auto px-6 pt-32">
                <div className="max-w-2xl mx-auto space-y-8">
                    <h1 className="text-3xl font-bold text-white">List Your Turf</h1>

                    <GlassCard className="p-8 border-white/10">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <Input
                                label="Turf Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />

                            <Input
                                label="Location"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                required
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Price per Hour (₹)"
                                    type="number"
                                    value={formData.pricePerHour}
                                    onChange={(e) => setFormData({ ...formData, pricePerHour: e.target.value })}
                                    required
                                />
                                <Select
                                    label="Wicket Type"
                                    value={formData.wicketType}
                                    onChange={(e) => setFormData({ ...formData, wicketType: e.target.value })}
                                    options={[
                                        { label: 'Turf Wicket', value: 'turf' },
                                        { label: 'Mat Wicket', value: 'mat' },
                                        { label: 'Cement Wicket', value: 'cement' },
                                    ]}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 ml-1">Description</label>
                                <textarea
                                    className="flex w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder:text-gray-500 focus:border-[var(--turf-green)] focus:ring-1 focus:ring-[var(--turf-green)] focus:outline-none transition-all h-24"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 ml-1">Amenities</label>
                                <div className="flex gap-2">
                                    <Input
                                        value={newAmenity}
                                        onChange={(e) => setNewAmenity(e.target.value)}
                                        placeholder="Add amenity (e.g. Parking)"
                                        className="flex-1"
                                    />
                                    <Button type="button" onClick={handleAddAmenity} variant="secondary">Add</Button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {amenities.map((item, idx) => (
                                        <span key={idx} className="bg-white/10 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                                            {item}
                                            <button type="button" onClick={() => handleRemoveAmenity(idx)}><X size={12} /></button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 ml-1">Upload Images</label>
                                <div className="border border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-[var(--turf-green)] transition-colors relative">
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    <div className="flex flex-col items-center gap-2 text-gray-400">
                                        <Plus className="w-8 h-8" />
                                        <span>{images.length > 0 ? `${images.length} images selected` : 'Click to upload images'}</span>
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-12 text-lg" isLoading={loading}>
                                {uploading ? 'Uploading & Creating...' : 'List Turf'}
                            </Button>
                        </form>
                    </GlassCard>
                </div>
            </div>
        </main>
    );
}
