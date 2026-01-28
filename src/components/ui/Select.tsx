import { SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { label: string; value: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, error, options, ...props }, ref) => {
        return (
            <div className="w-full space-y-2 relative">
                {label && <label className="text-sm font-medium text-gray-300 ml-1">{label}</label>}
                <div className="relative">
                    <select
                        ref={ref}
                        className={cn(
                            "flex h-12 w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white",
                            "focus:border-[var(--turf-green)] focus:ring-1 focus:ring-[var(--turf-green)] focus:outline-none transition-all",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                            error && "border-red-500 focus:border-red-500 focus:ring-red-500",
                            className
                        )}
                        {...props}
                    >
                        {options.map((option) => (
                            <option key={option.value} value={option.value} className="bg-[#1a1a1a] text-white">
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                {error && <p className="text-sm text-red-500 ml-1">{error}</p>}
            </div>
        );
    }
);

Select.displayName = "Select";

export { Select };
