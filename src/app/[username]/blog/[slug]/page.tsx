import { getProviderByUsername, getBlogBySlug } from "@/lib/data";
import { notFound } from "next/navigation";
import { PublicPageLayout } from "../../_components/public-page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import type { Metadata, ResolvingMetadata } from 'next';
import { Calendar, Tag, ChevronRight, HelpCircle, ShieldAlert, ArrowLeft } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { formatInTimeZone } from 'date-fns-tz';

type Props = {
  params: Promise<{ username: string; slug: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { username, slug } = await params;
  const [provider, blog] = await Promise.all([
    getProviderByUsername(username),
    getBlogBySlug(username, slug)
  ]);

  if (!provider || !blog) {
    return { title: 'Not Found' };
  }

  const seoTitle = blog.seo?.metaTitle || blog.title;
  const seoDesc = blog.seo?.metaDescription || blog.description.slice(0, 160);
  const keywords = blog.seo?.metaKeywords || (blog.tags ? blog.tags.join(', ') : '');
  const ogImage = blog.imageUrl || provider.logoUrl || '/og-image.png';

  return {
    title: `${seoTitle} - ${provider.name}`,
    description: seoDesc,
    keywords: keywords,
    openGraph: {
      title: `${seoTitle} | ${provider.name} Blog`,
      description: seoDesc,
      images: [{ url: ogImage }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${seoTitle} | ${provider.name} Blog`,
      description: seoDesc,
      images: [ogImage],
    },
    alternates: {
      canonical: `/${username}/blog/${slug}`,
    },
  };
}

export default async function BlogDetailsPage({ params }: Props) {
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

  const blog = await getBlogBySlug(username, slug);

  if (!blog || !blog.enabled) {
    notFound();
  }

  return (
    <PublicPageLayout provider={provider} pageName={blog.title}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <Card className="overflow-hidden border-none shadow-lg bg-card">
            {blog.imageUrl && (
              <div className="relative aspect-video w-full">
                <Image
                  src={blog.imageUrl}
                  alt={blog.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </div>
            )}
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{formatInTimeZone(new Date(blog.createdAt), provider.settings.timezone || 'UTC', provider.settings.dateFormat || 'dd/MM/yyyy')}</span>
                </div>
                {blog.tags && blog.tags.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Tag className="h-4 w-4" />
                    <div className="flex flex-wrap gap-1">
                      {blog.tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">#{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-6">{blog.title}</h1>
              
              <div className="prose dark:prose-invert max-w-none mb-8">
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed text-base md:text-lg">
                  {blog.description}
                </p>
              </div>

              {blog.faq && blog.faq.length > 0 && (
                <div className="border-t pt-8 mt-8 space-y-4">
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
                    <HelpCircle className="h-5.5 w-5.5 text-primary" />
                    Frequently Asked Questions
                  </h3>
                  <Accordion type="single" collapsible className="w-full">
                    {blog.faq.map((item, idx) => (
                      <AccordionItem key={idx} value={`item-${idx}`}>
                        <AccordionTrigger className="text-left font-semibold hover:no-underline">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground whitespace-pre-line leading-relaxed">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="sticky top-8 shadow-xl border-primary/10 bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-bold">About the Author</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20">
                  <Image
                    src={provider.logoUrl || "/placeholder-avatar.png"}
                    alt={provider.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-base">{provider.name}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-1">{provider.contact.email}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                {provider.description}
              </p>
              
              <Button asChild size="lg" className="w-full text-base h-12 shadow-md hover:shadow-primary/15 transition-all group">
                <Link href={`/${username}/book`}>
                  Book Appointment Now
                  <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg" className="w-full text-base h-12">
                <Link href={`/${username}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> View Profile
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicPageLayout>
  );
}
