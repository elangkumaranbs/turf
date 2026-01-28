import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, ...props }, ref) => {
        return (
            <div className="w-full space-y-2">
                {label && <label className="text-sm font-medium text-gray-300 ml-1">{label}</label>}
                <input
                    ref={ref}
                    className={cn(
                        "flex h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder:text-gray-500",
                        "focus:border-[var(--turf-green)] focus:ring-1 focus:ring-[var(--turf-green)] focus:outline-none transition-all",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        error && "border-red-500 focus:border-red-500 focus:ring-red-500",
                        className
                    )}
                    {...props}
                />
                {error && <p className="text-sm text-red-500 ml-1">{error}</p>}
            </div>
        );
    }
);

Input.displayName = "Input";

export { Input };
