
import { NextRequest, NextResponse } from 'next/server';
import { getProviderByUsername } from '@/lib/data';
import { updateBooking, createPaymentRecord, addNotification, getBookingById, getServiceBySlug } from '@/lib/data';
import Stripe from 'stripe';
import { formatInTimeZone } from 'date-fns-tz';
import { sendBookingConfirmationEmail, sendProviderBookingNotificationEmail } from '@/lib/email-templates';

export async function POST(req: NextRequest) {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');

    if (!sig) {
        return new NextResponse('No signature', { status: 400 });
    }

    try {
        // 1. Identify provider from metadata (we'll need to peek at the event first or use a generic client to get metadata)
        const tempStripe = new Stripe(''); // Temporary client to parse
        const event = JSON.parse(body);
        const session = event.data.object as Stripe.Checkout.Session;
        const providerUsername = session.metadata?.providerUsername;
        const bookingId = session.metadata?.bookingId;

        if (!providerUsername || !bookingId) {
            return new NextResponse('Missing metadata', { status: 400 });
        }

        // 2. Get provider's secret key and webhook secret
        const provider = await getProviderByUsername(providerUsername);
        const stripeSettings = provider?.settings?.paymentGateways?.stripe;

        if (!stripeSettings?.secretKey || !stripeSettings?.webhookSecret) {
            return new NextResponse('Provider Stripe not configured', { status: 500 });
        }

        // 3. Verify event with provider's webhook secret
        const stripe = new Stripe(stripeSettings.secretKey);
        let verifiedEvent: Stripe.Event;

        try {
            verifiedEvent = stripe.webhooks.constructEvent(body, sig, stripeSettings.webhookSecret);
        } catch (err: any) {
            console.error(`Stripe Webhook Signature Error: ${err.message}`);
            return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
        }

        // 4. Handle the event
        if (verifiedEvent.type === 'checkout.session.completed') {
            const completedSession = verifiedEvent.data.object as Stripe.Checkout.Session;
            
            // Logic similar to verifyBookingPayment
            const booking = await getBookingById(providerUsername, bookingId);
            if (booking && provider) {
                const service = await getServiceBySlug(providerUsername, booking.serviceSlug);
                const amount = (completedSession.amount_total || 0) / 100;

                const paymentData = {
                    orderId: completedSession.id,
                    paymentId: completedSession.payment_intent as string,
                    amount: amount,
                    status: 'Paid' as const,
                };

                await updateBooking(providerUsername, bookingId, {
                    status: 'Upcoming',
                    payment: paymentData
                });

                await createPaymentRecord({
                    providerUsername: providerUsername,
                    bookingId: bookingId,
                    planId: 'booking',
                    amount: amount,
                    currency: provider.settings.currency || 'INR',
                    razorpay_payment_id: completedSession.payment_intent as string,
                    razorpay_order_id: completedSession.id,
                });

                await addNotification(provider.username, {
                    message: `New booking from ${booking.customerName} for ${service?.title || booking.serviceType}.`,
                    type: 'new_booking',
                    link: `/bookings`,
                });

                // Send Emails
                const providerTimeZone = provider.settings.timezone;
                const dateFormat = provider.settings.dateFormat || 'PPP';
                const providerBookingDate = formatInTimeZone(booking.dateTime, providerTimeZone, dateFormat);
                const providerBookingTime = formatInTimeZone(booking.dateTime, providerTimeZone, 'p');

                await sendBookingConfirmationEmail(booking.customerEmail, {
                    customerName: booking.customerName,
                    providerName: provider.name,
                    serviceTitle: service?.title,
                    serviceType: booking.serviceType,
                    quantity: booking.quantity || 1,
                    bookingDate: providerBookingDate, // Simplified
                    bookingTime: providerBookingTime,
                    bookingTimeProvider: providerBookingTime,
                    bookingAddress: '', // Fill if needed
                    googleLink: '',
                    outlookLink: '',
                    icsLink: '',
                    paymentDetails: `Paid via Stripe (${provider.settings.currency} ${amount})`,
                });

                await sendProviderBookingNotificationEmail(provider.contact.email, {
                    providerName: provider.name,
                    customerName: booking.customerName,
                    customerEmail: booking.customerEmail,
                    customerPhone: booking.customerPhone,
                    serviceTitle: service?.title,
                    serviceType: booking.serviceType,
                    quantity: booking.quantity || 1,
                    bookingDate: providerBookingDate,
                    bookingTime: providerBookingTime,
                    bookingAddress: '',
                    paymentDetails: `Paid via Stripe (${provider.settings.currency} ${amount})`,
                });
            }
        }

        return new NextResponse('Webhook processed', { status: 200 });
    } catch (error: any) {
        console.error('Stripe Webhook Error:', error);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 500 });
    }
}
