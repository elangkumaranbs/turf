'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { addTurf } from '@/lib/firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { Plus, X, Upload, CheckCircle, Link as LinkIcon, Image as ImageIcon, MapPin } from 'lucide-react';
import { getLocations, Location } from '@/lib/firebase/firestore';



export default function AddCourtPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [locations, setLocations] = useState<{label: string, value: string}[]>([]);

    useEffect(() => {
        const fetchLocations = async () => {
            const data = await getLocations();
            const options = data.map(loc => ({ label: loc.name, value: loc.name })).sort((a, b) => a.label.localeCompare(b.label));
            setLocations(options);
        };
        fetchLocations();
    }, []);

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        city: '',
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
                address: formData.address,
                city: formData.city,
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
        <div className="space-y-8 animate-fade-up">
            <div className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    Add New <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--turf-green)] to-emerald-400">Court</span>
                </h1>
                <p className="text-gray-400 mt-2 text-lg">List your premium turf and start accepting bookings.</p>
            </div>

            <GlassCard className="p-6 sm:p-8 lg:p-10 border-white/5 bg-white/[0.02] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--turf-green)]/5 blur-3xl rounded-full pointer-events-none" />
                <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white border-b border-white/5 pb-3 flex items-center gap-2">
                            <span className="bg-[var(--turf-green)]/10 text-[var(--turf-green)] p-1.5 rounded-lg"><MapPin size={18} /></span>
                            Basic Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                            <Input
                                label="Court Name"
                                placeholder="e.g. Green Field Turf"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <Select
                                label="City"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                options={locations.length > 0 
                                    ? [{ label: 'Select a City', value: '' }, ...locations] 
                                    : [{ label: 'Loading locations...', value: '' }]}
                                required
                            />
                        </div>
                        <Input
                            label="Address"
                            placeholder="e.g. 12, Main Road, Near Bus Stand"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            required
                        />
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 ml-1 block mb-1">Description</label>
                            <textarea
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:border-[var(--turf-green)]/50 focus:ring-1 focus:ring-[var(--turf-green)]/30 outline-none transition-all resize-none min-h-[120px]"
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
                    {/* Preview: auto-generated slots */}
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-xs text-gray-400">⏰ Booking slots will be auto-generated in 1-hour intervals between your opening and closing time.</p>
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
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-[var(--turf-green)] to-emerald-500 hover:from-emerald-500 hover:to-[var(--turf-green)] text-black px-6 py-4 rounded-xl font-black text-lg transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(46,204,113,0.4)] hover:scale-[1.01] disabled:opacity-70 disabled:cursor-not-allowed mt-8"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                Creating Court...
                            </>
                        ) : (
                            <>
                                <CheckCircle size={22} /> Add Premium Court
                            </>
                        )}
                    </button>
                </form>
            </GlassCard>
        </div>
    );
}
