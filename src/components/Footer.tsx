import Link from 'next/link';

export const Footer = () => {
    return (
        <footer className="bg-black border-t border-white/10 py-12 mt-20 relative z-10">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-4">Turf<span className="text-[var(--turf-green)]">GameDen</span></h3>
                        <p className="text-gray-400 text-sm">Premium cricket turf booking platform. Play under the lights.</p>
                    </div>
                    <div>
                        <h4 className="text-white font-semibold mb-4">Quick Links</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link href="/" className="hover:text-[var(--turf-green)] transition-colors">Home</Link></li>
                            <li><Link href="/turfs" className="hover:text-[var(--turf-green)] transition-colors">Courts</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-semibold mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link href="/terms" className="hover:text-[var(--turf-green)] transition-colors">Terms & Conditions</Link></li>
                            <li><Link href="/privacy" className="hover:text-[var(--turf-green)] transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/refunds" className="hover:text-[var(--turf-green)] transition-colors">Cancellation & Refunds</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-semibold mb-4">Contact</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li>Email: support@turfgameden.com</li>
                            <li><Link href="/contact" className="hover:text-[var(--turf-green)] transition-colors">Contact Us</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm text-gray-500">
                    &copy; {new Date().getFullYear()} TurfGameDen. All rights reserved.
                </div>
            </div>
        </footer>
    );
};
