import { getProviderByUsername, getBlogBySlug } from "@/lib/data";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata, ResolvingMetadata } from 'next';
import { ShieldAlert } from "lucide-react";
import BlogDetailsContent from "./blog-details-content";

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

  return <BlogDetailsContent provider={provider} blog={blog} />;
}
