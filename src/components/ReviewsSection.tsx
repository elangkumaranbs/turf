'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getReviewsForTurf, addReview, deleteReview, Review } from '@/lib/firebase/reviews';
import { GlassCard } from '@/components/ui/GlassCard';
import { Star, MessageSquare, Trash2, Loader2, Send } from 'lucide-react';

export function ReviewsSection({ turfId }: { turfId: string }) {
    const { user } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // Form state
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [hoverRating, setHoverRating] = useState(0);

    const fetchReviews = async () => {
        setLoading(true);
        const data = await getReviewsForTurf(turfId);
        setReviews(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchReviews();
    }, [turfId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !comment.trim()) return;

        setSubmitting(true);
        try {
            await addReview({
                turfId,
                userId: user.uid,
                userName: user.displayName || 'Player',
                userImage: user.photoURL || undefined,
                rating,
                comment: comment.trim()
            });
            setComment('');
            setRating(5);
            fetchReviews(); // Refresh
        } catch (error) {
            alert('Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (reviewId: string) => {
        if (!confirm('Delete this review?')) return;
        try {
            await deleteReview(reviewId, turfId);
            setReviews(reviews.filter(r => r.id !== reviewId));
        } catch (error) {
            alert('Failed to delete review');
        }
    };

    // Calculate distribution
    const ratingDistribution = [5, 4, 3, 2, 1].map(stars => ({
        stars,
        count: reviews.filter(r => r.rating === stars).length,
        percentage: reviews.length ? (reviews.filter(r => r.rating === stars).length / reviews.length) * 100 : 0
    }));

    return (
        <div className="space-y-8 mt-12 animate-fade-up">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="bg-yellow-500/10 p-2 rounded-xl text-yellow-400">
                    <MessageSquare size={24} />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Player Reviews</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Stats & Form Column */}
                <div className="space-y-6 lg:col-span-1">
                    {/* Overview Stats */}
                    {reviews.length > 0 && (
                        <GlassCard className="p-6 border-white/5 bg-white/[0.02]">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="text-5xl font-black text-white">
                                    {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)}
                                </div>
                                <div>
                                    <div className="flex text-yellow-400 mb-1">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <Star key={star} size={18} fill={star <= Math.round(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) ? 'currentColor' : 'none'} className={star > Math.round(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) ? 'text-gray-600' : ''} />
                                        ))}
                                    </div>
                                    <p className="text-sm text-gray-400">{reviews.length} total reviews</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {ratingDistribution.map(({ stars, count, percentage }) => (
                                    <div key={stars} className="flex items-center gap-3 text-sm">
                                        <span className="w-4 font-medium text-gray-400">{stars}</span>
                                        <Star size={12} className="text-gray-500" fill="currentColor" />
                                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percentage}%` }} />
                                        </div>
                                        <span className="w-6 text-right text-gray-500 text-xs">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    )}

                    {/* Write Review Form */}
                    <GlassCard className="p-6 border-[var(--turf-green)]/20 bg-gradient-to-br from-[var(--turf-green)]/5 to-transparent relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--turf-green)]/10 blur-3xl rounded-full" />
                        <h4 className="text-lg font-bold text-white mb-4 relative z-10">Rate this Turf</h4>
                        
                        {!user ? (
                            <div className="text-center p-4 bg-white/5 border border-white/10 rounded-xl relative z-10">
                                <p className="text-gray-400 text-sm mb-3">Sign in to share your experience with this court.</p>
                                <button onClick={() => window.location.href='/login'} className="text-[var(--turf-green)] text-sm font-semibold hover:underline">Log In</button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                                {/* Star Selection */}
                                <div className="flex items-center gap-1 mb-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            className="focus:outline-none transition-transform hover:scale-110 p-1"
                                        >
                                            <Star
                                                size={28}
                                                fill={(hoverRating || rating) >= star ? '#FBBF24' : 'none'}
                                                className={(hoverRating || rating) >= star ? 'text-yellow-400' : 'text-gray-500'}
                                            />
                                        </button>
                                    ))}
                                </div>

                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Tell others about your experience..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:border-[var(--turf-green)]/50 focus:ring-1 focus:ring-[var(--turf-green)]/30 outline-none transition-all resize-none min-h-[100px] text-sm"
                                    required
                                />

                                <button
                                    type="submit"
                                    disabled={submitting || !comment.trim()}
                                    className="w-full bg-[var(--turf-green)] hover:bg-emerald-500 text-black px-4 py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                    Submit Review
                                </button>
                            </form>
                        )}
                    </GlassCard>
                </div>

                {/* Reviews List Column */}
                <div className="lg:col-span-2 space-y-4">
                    {loading ? (
                        <div className="flex justify-center p-10"><Loader2 className="animate-spin text-[var(--turf-green)]" /></div>
                    ) : reviews.length === 0 ? (
                        <div className="text-center p-10 border border-white/5 rounded-2xl bg-white/[0.02]">
                            <Star size={32} className="text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400">No reviews yet. Be the first to rate this turf!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reviews.map((r, i) => (
                                <GlassCard key={r.id || i} className="p-5 sm:p-6 border-white/5 bg-white/[0.01]">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex flex-shrink-0 items-center justify-center overflow-hidden border border-white/10">
                                                {r.userImage ? (
                                                    <img src={r.userImage} alt={r.userName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-sm font-bold text-white">{r.userName.charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div>
                                                <h5 className="font-semibold text-white text-sm sm:text-base">{r.userName}</h5>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <div className="flex text-yellow-400">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} size={12} fill={i < r.rating ? 'currentColor' : 'none'} className={i >= r.rating ? 'text-gray-600' : ''} />
                                                        ))}
                                                    </div>
                                                    <span className="text-xs text-gray-500">— {new Date(r.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Delete button if user owns review or is super admin */}
                                        {user && (user.uid === r.userId || user.role === 'super_admin') && r.id && (
                                            <button onClick={() => handleDelete(r.id!)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-gray-300 mt-4 text-sm sm:text-base leading-relaxed break-words">{r.comment}</p>
                                </GlassCard>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
