import { Navbar } from '@/components/Navbar';
import { Mail, MapPin, Phone } from 'lucide-react';

export default function ContactPage() {
    return (
        <main className="min-h-screen bg-[var(--background)] text-gray-300">
            <Navbar />
            <div className="container mx-auto px-4 sm:px-6 pt-32 pb-20 max-w-4xl">
                <h1 className="text-4xl font-black text-white mb-8">Contact Us</h1>
                
                <p className="text-lg text-gray-400 mb-12">We are here to help! If you have any questions, concerns, or need assistance with your booking, please reach out to us using the information below.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl flex items-start gap-4">
                        <Mail className="text-[var(--turf-green)] w-8 h-8 flex-shrink-0" />
                        <div>
                            <h3 className="text-white text-xl font-bold mb-2">Email Support</h3>
                            <p className="text-gray-400 mb-2">Send us an email anytime. We usually respond within 24 hours.</p>
                            <a href="mailto:support@turfgameden.com" className="text-[var(--turf-green)] hover:underline font-medium">support@turfgameden.com</a>
                        </div>
                    </div>
                    
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl flex items-start gap-4">
                        <Phone className="text-[var(--turf-green)] w-8 h-8 flex-shrink-0" />
                        <div>
                            <h3 className="text-white text-xl font-bold mb-2">Phone Support</h3>
                            <p className="text-gray-400 mb-2">Call us during business hours (10 AM - 6 PM IST).</p>
                            <a href="tel:+919025516930" className="text-white font-medium">+91 9025516930</a>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl flex items-start gap-4 md:col-span-2">
                        <MapPin className="text-[var(--turf-green)] w-8 h-8 flex-shrink-0" />
                        <div>
                            <h3 className="text-white text-xl font-bold mb-2">Operating Address</h3>
                            <p className="text-gray-400 leading-relaxed">
                                1e shanthinagar<br />
                                gobichettipalayam 638452<br />
                                Tamil Nadu, India
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
