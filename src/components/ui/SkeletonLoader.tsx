export const SkeletonCard = () => (
    <div className="animate-pulse bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
        {/* Image skeleton */}
        <div className="h-48 bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] animate-shimmer" />
        
        {/* Content skeleton */}
        <div className="p-4 sm:p-6 space-y-4">
            {/* Title */}
            <div className="h-6 bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] animate-shimmer rounded w-3/4" />
            
            {/* Location */}
            <div className="h-4 bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] animate-shimmer rounded w-1/2" />
            
            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="h-4 bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] animate-shimmer rounded w-20" />
                <div className="h-10 bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] animate-shimmer rounded w-28" />
            </div>
        </div>
    </div>
);

export const SkeletonStats = () => (
    <div className="animate-pulse bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] animate-shimmer rounded-xl" />
        </div>
        <div className="h-3 bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] animate-shimmer rounded w-20 mb-2" />
        <div className="h-8 bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] animate-shimmer rounded w-24" />
    </div>
);

export const SkeletonBooking = () => (
    <div className="animate-pulse bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6">
        <div className="space-y-4">
            <div className="h-6 bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] animate-shimmer rounded w-2/3" />
            <div className="h-4 bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] animate-shimmer rounded w-1/2" />
            <div className="flex gap-2 pt-2">
                <div className="h-8 bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] animate-shimmer rounded-full w-32" />
                <div className="h-8 bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] animate-shimmer rounded-full w-28" />
            </div>
        </div>
    </div>
);
