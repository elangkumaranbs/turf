import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <Hero />

      {/* Placeholder for future sections */}
      <section className="py-20 container mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold text-white mb-8">Why Choose TurfGameDen?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {['Premium Facilities', 'Instant Booking', 'Competitive Pricing'].map((feature) => (
            <div key={feature} className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-[var(--turf-green)] transition-all group cursor-pointer">
              <h3 className="text-xl font-semibold text-white group-hover:text-[var(--turf-green)]">{feature}</h3>
              <p className="mt-4 text-gray-400">Experience various turfs with high quality maintenance and lighting.</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};
