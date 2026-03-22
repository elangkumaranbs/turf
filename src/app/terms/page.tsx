import { Navbar } from '@/components/Navbar';

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-[var(--background)] text-gray-300">
            <Navbar />
            <div className="container mx-auto px-4 sm:px-6 pt-32 pb-20 max-w-4xl">
                <h1 className="text-4xl font-black text-white mb-8">Terms & Conditions</h1>
                
                <div className="space-y-6 prose prose-invert max-w-none">
                    <p>Last updated: {new Date().toLocaleDateString()}</p>
                    
                    <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Introduction</h2>
                    <p>Welcome to TurfGameDen. By accessing our website and using our booking services, you agree to be bound by these Terms and Conditions.</p>

                    <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. Bookings and Payments</h2>
                    <p>All bookings made through TurfGameDen are subject to the availability of the turf. Payments are processed securely via our payment partner, Razorpay. The user is responsible for ensuring the accuracy of the booking details before completing the payment.</p>

                    <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. User Responsibilities</h2>
                    <p>Users must provide accurate information during registration and booking. Users are expected to adhere to the rules and regulations set forth by the individual turf owners while on their premises.</p>

                    <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Liability</h2>
                    <p>TurfGameDen serves as an aggregator platform connecting players with turf owners. We are not liable for any injuries, loss of property, or disputes that may occur at the turf location.</p>

                    <h2 className="text-2xl font-bold text-white mt-8 mb-4">5. Modifications</h2>
                    <p>We reserve the right to modify these terms. Continued use of the platform after any changes constitutes your consent to such changes.</p>
                </div>
            </div>
        </main>
    );
}
