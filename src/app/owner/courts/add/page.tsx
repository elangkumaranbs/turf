'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { addTurf } from '@/lib/firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { Plus, X, Upload, CheckCircle, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

export default function AddCourtPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        location: '',
        pricePerHour: '',
        description: '',
        wicketType: 'turf',
        courts: '1',
        contactPhone: '',
        contactEmail: '',
        openTime: '06:00',
        closeTime: '22:00',
    });

    const [amenities, setAmenities] = useState<string[]>([]);
    const [newAmenity, setNewAmenity] = useState('');
    const [images, setImages] = useState<File[]>([]);
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [newImageUrl, setNewImageUrl] = useState('');
    const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');

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

    const handleAddImageUrl = () => {
        const url = newImageUrl.trim();
        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
            setImageUrls([...imageUrls, url]);
            setNewImageUrl('');
        }
    };

    const handleRemoveImageUrl = (index: number) => {
        setImageUrls(imageUrls.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);

        try {
            const uploadedUrls: string[] = [];

            // Upload file images to Firebase Storage
            for (const file of images) {
                const storageRef = ref(storage, `turfs/${Date.now()}_${file.name}`);
                await uploadBytes(storageRef, file);
                const url = await getDownloadURL(storageRef);
                uploadedUrls.push(url);
            }

            // Combine uploaded URLs + pasted URLs
            const allImages = [...uploadedUrls, ...imageUrls];

            // Create Turf in Firestore
            await addTurf({
                name: formData.name,
                location: formData.location,
                pricePerHour: Number(formData.pricePerHour),
                description: formData.description,
                wicketType: formData.wicketType as 'turf' | 'mat' | 'cement',
                images: allImages.length > 0 ? allImages : ['https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=2000&auto=format&fit=crop'],
                amenities,
                courts: Number(formData.courts),
                contactPhone: formData.contactPhone,
                contactEmail: formData.contactEmail,
                operatingHours: {
                    open: formData.openTime,
                    close: formData.closeTime,
                },
                status: 'active',
            }, user.uid);

            setSuccess(true);
            setTimeout(() => router.push('/owner/courts'), 1500);
        } catch (error) {
            console.error("Error adding court:", error);
            alert('Failed to add court. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="p-4 rounded-full bg-[var(--turf-green)]/10">
                    <CheckCircle size={48} className="text-[var(--turf-green)]" />
                </div>
                <h2 className="text-2xl font-bold text-white">Court Added Successfully!</h2>
                <p className="text-gray-400">Redirecting to your courts...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Add New Court</h1>
                <p className="text-gray-400 mt-1">Fill in the details to list your turf</p>
            </div>

            <GlassCard className="p-4 sm:p-6 lg:p-8 border-white/10">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Court Name"
                                placeholder="e.g. Green Field Turf"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <Input
                                label="Location"
                                placeholder="e.g. Anna Nagar, Chennai"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 ml-1">Description</label>
                            <textarea
                                className="flex w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 focus:border-[var(--turf-green)] focus:ring-1 focus:ring-[var(--turf-green)] focus:outline-none transition-all h-24 resize-none"
                                placeholder="Describe your court, facilities, and what makes it special..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {/* Pricing & Specifications */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Pricing & Specifications</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Input
                                label="Price per Hour (₹)"
                                type="number"
                                placeholder="1000"
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
                            <Input
                                label="Number of Courts"
                                type="number"
                                placeholder="1"
                                value={formData.courts}
                                onChange={(e) => setFormData({ ...formData, courts: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Operating Hours */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Operating Hours</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Opening Time"
                                type="time"
                                value={formData.openTime}
                                onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                            />
                            <Input
                                label="Closing Time"
                                type="time"
                                value={formData.closeTime}
                                onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Phone Number"
                                type="tel"
                                placeholder="+91 98765 43210"
                                value={formData.contactPhone}
                                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                            />
                            <Input
                                label="Email"
                                type="email"
                                placeholder="owner@example.com"
                                value={formData.contactEmail}
                                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Amenities */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Amenities</h3>
                        <div className="flex gap-2">
                            <Input
                                value={newAmenity}
                                onChange={(e) => setNewAmenity(e.target.value)}
                                placeholder="Add amenity (e.g. Parking, Floodlights)"
                                className="flex-1"
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddAmenity(); } }}
                            />
                            <Button type="button" onClick={handleAddAmenity} variant="secondary" className="flex-shrink-0">
                                <Plus size={16} />
                            </Button>
                        </div>
                        {amenities.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {amenities.map((item, idx) => (
                                    <span key={idx} className="bg-[var(--turf-green)]/10 text-[var(--turf-green)] text-xs px-3 py-1.5 rounded-full flex items-center gap-2 border border-[var(--turf-green)]/20">
                                        {item}
                                        <button type="button" onClick={() => handleRemoveAmenity(idx)} className="hover:text-white transition-colors">
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Images — Upload or URL */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Images</h3>

                        {/* Toggle: Upload / URL */}
                        <div className="flex bg-white/5 rounded-xl p-1 border border-white/10 max-w-xs">
                            <button
                                type="button"
                                onClick={() => setImageMode('upload')}
                                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${imageMode === 'upload'
                                    ? 'bg-[var(--turf-green)] text-white shadow'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                <Upload size={14} /> Upload Files
                            </button>
                            <button
                                type="button"
                                onClick={() => setImageMode('url')}
                                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${imageMode === 'url'
                                    ? 'bg-[var(--turf-green)] text-white shadow'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                <LinkIcon size={14} /> Paste URL
                            </button>
                        </div>

                        {imageMode === 'upload' ? (
                            /* File Upload */
                            <div className="border border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-[var(--turf-green)] transition-colors relative group">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <div className="flex flex-col items-center gap-3 text-gray-400 group-hover:text-[var(--turf-green)] transition-colors">
                                    <Upload className="w-10 h-10" />
                                    <span className="text-sm">
                                        {images.length > 0 ? `${images.length} file${images.length > 1 ? 's' : ''} selected` : 'Click or drag to upload images'}
                                    </span>
                                    <span className="text-xs text-gray-600">PNG, JPG up to 5MB each</span>
                                </div>
                            </div>
                        ) : (
                            /* URL Input */
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <Input
                                        value={newImageUrl}
                                        onChange={(e) => setNewImageUrl(e.target.value)}
                                        placeholder="https://example.com/photo.jpg"
                                        className="flex-1"
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddImageUrl(); } }}
                                    />
                                    <Button type="button" onClick={handleAddImageUrl} variant="secondary" className="flex-shrink-0 gap-1">
                                        <Plus size={16} /> Add
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Preview all added images (files + URLs) */}
                        {(images.length > 0 || imageUrls.length > 0) && (
                            <div className="space-y-2">
                                <p className="text-xs text-gray-500 uppercase tracking-wider">Added Images ({images.length + imageUrls.length})</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {/* Uploaded file previews */}
                                    {images.map((file, idx) => (
                                        <div key={`file-${idx}`} className="relative group/img rounded-lg overflow-hidden border border-white/10 bg-white/5 aspect-video flex items-center justify-center">
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={file.name}
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setImages(images.filter((_, i) => i !== idx))}
                                                className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-red-400 opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                                            >
                                                <X size={12} />
                                            </button>
                                            <span className="absolute bottom-1 left-1 text-[10px] bg-black/70 text-gray-300 px-1.5 py-0.5 rounded">File</span>
                                        </div>
                                    ))}
                                    {/* URL previews */}
                                    {imageUrls.map((url, idx) => (
                                        <div key={`url-${idx}`} className="relative group/img rounded-lg overflow-hidden border border-white/10 bg-white/5 aspect-video flex items-center justify-center">
                                            <img
                                                src={url}
                                                alt={`Image ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = '';
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImageUrl(idx)}
                                                className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-red-400 opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                                            >
                                                <X size={12} />
                                            </button>
                                            <span className="absolute bottom-1 left-1 text-[10px] bg-black/70 text-gray-300 px-1.5 py-0.5 rounded">URL</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Submit */}
                    <Button type="submit" className="w-full h-12 text-lg" isLoading={loading}>
                        {loading ? 'Creating Court...' : 'Add Court'}
                    </Button>
                </form>
            </GlassCard>
        </div>
    );
}
