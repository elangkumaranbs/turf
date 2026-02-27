import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import { CalendarCheck, MapPin, Star, ShieldCheck, Zap, Users, ArrowRight, Mail, Phone, Instagram, Twitter, Facebook } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <Hero />

      {/* Features Section */}
      <section className="py-24 container mx-auto px-6 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--turf-green)]/5 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" />
        
        <div className="relative z-10 animate-fade-up">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">Why Choose Turf<span className="text-[var(--turf-green)]">GameDen</span>?</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-20">We provide the best infrastructure, seamless booking, and a community-driven approach to turf games.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          {[
            { title: 'Premium Facilities', icon: Star, desc: 'Experience well-maintained pitches with high-quality turf and professional lighting for night matches.' },
            { title: 'Instant Booking', icon: Zap, desc: 'Skip the wait. Find available slots in real-time and secure your game with instant confirmation.' },
            { title: 'Verified Owners', icon: ShieldCheck, desc: 'Every turf on our platform is personally verified by our team to guarantee safety and quality.' }
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div key={i} className="glass-card p-10 rounded-3xl group" style={{ animationDelay: `${i * 0.2}s` }}>
                <div className="w-16 h-16 rounded-2xl bg-[var(--turf-green)]/10 flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:bg-[var(--turf-green)]/20 transition-all duration-300 shadow-lg shadow-[var(--turf-green)]/5">
                    <Icon className="w-8 h-8 text-[var(--turf-green)]" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-[var(--turf-green)] transition-colors">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed text-base">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-28 bg-black/40 border-y border-white/5 relative overflow-hidden backdrop-blur-sm">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02]" />
        <div className="container mx-auto px-6 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
                <div className="flex-1 space-y-10 animate-fade-up">
                    <div className="inline-block px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-medium text-sm shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                        Seamless Process
                    </div>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">Book your game in <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-400 to-emerald-400">3 simple steps</span></h2>
                    
                    <div className="space-y-10">
                        {[
                            { step: '01', title: 'Discover Turfs', desc: 'Browse through our curated list of premium turfs near you.', icon: MapPin, color: 'from-blue-500/20 to-transparent', border: 'border-blue-500/30' },
                            { step: '02', title: 'Select Your Slot', desc: 'Pick a date and time that works best for your team.', icon: CalendarCheck, color: 'from-teal-500/20 to-transparent', border: 'border-teal-500/30' },
                            { step: '03', title: 'Play & Enjoy', desc: 'Show up at the venue and experience the thrill of the game.', icon: Users, color: 'from-emerald-500/20 to-transparent', border: 'border-emerald-500/30' },
                        ].map((item, i) => {
                            const Icon = item.icon;
                            return (
                                <div key={i} className="flex gap-6 items-start group">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} border ${item.border} flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform shadow-lg backdrop-blur-md`}>
                                            {item.step}
                                        </div>
                                        {i !== 2 && <div className="w-px h-20 bg-gradient-to-b from-white/20 to-transparent my-3" />}
                                    </div>
                                    <div className="pt-2 flex-1">
                                        <h4 className="text-2xl font-bold text-white mb-3 flex items-center gap-3">
                                            {item.title}
                                            <Icon className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                                        </h4>
                                        <p className="text-gray-400 text-lg leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="flex-1 w-full max-w-lg mx-auto relative hidden lg:block animate-float">
                     <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden relative shadow-2xl shadow-emerald-500/20 border border-white/10">
                        <Image
                            src="https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=1000&auto=format&fit=crop"
                            alt="Players on turf"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                     </div>
                     {/* Floating stat card */}
                     <div className="absolute -bottom-8 -left-12 glass-card p-6 rounded-3xl shadow-2xl animate-float" style={{ animationDelay: '1s' }}>
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--turf-green)] to-emerald-600 flex items-center justify-center text-black shadow-lg shadow-[var(--turf-green)]/30">
                                <Users size={28} />
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-white">5k+</div>
                                <div className="text-base text-gray-300 font-medium">Active Players</div>
                            </div>
                        </div>
                     </div>
                </div>
            </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 sm:py-32 container mx-auto px-4 sm:px-6">
        <div className="relative rounded-[3rem] overflow-hidden bg-gradient-to-br from-[#111] to-black border border-white/10 p-10 sm:p-20 text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--turf-green)]/10 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '1s' }} />
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 relative z-10">Own a Turf? <br className="sm:hidden" /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--turf-green)] to-emerald-400">Partner With Us.</span></h2>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 relative z-10 leading-relaxed">
                Join our network of premium turfs and reach thousands of active players. Manage bookings, analytics, and revenue all in one sleek dashboard.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
                <Link href="/services#partner" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[var(--turf-green)] to-emerald-500 text-black font-bold text-lg hover:shadow-[0_0_30px_rgba(46,204,113,0.4)] hover:scale-105 transition-all flex items-center justify-center gap-2">
                    Become a Partner <ArrowRight size={22} />
                </Link>
                <Link href="/turfs" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/5 text-white font-bold text-lg border border-white/10 hover:bg-white/10 hover:scale-105 transition-all">
                    Explore Turfs
                </Link>
            </div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="pt-24 pb-12 bg-[#050505] border-t border-white/10 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--turf-green)]/50 to-transparent" />
        <div className="absolute -bottom-48 -right-48 w-[800px] h-[800px] bg-[var(--turf-green)]/5 rounded-full blur-[150px] pointer-events-none" />
        
        <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-20 relative z-10">
                {/* Brand */}
                <div className="lg:col-span-4 space-y-6">
                    <Link href="/" className="inline-block text-3xl font-bold font-sans tracking-tight text-white">
                        Turf<span className="text-[var(--turf-green)]">GameDen</span>
                    </Link>
                    <p className="text-gray-400 text-base leading-relaxed max-w-md">
                        The ultimate destination for sports enthusiasts to discover, book, and play at premium turfs across the city.
                    </p>
                    <div className="flex gap-4">
                        <a href="#" className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[var(--turf-green)] hover:border-[var(--turf-green)] transition-all shadow-lg">
                            <Facebook size={20} />
                        </a>
                        <a href="#" className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[var(--turf-green)] hover:border-[var(--turf-green)] transition-all shadow-lg">
                            <Twitter size={20} />
                        </a>
                        <a href="#" className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[var(--turf-green)] hover:border-[var(--turf-green)] transition-all shadow-lg">
                            <Instagram size={20} />
                        </a>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="lg:col-span-2 lg:col-start-6">
                    <h4 className="text-white font-bold text-lg mb-6">Quick Links</h4>
                    <ul className="space-y-4">
                        <li><Link href="/" className="text-gray-400 hover:text-[var(--turf-green)] transition-colors text-base font-medium">Home</Link></li>
                        <li><Link href="/about" className="text-gray-400 hover:text-[var(--turf-green)] transition-colors text-base font-medium">About Us</Link></li>
                        <li><Link href="/services" className="text-gray-400 hover:text-[var(--turf-green)] transition-colors text-base font-medium">Services</Link></li>
                        <li><Link href="/turfs" className="text-gray-400 hover:text-[var(--turf-green)] transition-colors text-base font-medium">Explore Courts</Link></li>
                    </ul>
                </div>

                {/* Contact */}
                <div className="lg:col-span-3">
                    <h4 className="text-white font-bold text-lg mb-6">Contact Us</h4>
                    <ul className="space-y-5">
                        <li className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-[var(--turf-green)]/10 flex items-center justify-center shrink-0">
                                <MapPin size={18} className="text-[var(--turf-green)]" />
                            </div>
                            <span className="text-gray-400 text-base mt-2">123 Sports Avenue, Active District, City 10001</span>
                        </li>
                        <li className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[var(--turf-green)]/10 flex items-center justify-center shrink-0">
                                <Phone size={18} className="text-[var(--turf-green)]" />
                            </div>
                            <a href="tel:+1234567890" className="text-gray-400 text-base hover:text-white transition-colors">+1 (234) 567-890</a>
                        </li>
                        <li className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[var(--turf-green)]/10 flex items-center justify-center shrink-0">
                                <Mail size={18} className="text-[var(--turf-green)]" />
                            </div>
                            <a href="mailto:hello@turfgameden.com" className="text-gray-400 text-base hover:text-white transition-colors">hello@turfgameden.com</a>
                        </li>
                    </ul>
                </div>

                {/* Newsletter */}
                <div className="lg:col-span-3">
                    <h4 className="text-white font-bold text-lg mb-6">Stay Updated</h4>
                    <p className="text-gray-400 text-base mb-6">Subscribe to our newsletter for the latest turf additions and exclusive offers.</p>
                    <div className="relative group">
                        <input 
                            type="email" 
                            placeholder="Enter your email" 
                            className="premium-input !py-4 !pr-14 !bg-[#111]"
                        />
                        <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-[var(--turf-green)] text-black flex items-center justify-center hover:bg-emerald-400 hover:shadow-[0_0_15px_rgba(46,204,113,0.5)] transition-all">
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <p className="text-gray-500 text-base text-center md:text-left">
                    &copy; {new Date().getFullYear()} TurfGameDen. All rights reserved.
                </p>
                <div className="flex gap-8 text-base font-medium">
                    <Link href="#" className="text-gray-500 hover:text-[var(--turf-green)] transition-colors">Privacy Policy</Link>
                    <Link href="#" className="text-gray-500 hover:text-[var(--turf-green)] transition-colors">Terms of Service</Link>
                </div>
            </div>
        </div>
      </footer>
    </main>
  );
}
