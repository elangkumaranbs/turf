'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { GlassCard } from '@/components/ui/GlassCard';
import { getTurfById, getUserById, updateUserProfile, Turf } from '@/lib/firebase/firestore';
import { MapPin, CheckCircle, ChevronLeft, ChevronRight, X, ZoomIn, Images, Navigation2, Star, Phone, Loader2 } from 'lucide-react';
import Image from 'next/image';
import cloudinaryLoader from '@/lib/cloudinaryLoader';
import { haversineDistance, formatDistance } from '@/lib/geocoding';
import { createBooking, createPendingOrder, deletePendingOrder } from '@/lib/firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { SlotPicker } from '@/components/SlotPicker';
import { ReviewsSection } from '@/components/ReviewsSection';
import { useRouter, useSearchParams } from 'next/navigation';
import { createRazorpayOrder, initiatePayment, verifyPayment } from '@/lib/razorpay';
import type { RazorpaySuccessResponse } from '@/lib/razorpay';
import { sendBookingEmails } from '@/lib/emailjs';

export default function TurfDetailsPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const router = useRouter();
    const [turf, setTurf] = useState<Turf | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

    // Phone number modal state
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [phoneInput, setPhoneInput] = useState('');
    const [phoneSaving, setPhoneSaving] = useState(false);
    const [pendingBookingData, setPendingBookingData] = useState<{ date: string; times: string[] } | null>(null);

    const initialDate = searchParams.get('date');
    const initialTime = searchParams.get('time');

    useEffect(() => {
        const fetchTurf = async () => {
            if (typeof params.id === 'string') {
                const data = await getTurfById(params.id);
                setTurf(data);
            }
            setLoading(false);
        };
        fetchTurf();

        // Try to get user location for distance calculation
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => {} // Ignore errors silently on details page
            );
        }
    }, [params.id]);

    // Keyboard navigation for lightbox
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!lightboxOpen || !turf) return;
        if (e.key === 'ArrowRight') setSelectedImage(i => (i + 1) % turf.images.length);
        if (e.key === 'ArrowLeft') setSelectedImage(i => (i - 1 + turf.images.length) % turf.images.length);
        if (e.key === 'Escape') setLightboxOpen(false);
    }, [lightboxOpen, turf]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Lock body scroll when lightbox open
    useEffect(() => {
        document.body.style.overflow = lightboxOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [lightboxOpen]);

    // ─── Booking Flow ─────────────────────────────────────────────────
    const handleBooking = async (date: string, times: string[]) => {
        if (!turf || !user) return;

        // Fetch the customer's latest profile to check for phone number
        const customerProfile = await getUserById(user.uid);
        const customerPhone = customerProfile?.phone || '';

        if (!customerPhone) {
            // No phone on profile — show modal to collect it before payment
            setPendingBookingData({ date, times });
            setPhoneInput('');
            setShowPhoneModal(true);
            return;
        }

        // Phone exists — proceed directly to payment
        await proceedWithPayment(date, times, customerPhone);
    };

    // Called after phone is confirmed (either from profile or from modal)
    const proceedWithPayment = async (date: string, times: string[], customerPhone: string) => {
        if (!turf || !user) return;

        const totalAmount = times.length * turf.pricePerHour;

        try {
            // Step 1: Create Razorpay order
            const orderData = await createRazorpayOrder({
                amount: totalAmount,
                turfId: turf.id,
                turfName: turf.name,
                slots: times,
                date,
                userId: user.uid,
            });

            // Step 2: Create pending order (slot lock)
            await createPendingOrder({
                turfId: turf.id,
                date,
                slots: times,
                userId: user.uid,
                orderId: orderData.orderId,
            });

            // Step 3: Open Razorpay checkout
            await initiatePayment({
                orderId: orderData.orderId,
                amount: orderData.amount,
                currency: orderData.currency,
                turfName: turf.name,
                userName: user.displayName || '',
                userEmail: user.email || '',
                userPhone: customerPhone,
                onSuccess: async (response) => {
                    try {
                        // Step 4: Verify payment signature on server
                        const verification = await verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            bookingData: {
                                userId: user.uid,
                                turfId: turf.id,
                                date,
                                times,
                            },
                        });

                        if (verification.verified) {
                            // Step 5: Create confirmed booking with payment details
                            await createBooking({
                                userId: user.uid,
                                turfId: turf.id,
                                date,
                                times,
                                duration: 60 * times.length,
                                paymentId: verification.paymentId,
                                orderId: verification.orderId,
                                amountPaid: orderData.amount,
                                bookingType: 'online',
                            });

                            // Step 5b: Save the phone number from Razorpay checkout to the customer's Firebase profile
                            if (verification.contactPhone) {
                                try {
                                    await updateUserProfile(user.uid, { phone: verification.contactPhone });
                                } catch (phoneUpdateErr) {
                                    console.error('Failed to update customer phone (non-blocking):', phoneUpdateErr);
                                }
                            }

                            // Step 6: Remove slot lock
                            await deletePendingOrder(orderData.orderId);

                            // Step 7: Send booking notification emails (fire-and-forget)
                            try {
                                const ownerData = await getUserById(turf.adminId);
                                const turfLocation = [turf.address, turf.city].filter(Boolean).join(', ') || turf.location || '';
                                const ownerEmail = turf.contactEmail || ownerData?.email || '';
                                sendBookingEmails({
                                    turfName: turf.name,
                                    turfLocation,
                                    bookingDate: date,
                                    bookingSlots: times.join(', '),
                                    amountPaid: totalAmount,
                                    customerName: user.displayName || 'Customer',
                                    customerEmail: user.email || '',
                                    customerPhone: verification.contactPhone || customerPhone,
                                    ownerName: ownerData?.name || 'Turf Owner',
                                    ownerEmail,
                                });
                            } catch (emailError) {
                                console.error('Email notification error (non-blocking):', emailError);
                            }

                            // Step 8: Send Custom FCM Push Notifications (fire-and-forget)
                            try {
                                // 1. Customer Notification
                                fetch('/api/notifications', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        targetUserId: user.uid,
                                        title: "You're all set! 🏏",
                                        body: `Your match at ${turf.name} is confirmed for ${new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${times.join(', ')}.`
                                    })
                                }).catch(err => console.error('Failed to trigger customer push notification:', err));

                                // 2. Turf Owner Notification
                                if (turf.adminId) {
                                    fetch('/api/notifications', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            targetUserId: turf.adminId, // Owner
                                            title: "New Booking Received! 💰",
                                            body: `[${user.displayName || 'A Player'}] just paid ₹${(totalAmount / 100).toLocaleString('en-IN')} for ${turf.name}.`
                                        })
                                    }).catch(err => console.error('Failed to trigger owner push notification:', err));
                                }
                            } catch (pushError) {
                                console.error('Push notification trigger error (non-blocking):', pushError);
                            }

                            alert('🎉 Payment Successful! Your booking is confirmed.');
                            router.push('/dashboard');
                        }
                    } catch (verifyError: any) {
                        console.error('Verification error:', verifyError);
                        alert(`Payment received but verification failed. Please contact support with Payment ID: ${response.razorpay_payment_id}`);
                    }
                },
                onFailure: async (error) => {
                    console.error('Payment failed:', error);
                    // Clean up pending order on failure
                    await deletePendingOrder(orderData.orderId);
                    alert(`Payment failed: ${error.description || 'Please try again.'}`);
                },
                onDismiss: async () => {
                    // Clean up pending order when user closes modal
                    await deletePendingOrder(orderData.orderId);
                },
            });
        } catch (error: any) {
            console.error('Booking error:', error);
            if (error.message?.includes('Too many requests')) {
                alert('Too many attempts. Please wait a minute and try again.');
            } else {
                alert(`Failed to initiate payment: ${error.message}`);
            }
        }
    };

    // ─── Phone Modal Submit ─────────────────────────────────────────
    const handlePhoneSubmit = async () => {
        if (!user || !pendingBookingData) return;

        const trimmed = phoneInput.trim();
        // Basic Indian phone validation: 10 digits, optionally prefixed with +91
        const phoneRegex = /^(\+91[\-\s]?)?[6-9]\d{9}$/;
        if (!phoneRegex.test(trimmed.replace(/\s/g, ''))) {
            alert('Please enter a valid 10-digit Indian mobile number.');
            return;
        }

        setPhoneSaving(true);
        try {
            // Save phone to Firebase profile
            await updateUserProfile(user.uid, { phone: trimmed });

            // Close modal and proceed to payment
            setShowPhoneModal(false);
            await proceedWithPayment(pendingBookingData.date, pendingBookingData.times, trimmed);
        } catch (err) {
            console.error('Error saving phone number:', err);
            alert('Failed to save phone number. Please try again.');
        } finally {
            setPhoneSaving(false);
            setPendingBookingData(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-2 border-[var(--turf-green)] border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400 font-medium">Loading turf details...</p>
                </div>
            </div>
        );
    }

    if (!turf) {
        return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Turf not found</div>;
    }

    const images = turf.images || [];
    const hasMultiple = images.length > 1;

    const prevImage = () => setSelectedImage(i => (i - 1 + images.length) % images.length);
    const nextImage = () => setSelectedImage(i => (i + 1) % images.length);

    let distanceStr: string | null = null;
    if (userLocation && turf.lat != null && turf.lng != null) {
        const dist = haversineDistance(userLocation.lat, userLocation.lng, turf.lat, turf.lng);
        distanceStr = formatDistance(dist);
    }

    return (
        <main className="min-h-screen bg-[var(--background)] relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--turf-green)]/10 rounded-full blur-[120px] pointer-events-none animate-float" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[130px] pointer-events-none animate-float" style={{ animationDelay: '2s' }} />

            <Navbar />

            <div className="container mx-auto px-4 sm:px-6 pt-28 sm:pt-36 pb-16 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">

                    {/* ── Gallery ── */}
                    <div className="space-y-4 animate-fade-up">

                        {/* Main Image */}
                        <div
                            className="relative h-[350px] sm:h-[450px] lg:h-[500px] w-full rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] group cursor-pointer"
                            onClick={() => setLightboxOpen(true)}
                        >
                            <Image
                                loader={cloudinaryLoader}
                                src={images[selectedImage]}
                                alt={turf.name}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                            {/* Image counter badge */}
                            {hasMultiple && (
                                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                                    <Images size={12} />
                                    {selectedImage + 1} / {images.length}
                                </div>
                            )}

                            {/* Zoom hint */}
                            <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/50 backdrop-blur-md border border-white/10 text-white/70 text-xs px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <ZoomIn size={12} /> View fullscreen
                            </div>

                            {/* Arrow buttons on main image */}
                            {hasMultiple && (
                                <>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-[var(--turf-green)] hover:border-[var(--turf-green)] transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-[var(--turf-green)] hover:border-[var(--turf-green)] transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Thumbnail strip */}
                        {hasMultiple && (
                            <div className="flex gap-3 overflow-x-auto pb-2 pt-1 snap-x scrollbar-hide">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(idx)}
                                        className={`relative flex-shrink-0 snap-start rounded-2xl overflow-hidden border-2 transition-all duration-300
                                            ${selectedImage === idx
                                                ? 'w-24 h-24 sm:w-28 sm:h-28 border-[var(--turf-green)] shadow-[0_0_20px_rgba(46,204,113,0.4)] scale-105'
                                                : 'w-20 h-20 sm:w-24 sm:h-24 border-white/10 opacity-50 hover:opacity-100 hover:border-white/30 hover:scale-102'}`}
                                    >
                                        <Image loader={cloudinaryLoader} src={img} alt={`Photo ${idx + 1}`} fill className="object-cover" />
                                        {selectedImage === idx && (
                                            <div className="absolute inset-0 ring-2 ring-inset ring-[var(--turf-green)]/50 rounded-2xl" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Details ── */}
                    <div className="space-y-8 animate-fade-up" style={{ animationDelay: '0.2s' }}>
                        <div>
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                <span className="bg-[var(--turf-green)]/10 border border-[var(--turf-green)]/20 text-[var(--turf-green)] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(46,204,113,0.15)] flex items-center gap-1.5">
                                    <CheckCircle size={14} className="opacity-80" /> Available Now
                                </span>
                                <span className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-xs font-bold text-gray-300 uppercase tracking-wider backdrop-blur-md">
                                    {turf.wicketType} Wicket
                                </span>
                                {turf.averageRating && turf.averageRating > 0 && (
                                    <span className="bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-full text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(234,179,8,0.15)]">
                                        <Star size={14} fill="currentColor" />
                                        {turf.averageRating.toFixed(1)} ({turf.reviewCount} {turf.reviewCount === 1 ? 'Review' : 'Reviews'})
                                    </span>
                                )}
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-black text-white mb-3 tracking-tight leading-tight">
                                {turf.name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                                <div className="flex items-center text-gray-400 text-base sm:text-lg font-medium">
                                    <MapPin className="w-5 h-5 mr-2 text-[var(--turf-green)]" />
                                    {[turf.address, turf.city].filter(Boolean).join(', ') || turf.location || 'Location not specified'}
                                </div>
                                {turf.directionsLink && (
                                    <a
                                        href={turf.directionsLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all"
                                    >
                                        <Navigation2 size={14} /> Direction
                                    </a>
                                )}
                                {distanceStr && (
                                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold bg-[var(--turf-green)]/10 border border-[var(--turf-green)]/30 text-[var(--turf-green)] shadow-[0_0_15px_rgba(46,204,113,0.15)]">
                                        <Navigation2 size={14} className="fill-current" /> {distanceStr} away
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">About <span className="text-[var(--turf-green)]">Court</span></h3>
                            <p className="text-gray-400 leading-relaxed text-base sm:text-lg">{turf.description}</p>
                        </div>

                        {turf.amenities?.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">Premium <span className="text-[var(--turf-green)]">Amenities</span></h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {turf.amenities.map(item => (
                                        <div key={item} className="flex items-center text-gray-300 bg-white/5 border border-white/5 py-3 px-4 rounded-xl backdrop-blur-sm hover:bg-white/10 transition-colors group">
                                            <div className="bg-[var(--turf-green)]/10 p-1.5 rounded-lg mr-3 group-hover:bg-[var(--turf-green)]/20 transition-colors">
                                                <CheckCircle className="w-4 h-4 text-[var(--turf-green)]" />
                                            </div>
                                            <span className="font-medium text-sm sm:text-base">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <GlassCard className="p-5 sm:p-8 border-[var(--turf-green)]/30 bg-gradient-to-br from-[var(--turf-green)]/5 to-transparent relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--turf-green)]/10 blur-3xl rounded-full" />
                            <div className="flex justify-between items-end pb-6 border-b border-white/10 mb-6 relative z-10 flex-wrap gap-4">
                                <div>
                                    <span className="text-gray-400 text-xs sm:text-sm font-bold uppercase tracking-wider">Book your slot</span>
                                    <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">Select Time</h3>
                                </div>
                                <div className="text-left sm:text-right">
                                    <span className="text-gray-400 text-xs sm:text-sm font-bold uppercase tracking-wider block mb-1">Hourly Rate</span>
                                    <div className="flex items-end gap-1 sm:justify-end">
                                        <span className="text-2xl sm:text-4xl font-black text-[var(--turf-green)] leading-none animate-pulse-glow">₹{turf.pricePerHour}</span>
                                        <span className="text-gray-400 font-medium mb-1">/hr</span>
                                    </div>
                                </div>
                            </div>
                            <div className="relative z-10">
                                <SlotPicker
                                    turfId={turf.id}
                                    pricePerHour={turf.pricePerHour}
                                    onBook={handleBooking}
                                    operatingHours={turf.operatingHours}
                                    initialDate={initialDate || undefined}
                                    initialTime={initialTime || undefined}
                                />
                            </div>
                        </GlassCard>
                    </div>
                </div>

                {/* ── Native Reviews ── */}
                <ReviewsSection turfId={turf.id} />
            </div>

            {/* ── Phone Number Modal ── */}
            {showPhoneModal && (
                <div
                    className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
                    onClick={() => { setShowPhoneModal(false); setPendingBookingData(null); }}
                >
                    <div
                        className="w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl animate-fade-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-xl bg-[var(--turf-green)]/10 border border-[var(--turf-green)]/20">
                                <Phone className="w-6 h-6 text-[var(--turf-green)]" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Enter Your Phone Number</h3>
                                <p className="text-sm text-gray-400">Required before proceeding to payment</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-300">Mobile Number</label>
                                <input
                                    type="tel"
                                    placeholder="+91 98765 43210"
                                    value={phoneInput}
                                    onChange={(e) => setPhoneInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !phoneSaving) handlePhoneSubmit(); }}
                                    autoFocus
                                    className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-base text-white placeholder:text-gray-600 focus:border-[var(--turf-green)]/50 focus:ring-2 focus:ring-[var(--turf-green)]/20 focus:outline-none transition-all"
                                />
                                <p className="text-xs text-gray-500">This will be saved to your profile for future bookings</p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => { setShowPhoneModal(false); setPendingBookingData(null); }}
                                    className="flex-1 h-11 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 font-medium text-sm transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePhoneSubmit}
                                    disabled={phoneSaving || !phoneInput.trim()}
                                    className="flex-1 h-11 rounded-xl bg-[var(--turf-green)] hover:bg-[var(--turf-green)]/90 text-black font-bold text-sm transition-all shadow-[0_0_20px_rgba(46,204,113,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {phoneSaving ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                                    ) : (
                                        'Continue to Payment'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Fullscreen Lightbox ── */}
            {lightboxOpen && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center"
                    onClick={() => setLightboxOpen(false)}
                >
                    {/* Close button */}
                    <button
                        onClick={() => setLightboxOpen(false)}
                        className="absolute top-5 right-5 z-10 w-11 h-11 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
                    >
                        <X size={22} />
                    </button>

                    {/* Counter */}
                    <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white/10 border border-white/10 backdrop-blur-md text-white text-sm font-bold px-4 py-2 rounded-full">
                        <Images size={14} />
                        {selectedImage + 1} / {images.length}
                    </div>

                    {/* Prev arrow */}
                    {hasMultiple && (
                        <button
                            onClick={(e) => { e.stopPropagation(); prevImage(); }}
                            className="absolute left-4 sm:left-8 z-10 w-12 h-12 bg-white/10 hover:bg-[var(--turf-green)] border border-white/10 hover:border-[var(--turf-green)] rounded-full flex items-center justify-center text-white transition-all hover:scale-110 shadow-2xl"
                        >
                            <ChevronLeft size={24} />
                        </button>
                    )}

                    {/* Image */}
                    <div
                        className="relative w-[90vw] max-w-5xl h-[75vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Image
                            loader={cloudinaryLoader}
                            src={images[selectedImage]}
                            alt={`${turf.name} - Photo ${selectedImage + 1}`}
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>

                    {/* Next arrow */}
                    {hasMultiple && (
                        <button
                            onClick={(e) => { e.stopPropagation(); nextImage(); }}
                            className="absolute right-4 sm:right-8 z-10 w-12 h-12 bg-white/10 hover:bg-[var(--turf-green)] border border-white/10 hover:border-[var(--turf-green)] rounded-full flex items-center justify-center text-white transition-all hover:scale-110 shadow-2xl"
                        >
                            <ChevronRight size={24} />
                        </button>
                    )}

                    {/* Thumbnail strip inside lightbox */}
                    {hasMultiple && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-2 bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl max-w-[90vw] overflow-x-auto">
                            {images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={(e) => { e.stopPropagation(); setSelectedImage(idx); }}
                                    className={`relative flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === idx ? 'border-[var(--turf-green)] scale-110 shadow-[0_0_10px_rgba(46,204,113,0.5)]' : 'border-white/20 opacity-50 hover:opacity-100'}`}
                                >
                                    <Image loader={cloudinaryLoader} src={img} alt={`Thumb ${idx + 1}`} fill className="object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}
