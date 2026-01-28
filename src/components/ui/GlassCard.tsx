import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<"div"> {
    hoverEffect?: boolean;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
    ({ className, hoverEffect = false, children, ...props }, ref) => {
        return (
            <motion.div
                ref={ref}
                initial={hoverEffect ? { opacity: 0, y: 20 } : {}}
                animate={hoverEffect ? { opacity: 1, y: 0 } : {}}
                whileHover={hoverEffect ? { y: -5, transition: { duration: 0.2 } } : {}}
                className={cn(
                    "glass-card rounded-2xl p-6",
                    className
                )}
                {...props}
            >
                {children as React.ReactNode}
            </motion.div>
        );
    }
);

GlassCard.displayName = "GlassCard";

export { GlassCard };
