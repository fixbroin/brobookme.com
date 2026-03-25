
import { getProviderByUsername } from "@/lib/data";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { BookingForm } from "@/components/booking-form";
import type { Provider } from "@/lib/types";
import { PublicPageLayout } from "../_components/public-page-layout";
import { Metadata } from "next";
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const serializeObject = (obj: any): any => {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
      return obj;
  }
  if (obj.toDate && typeof obj.toDate === 'function') {
      return obj.toDate().toISOString();
  }
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

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const provider = await getProviderByUsername(username);
  if (!provider) {
    return { title: 'Provider Not Found' };
  }
  return {
    title: `Book an Appointment with ${provider.name}`,
    description: `Schedule your appointment with ${provider.name}.`,
    alternates: {
      canonical: `/${username}/book`,
    },
  };
}

export default async function BookAppointmentPage({ params }: Props) {
  const { username } = await params;
  const providerData = await getProviderByUsername(username);

  if (!providerData || providerData.isSuspended) {
    notFound();
  }

  // Check for subscription status
  const isLifetime = providerData.plan?.duration === 'lifetime';
  const hasActivePlan = isLifetime || (providerData.planId && providerData.planExpiry && providerData.planExpiry > new Date());
  
  if (!hasActivePlan) {
    notFound();
  }
  
  const provider = serializeObject(providerData) as Provider;

  return (
    <PublicPageLayout provider={provider} pageName="Book Appointment">
        <Suspense fallback={<div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <BookingForm provider={provider} />
        </Suspense>
         
    </PublicPageLayout>
  );
}
