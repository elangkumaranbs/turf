'use client';

import { Navbar } from "@/components/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { Trophy, Clock, Calendar, Shield, Map, MonitorPlay, Users } from "lucide-react";
import { submitOwnerRequest } from "@/lib/firebase/firestore";

export default function ServicesPage() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        turfName: '',
        location: '',
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess(false);

        try {
            await submitOwnerRequest(formData);
            setSuccess(true);
            setFormData({ name: '', email: '', phone: '', turfName: '', location: '', message: '' });
        } catch (err: any) {
            setError(err.message || "Failed to submit request.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#0a0a0a] pb-20">
            <Navbar />

            {/* Header Content */}
            <section className="pt-32 pb-16 px-6 text-center">
                <h1 className="text-4xl md:text-5xl font-black text-white mb-6">
                    Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Services</span>
                </h1>
                <p className="text-gray-400 max-w-2xl mx-auto text-lg hover:text-gray-300 transition-colors">
                    Whether you are an avid sports player looking for a match, or a turf owner wanting to streamline your business, we have got you covered.
                </p>
            </section>

            {/* Services Grid */}
            <section className="container mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    
                    {/* For Players */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                                <Trophy className="text-blue-400 w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">For Players</h2>
                        </div>
                        
                        <div className="grid gap-4">
                            {[
                                { icon: Clock, title: 'Real-time Availability', desc: 'See instantly when a turf is free without calling around.' },
                                { icon: Calendar, title: 'Instant Booking', desc: 'Secure your spot and get instant confirmations.' },
                                { icon: Shield, title: 'Verified Quality', desc: 'Read reviews and know what to expect before you arrive.' }
                            ].map((s, i) => (
                                <GlassCard key={i} className="p-6 border-white/5 hover:border-blue-500/30 transition-colors">
                                    <div className="flex gap-4">
                                        <s.icon className="w-6 h-6 text-blue-400 shrink-0" />
                                        <div>
                                            <h3 className="font-bold text-white mb-1">{s.title}</h3>
                                            <p className="text-sm text-gray-400">{s.desc}</p>
                                        </div>
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    </div>

                    {/* For Owners */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-[var(--turf-green)]/20 flex items-center justify-center">
                                <Map className="text-[var(--turf-green)] w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">For Turf Owners</h2>
                        </div>
                        
                        <div className="grid gap-4">
                            {[
                                { icon: MonitorPlay, title: 'Digital Dashboard', desc: 'Manage your slots, bookings, and revenue all in one place.' },
                                { icon: Users, title: 'Wider Reach', desc: 'Get your turf in front of thousands of active local players.' },
                                { icon: Shield, title: 'Secure Operations', desc: 'Eliminate no-shows with seamless booking policies.' }
                            ].map((s, i) => (
                                <GlassCard key={i} className="p-6 border-white/5 hover:border-[var(--turf-green)]/30 transition-colors">
                                    <div className="flex gap-4">
                                        <s.icon className="w-6 h-6 text-[var(--turf-green)] shrink-0" />
                                        <div>
                                            <h3 className="font-bold text-white mb-1">{s.title}</h3>
                                            <p className="text-sm text-gray-400">{s.desc}</p>
                                        </div>
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    </div>

                </div>
            </section>

            {/* Partner Contact Form */}
            <section id="partner" className="container mx-auto px-6 py-24">
                <GlassCard className="max-w-4xl mx-auto p-8 md:p-12 border-[var(--turf-green)]/20 bg-gradient-to-br from-[#0a0a0a] to-[var(--turf-green)]/5">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-4">Partner With Us</h2>
                            <p className="text-gray-400 mb-8 leading-relaxed">
                                Ready to digitize your turf business? Fill out the form below and our team will get back to you within 24 hours to help you set up your TurfGameDen owner account.
                            </p>
                            
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                        <Shield className="w-5 h-5 text-gray-300" />
                                    </div>
                                    <p className="text-sm text-gray-300 font-medium">Free Initial Setup & Onboarding</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                        <Trophy className="w-5 h-5 text-gray-300" />
                                    </div>
                                    <p className="text-sm text-gray-300 font-medium">Dedicated Support Manager</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-black/40 rounded-3xl p-6 md:p-8 border border-white/5">
                            {success ? (
                                <div className="h-full flex flex-col items-center justify-center text-center py-10 space-y-4">
                                    <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-white">Request Received!</h3>
                                    <p className="text-gray-400 text-sm">Thank you for your interest. Our team will contact you shortly.</p>
                                    <Button onClick={() => setSuccess(false)} variant="secondary" className="mt-4">Submit Another</Button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}
                                    
                                    <Input label="Your Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Email Address" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                                        <Input label="Phone Number" type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
                                    </div>
                                    <Input label="Turf / Venue Name" value={formData.turfName} onChange={e => setFormData({...formData, turfName: e.target.value})} required />
                                    <Input label="City / Location" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required />
                                    
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-300 ml-1">Message (Optional)</label>
                                        <textarea 
                                            value={formData.message}
                                            onChange={e => setFormData({...formData, message: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--turf-green)]/30 focus:border-[var(--turf-green)]/50 transition-all min-h-[100px] resize-y"
                                            placeholder="Tell us about your requirements..."
                                        />
                                    </div>
                                    
                                    <Button type="submit" isLoading={loading} className="w-full py-4 mt-2">
                                        Submit Partner Request
                                    </Button>
                                </form>
                            )}
                        </div>
                    </div>
                </GlassCard>
            </section>
        </main>
    );
}
