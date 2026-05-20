
import { getProviderByUsername, getServiceBySlug } from "@/lib/data";
import { notFound } from "next/navigation";
import { PublicPageLayout } from "../../_components/public-page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import type { Metadata, ResolvingMetadata } from 'next';
import { getCurrency } from "@/lib/currencies";
import { Clock, Tag, ChevronRight, ShieldCheck, CheckCircle2, XCircle, ShieldAlert } from "lucide-react";

type Props = {
  params: Promise<{ username: string; slug: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { username, slug } = await params;
  const [provider, service] = await Promise.all([
    getProviderByUsername(username),
    getServiceBySlug(username, slug)
  ]);

  if (!provider || !service) {
    return { title: 'Not Found' };
  }

  const ogImage = service.imageUrl || provider.logoUrl || '/og-image.png';

  return {
    title: `${service.title} - ${provider.name}`,
    description: service.description,
    openGraph: {
      title: `${service.title} | Book with ${provider.name}`,
      description: service.description,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${service.title} | Book with ${provider.name}`,
      description: service.description,
      images: [ogImage],
    },
    alternates: {
      canonical: `/${username}/services/${slug}`,
    },
  };
}

export default async function ServiceDetailsPage({ params }: Props) {
  const { username, slug } = await params;
  const provider = await getProviderByUsername(username);

  if (!provider || provider.isSuspended) {
    notFound();
  }

  // Check for subscription status
  const isLifetime = provider.plan?.duration === 'lifetime';
  const hasActivePlan = isLifetime || (provider.planId && provider.planExpiry && provider.planExpiry > new Date());

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

  const service = await getServiceBySlug(username, slug);

  if (!service || !service.enabled) {
    notFound();
  }

  const currency = getCurrency(provider.settings.currency);

  return (
    <PublicPageLayout provider={provider} pageName={service.title}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <Card className="overflow-hidden border-none shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="relative aspect-square w-full">
                    <Image
                        src={service.imageUrl}
                        alt={service.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                        priority
                    />
                </div>
                <div className="flex flex-col">
                    <CardHeader className="space-y-4 p-6 md:p-8">
                        <div className="flex flex-wrap gap-2">
                            {service.assignedServiceTypes.map(type => (
                            <span key={type} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
                                {type}
                            </span>
                            ))}
                        </div>
                        <CardTitle className="text-3xl font-bold">{service.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8 pt-0 flex-1">
                        <div className="prose dark:prose-invert max-w-none">
                            <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                            {service.description}
                            </p>
                        </div>

                        {( (service.included && service.included.length > 0) || (service.excluded && service.excluded.length > 0) ) && (
                            <div className="mt-8 pt-8 border-t space-y-8">
                                {service.included && service.included.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                                            What&apos;s Included
                                        </h3>
                                        <ul className="flex flex-col gap-3">
                                            {service.included.map((item, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {service.excluded && service.excluded.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                            <XCircle className="h-5 w-5 text-destructive" />
                                            What&apos;s Not Included
                                        </h3>
                                        <ul className="flex flex-col gap-3">
                                            {service.excluded.map((item, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-destructive mt-2 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="sticky top-8 shadow-xl border-primary/10">
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Tag className="h-5 w-5" />
                    <span>Price</span>
                  </div>
                  <div className="text-xl font-bold">
                    {service.offerPrice != null && service.offerPrice < service.price ? (
                      <div className="flex flex-col items-end">
                        <span className="line-through text-muted-foreground text-sm">{currency?.symbol}{service.price}</span>
                        <span className="text-primary">{currency?.symbol}{service.offerPrice}</span>
                      </div>
                    ) : (
                      service.price > 0 ? <span>{currency?.symbol}{service.price}</span> : <span className="text-green-600 font-bold">Free</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Clock className="h-5 w-5" />
                    <span>Duration</span>
                  </div>
                  <span className="font-semibold">{service.duration} minutes</span>
                </div>
              </div>

              <Button asChild size="lg" className="w-full text-lg h-14 shadow-lg hover:shadow-primary/20 transition-all group">
                <Link href={`/${username}/book?serviceSlug=${service.slug || service.id}`}>
                  Book This Service
                  <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
                <ShieldCheck className="h-4 w-4" />
                <span>Secure Booking via BroBookMe</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicPageLayout>
  );
}
