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
import { uploadImagesToCloudinary } from '@/lib/cloudinary';
import { Loader2, Plus, X, Upload, ImageIcon, MapPin } from 'lucide-react';
import { geocodeAddress } from '@/lib/geocoding';

export default function AddTurfPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        city: '',
        pricePerHour: '',
        description: '',
        wicketType: 'turf',
        directionsLink: '',
    });

    const [amenities, setAmenities] = useState<string[]>([]);
    const [newAmenity, setNewAmenity] = useState('');
    const [images, setImages] = useState<File[]>([]);
    const [uploadProgress, setUploadProgress] = useState('');
    const [manualLat, setManualLat] = useState<number | undefined>(undefined);
    const [manualLng, setManualLng] = useState<number | undefined>(undefined);
    const [mapsLink, setMapsLink] = useState('');
    const [mapsLoading, setMapsLoading] = useState(false);

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
            setImages(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const handleRemoveImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const fetchCoordsFromMapsLink = async () => {
        if (!mapsLink.trim()) return;
        setMapsLoading(true);
        try {
            const res = await fetch(`/api/resolve-maps?url=${encodeURIComponent(mapsLink)}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch coordinates');
            setManualLat(data.lat);
            setManualLng(data.lng);
            setFormData(prev => ({ ...prev, directionsLink: prev.directionsLink || mapsLink }));
            setMapsLink('');
            alert(`✓ Coordinates fetched: ${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}`);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Could not fetch coordinates from this link.');
        } finally {
            setMapsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setUploadProgress('');

        try {
            // Upload images to Cloudinary
            let imageUrls: string[] = [];
            if (images.length > 0) {
                imageUrls = await uploadImagesToCloudinary(images, ({ index, total, file }) => {
                    setUploadProgress(`Uploading image ${index}/${total}: ${file}`);
                });
                setUploadProgress('All images uploaded!');
            }

            // Create Turf in Firestore
            // Use manual GPS if set, otherwise geocode the address
            let coords = null;
            if (manualLat != null && manualLng != null) {
                coords = { lat: manualLat, lng: manualLng };
                setUploadProgress('Using manual GPS coordinates...');
            } else {
                setUploadProgress('Geocoding address...');
                coords = await geocodeAddress(formData.address, formData.city);
            }

            await addTurf({
                name: formData.name,
                address: formData.address,
                city: formData.city,
                pricePerHour: Number(formData.pricePerHour),
                description: formData.description,
                wicketType: formData.wicketType as 'turf' | 'mat' | 'cement',
                images: imageUrls.length > 0
                    ? imageUrls
                    : ['https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=2000&auto=format&fit=crop'],
                amenities,
                directionsLink: formData.directionsLink.trim(),
                ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
            }, user.uid);

            alert('Turf Added Successfully!');
            router.push('/dashboard');
        } catch (error) {
            console.error('Error adding turf:', error);
            alert('Failed to add turf. Please check your Cloudinary upload preset is set to "Unsigned".');
        } finally {
            setLoading(false);
            setUploadProgress('');
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
                                label="City"
                                placeholder="e.g. Gobichettipalayam"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                required
                            />

                            <Input
                                label="Address"
                                placeholder="e.g. 12, Main Road, Near Bus Stand"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                required
                            />

                            {/* Directions Link */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-300 ml-1">Google Maps Directions Link <span className="text-red-400 text-xs font-normal ml-1">*required</span></label>
                                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
                                    <p className="text-xs text-gray-400">Open Google Maps → find the court → tap <strong className="text-gray-300">Share → Copy Link</strong> → paste here. Used for "Get Directions" button.</p>
                                    <Input type="url" placeholder="https://maps.app.goo.gl/..." value={formData.directionsLink} onChange={(e) => setFormData({ ...formData, directionsLink: e.target.value })} required />
                                </div>
                            </div>

                            {/* GPS Coordinates */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-300 ml-1">GPS Coordinates <span className="text-gray-500 font-normal text-xs">(optional — will auto-geocode from address if blank)</span></label>
                                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="text"
                                            placeholder="Paste Google Maps link — https://maps.app.goo.gl/..."
                                            value={mapsLink}
                                            onChange={(e) => setMapsLink(e.target.value)}
                                            className="flex-1 h-10 px-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-gray-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={fetchCoordsFromMapsLink}
                                            disabled={!mapsLink.trim() || mapsLoading}
                                            className="h-10 px-4 rounded-xl text-sm font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                        >
                                            {mapsLoading ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
                                            Fetch
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-sm font-medium text-gray-300 ml-1 block mb-2">Latitude</label>
                                            <input
                                                type="number"
                                                step="any"
                                                placeholder="e.g. 11.4532"
                                                value={manualLat != null ? String(manualLat) : ''}
                                                onChange={(e) => setManualLat(e.target.value ? Number(e.target.value) : undefined)}
                                                className="w-full h-10 px-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-gray-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-300 ml-1 block mb-2">Longitude</label>
                                            <input
                                                type="number"
                                                step="any"
                                                placeholder="e.g. 77.7302"
                                                value={manualLng != null ? String(manualLng) : ''}
                                                onChange={(e) => setManualLng(e.target.value ? Number(e.target.value) : undefined)}
                                                className="w-full h-10 px-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-gray-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                    {manualLat != null && manualLng != null && (
                                        <p className="text-xs text-emerald-400 flex items-center gap-1">
                                            <MapPin size={11} /> Coordinates set — geocoding will be skipped
                                        </p>
                                    )}
                                </div>
                            </div>

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

                            {/* Amenities */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 ml-1">Amenities</label>
                                <div className="flex gap-2">
                                    <Input
                                        value={newAmenity}
                                        onChange={(e) => setNewAmenity(e.target.value)}
                                        placeholder="Add amenity (e.g. Parking)"
                                        className="flex-1"
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddAmenity(); } }}
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

                            {/* Image Upload */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-300 ml-1 flex items-center gap-2">
                                    <ImageIcon size={16} className="text-[var(--turf-green)]" />
                                    Upload Images
                                    <span className="text-xs text-gray-500 font-normal">(via Cloudinary)</span>
                                </label>

                                <div className="border border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-[var(--turf-green)] transition-colors relative group">
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-[var(--turf-green)] transition-colors">
                                        <Upload className="w-8 h-8" />
                                        <span className="text-sm">
                                            {images.length > 0
                                                ? `${images.length} image${images.length > 1 ? 's' : ''} selected`
                                                : 'Click to upload images'}
                                        </span>
                                        <span className="text-xs text-gray-600">PNG, JPG up to 10MB each</span>
                                    </div>
                                </div>

                                {/* Image previews */}
                                {images.length > 0 && (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-2">
                                        {images.map((file, idx) => (
                                            <div key={idx} className="relative group/img rounded-lg overflow-hidden border border-white/10 bg-white/5 aspect-video">
                                                <img
                                                    src={URL.createObjectURL(file)}
                                                    alt={file.name}
                                                    className="w-full h-full object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveImage(idx)}
                                                    className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-red-400 opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Upload progress */}
                                {uploadProgress && (
                                    <div className="flex items-center gap-2 text-xs text-[var(--turf-green)] bg-[var(--turf-green)]/10 border border-[var(--turf-green)]/20 rounded-lg px-3 py-2">
                                        <Loader2 size={14} className="animate-spin flex-shrink-0" />
                                        {uploadProgress}
                                    </div>
                                )}
                            </div>

                            <Button type="submit" className="w-full h-12 text-lg" isLoading={loading}>
                                {loading ? 'Uploading & Creating...' : 'List Turf'}
                            </Button>
                        </form>
                    </GlassCard>
                </div>
            </div>
        </main>
    );
}
