'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getTurfsByAdmin, deleteTurf, updateTurf, Turf, getLocations, Location } from '@/lib/firebase/firestore';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MapPin, Trash2, Pencil, X, Check, Loader2, Plus, IndianRupee, Clock, Upload, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { uploadImagesToCloudinary } from '@/lib/cloudinary';
import Image from 'next/image';
import { Select } from '@/components/ui/Select';
import { formatTime12Hour } from '@/lib/utils';
import { geocodeAddress } from '@/lib/geocoding';

export default function MyCourtsPage() {
    const { user } = useAuth();
    const [turfs, setTurfs] = useState<Turf[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<Partial<Turf>>({});
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [locations, setLocations] = useState<{label: string, value: string}[]>([]);
    const [editMapsLink, setEditMapsLink] = useState('');
    const [editMapsLoading, setEditMapsLoading] = useState(false);
    const [editDirectionsLink, setEditDirectionsLink] = useState('');

    const [editImages, setEditImages] = useState<File[]>([]);
    const [editImageUrls, setEditImageUrls] = useState<string[]>([]);
    const [editNewImageUrl, setEditNewImageUrl] = useState('');
    const [editImageMode, setEditImageMode] = useState<'upload' | 'url'>('upload');
    const [editExistingImages, setEditExistingImages] = useState<string[]>([]);
    const [editUploadProgress, setEditUploadProgress] = useState('');

    const fetchData = async () => {
        if (user) {
            setLoading(true);
            const [turfsData, locationsData] = await Promise.all([
                getTurfsByAdmin(user.uid),
                getLocations()
            ]);
            setTurfs(turfsData);
            
            const options = locationsData.map(loc => ({ label: loc.name, value: loc.name })).sort((a, b) => a.label.localeCompare(b.label));
            setLocations(options);
            
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleDelete = async (turfId: string) => {
        if (!confirm('⚠️ Are you sure you want to delete this court?\n\nThis will permanently delete:\n• The court/turf\n• All bookings for this court\n\nThis action cannot be undone!')) return;
        setActionLoading(turfId);
        try {
            await deleteTurf(turfId);
            setTurfs(turfs.filter(t => t.id !== turfId));
            alert('✅ Court and all associated bookings deleted successfully!');
        } catch (error) {
            alert('Failed to delete court: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setActionLoading(null);
        }
    };

    const handleEdit = (turf: Turf) => {
        setEditingId(turf.id);
        setEditData({
            name: turf.name,
            address: turf.address || '',
            city: turf.city || '',
            pricePerHour: turf.pricePerHour,
            description: turf.description,
            operatingHours: turf.operatingHours || { open: '06:00', close: '22:00' },
            courts: turf.courts || 1,
            contactPhone: turf.contactPhone || '',
            contactEmail: turf.contactEmail || '',
            lat: turf.lat,
            lng: turf.lng,
        });
        setEditDirectionsLink(turf.directionsLink || '');
        setEditExistingImages(turf.images || []);
        setEditImages([]);
        setEditImageUrls([]);
        setEditNewImageUrl('');
        setEditImageMode('upload');
        setEditUploadProgress('');
    };

    const handleAddEditImageUrl = () => {
        const url = editNewImageUrl.trim();
        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
            setEditImageUrls([...editImageUrls, url]);
            setEditNewImageUrl('');
        }
    };

    const fetchCoordsFromMapsLink = async () => {
        if (!editMapsLink.trim()) return;
        setEditMapsLoading(true);
        try {
            const res = await fetch(`/api/resolve-maps?url=${encodeURIComponent(editMapsLink)}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch coordinates');
            setEditData(d => ({ ...d, lat: data.lat, lng: data.lng }));
            setEditDirectionsLink(prev => prev.trim() ? prev : editMapsLink);
            setEditMapsLink('');
            alert(`✓ Coordinates fetched: ${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}`);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Could not fetch coordinates from this link.');
        } finally {
            setEditMapsLoading(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!editingId) return;
        setActionLoading(editingId);
        try {
            let uploadedUrls: string[] = [];
            if (editImages.length > 0) {
                uploadedUrls = await uploadImagesToCloudinary(editImages, ({ index, total, file }) => {
                    setEditUploadProgress(`Uploading image ${index}/${total}: ${file}`);
                });
                setEditUploadProgress('All images uploaded!');
            }
            const allImages = [...editExistingImages, ...uploadedUrls, ...editImageUrls];

            // Re-geocode only if lat/lng not manually set and address/city changed
            let geoUpdate: { lat?: number; lng?: number } = {};
            if (editData.lat != null && editData.lng != null) {
                geoUpdate = { lat: editData.lat, lng: editData.lng };
            } else if (editData.address || editData.city) {
                const coords = await geocodeAddress(editData.address || '', editData.city || '');
                if (coords) geoUpdate = { lat: coords.lat, lng: coords.lng };
            }

            // Sanitize undefined values before updating
            const sanitized = Object.fromEntries(
                Object.entries({ ...editData, ...geoUpdate, directionsLink: editDirectionsLink }).filter(([, v]) => v !== undefined)
            ) as typeof editData;
            
            const finalUpdate = {
                ...sanitized,
                ...(allImages.length > 0 ? { images: allImages } : {})
            };

            await updateTurf(editingId, finalUpdate);
            setTurfs(turfs.map(t => t.id === editingId ? { ...t, ...finalUpdate } : t));
            setEditingId(null);
            setEditData({});
            setEditExistingImages([]);
            setEditImages([]);
            setEditImageUrls([]);
            setEditNewImageUrl('');
            setEditUploadProgress('');
        } catch (error) {
            alert('Failed to update court.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditData({});
        setEditDirectionsLink('');
        setEditExistingImages([]);
        setEditImages([]);
        setEditImageUrls([]);
        setEditNewImageUrl('');
        setEditUploadProgress('');
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 animate-fade-up">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                        My <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--turf-green)] to-emerald-400">Courts</span>
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg">{turfs.length} court{turfs.length !== 1 ? 's' : ''} listed and active</p>
                </div>
                <Link href="/owner/courts/add">
                    <button className="w-full sm:w-auto bg-[var(--turf-green)] hover:bg-emerald-500 text-black px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(46,204,113,0.4)] hover:scale-105">
                        <Plus size={20} /> Add New Court
                    </button>
                </Link>
            </div>

            {turfs.length === 0 ? (
                <GlassCard className="p-12 sm:p-16 text-center border-white/5 animate-fade-up w-full max-w-2xl mx-auto mt-10" style={{ animationDelay: '0.2s' }}>
                    <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                        <MapPin className="w-10 h-10 text-gray-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white tracking-tight mb-2">No courts listed yet</h3>
                    <p className="text-gray-400 text-lg mb-8">Start by adding your first court to receive premium bookings and manage your turf.</p>
                    <Link href="/owner/courts/add">
                        <button className="bg-gradient-to-r from-[var(--turf-green)] to-emerald-500 text-black px-8 py-3.5 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(46,204,113,0.4)] hover:scale-105 transition-all text-lg flex items-center mx-auto gap-2">
                            <Plus size={20} /> Add Your First Court
                        </button>
                    </Link>
                </GlassCard>
            ) : (
                <div className="space-y-6">
                    {turfs.map((turf, index) => (
                        <GlassCard 
                            key={turf.id} 
                            className="p-0 overflow-hidden border-white/5 hover:border-[var(--turf-green)]/30 transition-all duration-300 animate-fade-up bg-white/[0.02]"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            {editingId === turf.id ? (
                                /* ──── Edit Mode ──── */
                                <div className="p-6 sm:p-8 space-y-6">
                                    <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
                                        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                                            <Pencil className="text-[var(--turf-green)]" size={24} /> Edit Court
                                        </h3>
                                        <button onClick={handleCancelEdit} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <Input
                                            label="Court Name"
                                            value={editData.name || ''}
                                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                        />
                                        <Select
                                            label="City"
                                            value={editData.city || ''}
                                            onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                                            options={locations.length > 0
                                                ? [{ label: 'Select a City', value: '' }, ...locations]
                                                : [{ label: 'Loading locations...', value: '' }]}
                                        />
                                        <div className="md:col-span-2">
                                            <Input
                                                label="Address"
                                                value={editData.address || ''}
                                                onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                                            />
                                        </div>
                                        <Input
                                            label="Price per Hour (₹)"
                                            type="number"
                                            value={String(editData.pricePerHour || '')}
                                            onChange={(e) => setEditData({ ...editData, pricePerHour: Number(e.target.value) })}
                                        />
                                        <Input
                                            label="Number of Courts"
                                            type="number"
                                            value={String(editData.courts || '')}
                                            onChange={(e) => setEditData({ ...editData, courts: Number(e.target.value) })}
                                        />
                                        <Input
                                            label="Opening Time"
                                            type="time"
                                            value={editData.operatingHours?.open || '06:00'}
                                            onChange={(e) => setEditData({ ...editData, operatingHours: { ...editData.operatingHours!, open: e.target.value, close: editData.operatingHours?.close || '22:00' } })}
                                        />
                                        <Input
                                            label="Closing Time"
                                            type="time"
                                            value={editData.operatingHours?.close || '22:00'}
                                            onChange={(e) => setEditData({ ...editData, operatingHours: { ...editData.operatingHours!, close: e.target.value, open: editData.operatingHours?.open || '06:00' } })}
                                        />
                                        <Input
                                            label="Contact Phone"
                                            value={editData.contactPhone || ''}
                                            onChange={(e) => setEditData({ ...editData, contactPhone: e.target.value })}
                                        />
                                        <Input
                                            label="Contact Email"
                                            type="email"
                                            value={editData.contactEmail || ''}
                                            onChange={(e) => setEditData({ ...editData, contactEmail: e.target.value })}
                                        />
                                        {/* Directions Link */}
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-sm font-medium text-gray-300 block">Google Maps Directions Link <span className="text-red-400 text-xs font-normal ml-1">*required</span></label>
                                            <p className="text-xs text-gray-400">Open Google Maps → find the court → tap <strong className="text-gray-300">Share → Copy Link</strong> → paste here. Used for "Get Directions" button.</p>
                                            <input
                                                type="url"
                                                placeholder="https://maps.app.goo.gl/..."
                                                value={editDirectionsLink}
                                                onChange={(e) => setEditDirectionsLink(e.target.value)}
                                                className="w-full h-10 px-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-gray-500 focus:border-[var(--turf-green)]/50 focus:ring-2 focus:ring-[var(--turf-green)]/10 focus:outline-none transition-all"
                                                required
                                            />
                                        </div>
                                        {/* GPS Coordinates Section */}
                                        <div className="md:col-span-2 rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                                            <label className="text-sm font-medium text-gray-300 block">GPS Coordinates <span className="text-gray-500 font-normal text-xs">(optional)</span></label>
                                            <div className="flex gap-2 items-center">
                                                <input
                                                    type="text"
                                                    placeholder="Paste Google Maps link — https://maps.app.goo.gl/..."
                                                    value={editMapsLink}
                                                    onChange={(e) => setEditMapsLink(e.target.value)}
                                                    className="flex-1 h-10 px-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-gray-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={fetchCoordsFromMapsLink}
                                                    disabled={!editMapsLink.trim() || editMapsLoading}
                                                    className="h-10 px-4 rounded-xl text-sm font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                                >
                                                    {editMapsLoading ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
                                                    Fetch
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-300 block mb-2">Latitude</label>
                                                    <input
                                                        type="number"
                                                        step="any"
                                                        placeholder="e.g. 11.4532"
                                                        value={editData.lat != null ? String(editData.lat) : ''}
                                                        onChange={(e) => setEditData({ ...editData, lat: e.target.value ? Number(e.target.value) : undefined })}
                                                        className="w-full h-10 px-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-gray-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-300 block mb-2">Longitude</label>
                                                    <input
                                                        type="number"
                                                        step="any"
                                                        placeholder="e.g. 77.7302"
                                                        value={editData.lng != null ? String(editData.lng) : ''}
                                                        onChange={(e) => setEditData({ ...editData, lng: e.target.value ? Number(e.target.value) : undefined })}
                                                        className="w-full h-10 px-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-gray-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all"
                                                    />
                                                </div>
                                            </div>
                                            {editData.lat != null && editData.lng != null && (
                                                <p className="text-xs text-emerald-400 flex items-center gap-1">
                                                    <MapPin size={11} /> Coordinates set
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300 ml-1 block mb-1">Description</label>
                                        <textarea
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:border-[var(--turf-green)]/50 focus:ring-1 focus:ring-[var(--turf-green)]/30 outline-none transition-all resize-none min-h-[120px]"
                                            value={editData.description || ''}
                                            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                        />
                                    </div>
                                    {/* Images */}
                                    <div className="space-y-3 pt-3">
                                        <label className="text-sm font-medium text-gray-300 ml-1">Images</label>
                                        {editExistingImages.length > 0 && (
                                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                                {editExistingImages.map((img, idx) => (
                                                    <div key={idx} className="relative group/img rounded-lg overflow-hidden border border-white/10 aspect-video">
                                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                                        <button type="button" onClick={() => setEditExistingImages(editExistingImages.filter((_, i) => i !== idx))} className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-red-400 opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-500 hover:text-white">
                                                            <X size={10} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {/* Upload/URL toggle */}
                                        <div className="flex bg-white/5 rounded-xl p-1 border border-white/10 max-w-xs">
                                            <button type="button" onClick={() => setEditImageMode('upload')} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${editImageMode === 'upload' ? 'bg-[var(--turf-green)] text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                                                <Upload size={14} /> Upload Files
                                            </button>
                                            <button type="button" onClick={() => setEditImageMode('url')} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${editImageMode === 'url' ? 'bg-[var(--turf-green)] text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                                                <LinkIcon size={14} /> Paste URL
                                            </button>
                                        </div>
                                        {editImageMode === 'upload' ? (
                                            <div className="border border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-[var(--turf-green)] transition-colors relative group">
                                                <input type="file" multiple accept="image/*" onChange={(e) => { if (e.target.files) setEditImages(prev => [...prev, ...Array.from(e.target.files!)]); }} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-[var(--turf-green)] transition-colors">
                                                    <Upload className="w-8 h-8" />
                                                    <span className="text-sm">{editImages.length > 0 ? `${editImages.length} new file${editImages.length > 1 ? 's' : ''} selected` : 'Click or drag to upload images'}</span>
                                                    <span className="text-xs text-gray-600">PNG, JPG up to 10MB each</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <Input value={editNewImageUrl} onChange={(e) => setEditNewImageUrl(e.target.value)} placeholder="https://example.com/photo.jpg" className="flex-1" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddEditImageUrl(); } }} />
                                                <Button type="button" onClick={handleAddEditImageUrl} variant="secondary" className="shrink-0 gap-1"><Plus size={16} /> Add</Button>
                                            </div>
                                        )}
                                        {/* New image previews */}
                                        {(editImages.length > 0 || editImageUrls.length > 0) && (
                                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                                {editImages.map((file, idx) => (
                                                    <div key={`file-${idx}`} className="relative group/img rounded-lg overflow-hidden border border-emerald-500/30 bg-white/5 aspect-video">
                                                        <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                                                        <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-[10px] text-emerald-400 text-center py-0.5">NEW</span>
                                                        <button type="button" onClick={() => setEditImages(editImages.filter((_, i) => i !== idx))} className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-red-400 opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"><X size={10} /></button>
                                                    </div>
                                                ))}
                                                {editImageUrls.map((url, idx) => (
                                                    <div key={`url-${idx}`} className="relative group/img rounded-lg overflow-hidden border border-emerald-500/30 bg-white/5 aspect-video">
                                                        <img src={url} alt="" className="w-full h-full object-cover" />
                                                        <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-[10px] text-emerald-400 text-center py-0.5">NEW</span>
                                                        <button type="button" onClick={() => setEditImageUrls(editImageUrls.filter((_, i) => i !== idx))} className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-red-400 opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"><X size={10} /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {editUploadProgress && (
                                            <div className="flex items-center gap-2 text-xs text-[var(--turf-green)] bg-[var(--turf-green)]/10 border border-[var(--turf-green)]/20 rounded-lg px-3 py-2">
                                                <Loader2 size={14} className="animate-spin shrink-0" />
                                                {editUploadProgress}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-4 pt-4 border-t border-white/10">
                                        <button 
                                            onClick={handleSaveEdit} 
                                            disabled={actionLoading === turf.id}
                                            className="bg-[var(--turf-green)] hover:bg-emerald-500 text-black px-6 py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {actionLoading === turf.id ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />} Save Changes
                                        </button>
                                        <button 
                                            onClick={handleCancelEdit}
                                            className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-6 py-2.5 rounded-xl font-bold transition-all duration-300"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* ──── View Mode ──── */
                                <div className="flex flex-col md:flex-row">
                                    {/* Image */}
                                    <div className="relative w-full md:w-56 lg:w-72 h-56 md:h-auto flex-shrink-0">
                                        <Image
                                            src={turf.images?.[0] || 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=2000&auto=format&fit=crop'}
                                            alt={turf.name}
                                            fill
                                            className="object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l from-transparent to-black/40 pointer-events-none" />
                                        <div className={`absolute top-4 left-4 px-3 py-1 rounded-lg text-xs font-bold uppercase backdrop-blur-md shadow-lg ${turf.status === 'inactive'
                                            ? 'bg-red-500/20 text-red-500 border border-red-500/30'
                                            : 'bg-[var(--turf-green)]/20 text-[var(--turf-green)] border border-[var(--turf-green)]/30'
                                            }`}>
                                            {turf.status || 'active'}
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 p-5 sm:p-7 flex flex-col justify-between">
                                        <div>
                                            <h3 className="text-2xl font-bold text-white mb-2">{turf.name}</h3>
                                            <div className="flex items-center text-gray-400 text-sm font-medium mb-4">
                                                <MapPin size={16} className="mr-1.5 text-[var(--turf-green)]" />
                                                {[turf.address, turf.city].filter(Boolean).join(', ') || turf.location || 'Location not specified'}
                                            </div>
                                            <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm font-medium text-gray-300">
                                                <span className="flex items-center gap-1.5 bg-white/5 border border-white/5 px-3 py-1.5 rounded-lg">
                                                    <IndianRupee size={14} className="text-emerald-400" />
                                                    <span className="text-white">₹{turf.pricePerHour}</span>/hr
                                                </span>
                                                {turf.operatingHours && (
                                                    <span className="flex items-center gap-1.5 bg-white/5 border border-white/5 px-3 py-1.5 rounded-lg">
                                                        <Clock size={14} className="text-blue-400" />
                                                        {formatTime12Hour(turf.operatingHours.open)} – {formatTime12Hour(turf.operatingHours.close)}
                                                    </span>
                                                )}
                                                <span className="capitalize px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
                                                    {turf.wicketType} Wicket
                                                </span>
                                                {/* GPS Status Badge */}
                                                <span className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${turf.lat != null && turf.lng != null
                                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                                                    }`}>
                                                    <MapPin size={12} className="inline mr-1" />
                                                    {turf.lat != null && turf.lng != null ? 'GPS ✓' : 'No GPS'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-3 mt-6 pt-5 border-t border-white/10">
                                            <button
                                                onClick={() => handleEdit(turf)}
                                                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-black bg-white hover:bg-gray-200 transition-colors shadow-lg"
                                            >
                                                <Pencil size={16} /> Edit Court
                                            </button>
                                            <button
                                                onClick={() => handleDelete(turf.id)}
                                                disabled={actionLoading === turf.id}
                                                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-red-500 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                            >
                                                {actionLoading === turf.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    );
}
