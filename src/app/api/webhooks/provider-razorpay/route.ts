
import { NextRequest, NextResponse } from 'next/server';
import { verifyBookingPayment } from '@/lib/actions';
import { getProviderByUsername } from '@/lib/data';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const text = await req.text();
    const event = JSON.parse(text);

    // 1. Identify the provider from notes
    const payment = event.payload.payment.entity;
    const notes = payment.notes;
    const providerUsername = notes?.providerUsername;
    const bookingId = notes?.bookingId;

    if (!providerUsername || !bookingId) {
      console.warn('Webhook received but missing providerUsername or bookingId in notes.', notes);
      return new NextResponse('Missing required notes.', { status: 400 });
    }

    // 2. Fetch provider settings for webhook secret
    const provider = await getProviderByUsername(providerUsername);
    const secret = provider?.settings?.paymentGateways?.razorpay?.webhookSecret;

    if (!secret) {
      console.error(`Razorpay webhook secret not configured for provider: ${providerUsername}`);
      // If no secret is configured, we can't verify. 
      // Some people might want to skip verification, but for security, we should require it if using webhooks.
      return new NextResponse('Webhook secret not configured on provider.', { status: 500 });
    }

    const signature = req.headers.get('x-razorpay-signature');
    if (!signature) {
      return new NextResponse('Signature not found.', { status: 400 });
    }
    
    // 3. Verify the signature
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(text);
    const generated_signature = hmac.digest('hex');

    if (generated_signature !== signature) {
      console.error(`Invalid signature for provider webhook: ${providerUsername}`);
      return new NextResponse('Invalid signature.', { status: 403 });
    }

    // 4. Handle the 'payment.captured' event
    if (event.event === 'payment.captured') {
        const amount = payment.amount / 100; // Convert from paise to rupees
        
        // We use the existing verifyBookingPayment logic which handles:
        // - Updating booking status to 'Upcoming'
        // - Creating payment record
        // - Sending emails
        // - Adding notifications
        
        // We need to pass the same format that verifyBookingPayment expects for paymentResponse
        const paymentResponse = {
            razorpay_order_id: payment.order_id,
            razorpay_payment_id: payment.id,
            razorpay_signature: signature, // This isn't strictly needed by verifyBookingPayment if we already verified here, but it expects it
        };

        const result = await verifyBookingPayment(providerUsername, bookingId, paymentResponse, amount);
        
        if (result.success) {
            console.log(`Webhook: Successfully processed booking payment for ${providerUsername}, booking ${bookingId}.`);
        } else {
            console.error(`Webhook: Failed to verify booking payment: ${result.error}`);
            return new NextResponse(`Verification failed: ${result.error}`, { status: 500 });
        }
    }

    return new NextResponse('Webhook processed.', { status: 200 });

  } catch (error: any) {
    console.error('Error processing Provider Razorpay webhook:', error);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 500 });
  }
}
