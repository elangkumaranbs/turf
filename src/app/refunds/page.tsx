import { Navbar } from '@/components/Navbar';

export default function RefundsPage() {
    return (
        <main className="min-h-screen bg-[var(--background)] text-gray-300">
            <Navbar />
            <div className="container mx-auto px-4 sm:px-6 pt-32 pb-20 max-w-4xl">
                <h1 className="text-4xl font-black text-white mb-8">Cancellation & Refunds</h1>
                
                <div className="space-y-6 prose prose-invert max-w-none">
                    <p>Last updated: {new Date().toLocaleDateString()}</p>
                    
                    <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Cancellation Policy</h2>
                    <p>Users can cancel their confirmed bookings through their Dashboard. The cancellation policies are set by individual turf owners and may vary. Generally, a full refund is not guaranteed if cancellation occurs within a certain window (e.g., 24 hours) prior to the booked slot.</p>

                    <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. Refund Processing</h2>
                    <p>If a booking is eligible for a refund or if a turf owner cancels your booking due to unforeseen circumstances, the refund will be initiated automatically. The refunded amount will be credited back to the original payment source via Razorpay.</p>

                    <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. Refund Timeline</h2>
                    <p>Once initiated, refunds typically take 5-7 business days to reflect in your bank account, depending on your bank's processing times.</p>

                    <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Failed Transactions</h2>
                    <p>In the event that a payment fails but the amount is debited from your account, Razorpay will automatically reverse the transaction. This reversal may take 3-5 business days to reflect.</p>
                </div>
            </div>
        </main>
    );
}
