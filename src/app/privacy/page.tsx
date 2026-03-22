import { Navbar } from '@/components/Navbar';

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-[var(--background)] text-gray-300">
            <Navbar />
            <div className="container mx-auto px-4 sm:px-6 pt-32 pb-20 max-w-4xl">
                <h1 className="text-4xl font-black text-white mb-8">Privacy Policy</h1>
                
                <div className="space-y-6 prose prose-invert max-w-none">
                    <p>Last updated: {new Date().toLocaleDateString()}</p>
                    
                    <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Information We Collect</h2>
                    <p>We collect information you provide directly to us when you register for an account, book a turf, or contact support. This includes your name, email address, phone number, and payment information.</p>

                    <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. How We Use Information</h2>
                    <p>We use the information we collect to process your bookings, send you confirmations, provide customer support, and improve our platform's functionality.</p>

                    <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. Information Sharing</h2>
                    <p>We share your booking details (name, phone number) with the respective turf owner to facilitate your booking. We share payment information securely with our payment processor, Razorpay. We do not sell your personal data to third parties.</p>

                    <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Data Security</h2>
                    <p>We implement appropriate technical and organizational security measures designed to protect the security of any personal information we process.</p>

                    <h2 className="text-2xl font-bold text-white mt-8 mb-4">5. Your Rights</h2>
                    <p>You have the right to access, update, or delete your personal information. You can do this through your account dashboard or by contacting our support team.</p>
                </div>
            </div>
        </main>
    );
}
