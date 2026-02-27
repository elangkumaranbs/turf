import { Navbar } from "@/components/Navbar";
import { ShieldCheck, Target, Users, MapPin } from "lucide-react";
import Image from "next/image";

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-[#0a0a0a] pb-20">
            <Navbar />
            
            {/* Header Content */}
            <section className="pt-32 pb-16 px-6 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-[var(--turf-green)]/10 blur-[100px] pointer-events-none rounded-full" />
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
                        Revolutionizing <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--turf-green)] to-emerald-400">
                            Turf Sports Play
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-400 leading-relaxed">
                        TurfGameDen was built with a simple mission: to connect passionate players with premium sports turfs seamlessly. No more calling multiple venues, no more double bookings. Just find, book, and play.
                    </p>
                </div>
            </section>

            {/* Image Grid Section */}
            <section className="container mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[400px] md:h-[500px]">
                    <div className="md:col-span-8 relative rounded-3xl overflow-hidden group">
                        <Image 
                            src="https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?q=80&w=2000&auto=format&fit=crop"
                            alt="Football match"
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                    <div className="md:col-span-4 relative rounded-3xl overflow-hidden group hidden md:block">
                        <Image 
                            src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1000&auto=format&fit=crop"
                            alt="Cricket pitch"
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                </div>
            </section>

            {/* Core Values Section */}
            <section className="container mx-auto px-6 py-20">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-white mb-4">Our Core Values</h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">What drives us to build the best sports booking platform.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        { icon: Users, title: 'Community First', desc: 'Building strong networks of players and teams across the city.' },
                        { icon: ShieldCheck, title: 'Trust & Safety', desc: 'Verified venues and secure payments for peace of mind.' },
                        { icon: Target, title: 'Accessibility', desc: 'Making sports accessible to everyone, everywhere.' },
                        { icon: MapPin, title: 'Local Focus', desc: 'Supporting local turf owners and growing neighborhood sports.' }
                    ].map((val, idx) => {
                        const Icon = val.icon;
                        return (
                            <div key={idx} className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-colors">
                                <div className="w-14 h-14 bg-[var(--turf-green)]/10 rounded-2xl flex items-center justify-center mb-6">
                                    <Icon className="w-7 h-7 text-[var(--turf-green)]" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{val.title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">{val.desc}</p>
                            </div>
                        )
                    })}
                </div>
            </section>
        </main>
    );
}
