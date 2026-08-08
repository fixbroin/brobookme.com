import { getProviderByUsername } from "@/lib/data";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import type { Metadata, ResolvingMetadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProviderBookingPageContent } from "@/components/provider-booking-page";
import type { Provider } from "@/lib/types";

type Props = {
  params: Promise<{ username: string }>;
};

// This line forces the page to be dynamically rendered, ensuring fresh data on every request.
export const dynamic = 'force-dynamic';

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { username } = await params;
  const provider = await getProviderByUsername(username);

  if (!provider) {
    return {
      title: 'Provider Not Found',
    };
  }

  const shopAddress = provider.settings?.shopAddress || '';
  let city = '';
  let state = '';
  if (shopAddress) {
    const parts = shopAddress.split(',').map(p => p.trim());
    if (parts.length >= 3) {
      city = parts[parts.length - 3];
      state = parts[parts.length - 2].split(' ')[0];
    } else if (parts.length === 2) {
      city = parts[0];
      state = parts[1];
    } else {
      city = shopAddress;
    }
  }
  const locationStr = city && state ? ` in ${city}, ${state}` : city ? ` in ${city}` : '';

  // Extract top services for title and description optimization
  const servicesList = provider.settings?.services || [];
  const topServices = servicesList.slice(0, 3).map(s => s.title).join(', ');
  const servicesSuffix = topServices ? ` (${topServices})` : '';

  const dynamicTitle = `Book ${provider.name}${servicesSuffix}${locationStr} | Online Appointment Scheduling`;
  const dynamicDescription = provider.description 
    ? `${provider.description.substring(0, 150)}... Book appointments online with ${provider.name}${locationStr}. View services, check availability, and schedule instantly.`
    : `Schedule and book appointments online with ${provider.name}${locationStr}. View pricing, select services, and secure slot times in seconds.`;

  const keywordsList = [
    username,
    provider.name,
    'appointment booking',
    'scheduling system',
    'booking slot',
    ...servicesList.map(s => s.title.toLowerCase()),
    ...(city ? [`${provider.name} ${city}`, `${city} service booking`, `appointment scheduling in ${city}`] : [])
  ];

  const ogImage = provider.logoUrl || '/og-image.png';

  return {
    title: dynamicTitle,
    description: dynamicDescription,
    keywords: keywordsList,
    alternates: {
      canonical: `/${username}`,
    },
    openGraph: {
      title: dynamicTitle,
      description: dynamicDescription,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title: dynamicTitle,
      description: dynamicDescription,
      images: [ogImage],
    },
  };
}

// Deep serialization function to handle nested Timestamps
const serializeObject = (obj: any): any => {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
      return obj;
  }

  // Firestore Timestamps
  if (obj.toDate && typeof obj.toDate === 'function') {
      return obj.toDate().toISOString();
  }

  // Plain Date objects
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  if (Array.isArray(obj)) {
      return obj.map(serializeObject);
  }
  
  const newObj: { [key: string]: any } = {};
  for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
          newObj[key] = serializeObject(obj[key]);
      }
  }
  return newObj;
};

export default async function ProviderBookingPage({ params }: Props) {
  const { username } = await params;
  const providerRaw = await getProviderByUsername(username);

  if (!providerRaw) {
    notFound();
  }

  const provider = serializeObject(providerRaw) as Provider;

  // Check for subscription status
  const isLifetime = provider.plan?.duration === 'lifetime';
  const planExpiryDate = provider.planExpiry ? new Date(provider.planExpiry) : null;
  const hasActivePlan = isLifetime || (provider.planId && planExpiryDate && planExpiryDate > new Date());

  if (!hasActivePlan) {
    return (
      <div className="min-h-screen bg-muted/40 flex flex-col items-center justify-center p-4 md:p-8">
        <Card className="max-w-lg text-center">
          <CardHeader>
            <div className="mx-auto bg-destructive/10 text-destructive rounded-full p-3 w-fit">
              <ShieldAlert className="h-10 w-10" />
            </div>
            <CardTitle className="mt-4">Booking Page Unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This provider's subscription is currently inactive. Please check back later or contact the provider directly.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (provider.isSuspended) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/30">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" />
            <CardTitle className="text-red-800 dark:text-red-300">Account Suspended</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700 dark:text-red-400">
              This booking page has been temporarily suspended by the administrator. Please contact support for assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Build dynamic JSON-LD Schema for the provider
  const servicesText = (provider.description + ' ' + (provider.settings?.services || []).map(s => s.title).join(' ')).toLowerCase();
  
  let businessType = 'LocalBusiness';
  if (servicesText.includes('plumb')) {
    businessType = 'PlumbingService';
  } else if (servicesText.includes('electri')) {
    businessType = 'Electrician';
  } else if (servicesText.includes('law') || servicesText.includes('legal') || servicesText.includes('attorney')) {
    businessType = 'LegalService';
  } else if (servicesText.includes('doctor') || servicesText.includes('physician') || servicesText.includes('clinic') || servicesText.includes('medical') || servicesText.includes('health')) {
    businessType = 'Physician';
  } else if (servicesText.includes('salon') || servicesText.includes('barber') || servicesText.includes('hair') || servicesText.includes('spa') || servicesText.includes('beauty')) {
    businessType = 'HairSalon';
  } else if (servicesText.includes('dentist')) {
    businessType = 'Dentist';
  } else if (servicesText.includes('real estate') || servicesText.includes('realtor') || servicesText.includes('property') || servicesText.includes('house') || servicesText.includes('agent')) {
    businessType = 'RealEstateAgent';
  }

  const shopAddress = provider.settings?.shopAddress || '';
  let city = '';
  let state = '';
  if (shopAddress) {
    const parts = shopAddress.split(',').map(p => p.trim());
    if (parts.length >= 3) {
      city = parts[parts.length - 3];
      state = parts[parts.length - 2].split(' ')[0];
    } else if (parts.length === 2) {
      city = parts[0];
      state = parts[1];
    } else {
      city = shopAddress;
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://brobookme.com';

  const schemaData = {
    "@context": "https://schema.org",
    "@type": businessType,
    "name": provider.name,
    "image": provider.logoUrl || `${siteUrl}/og-image.png`,
    "description": provider.description || `Online appointment booking for ${provider.name}.`,
    "url": `${siteUrl}/${username}`,
    "telephone": provider.contact?.phone || '',
    "address": {
      "@type": "PostalAddress",
      "streetAddress": shopAddress,
      "addressLocality": city,
      "addressRegion": state,
      "postalCode": '',
      "addressCountry": "US"
    },
    "priceRange": "$$",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": `${provider.name} Services Catalog`,
      "itemListElement": (provider.settings?.services || []).map((s: any, idx: number) => ({
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": s.title,
          "description": s.description || `${s.title} service provided by ${provider.name}.`
        },
        "price": s.offerPrice || s.price || 0,
        "priceCurrency": provider.settings?.currency || 'INR'
      }))
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <Suspense fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }>
        <ProviderBookingPageContent provider={provider} />
      </Suspense>
    </>
  );
}
