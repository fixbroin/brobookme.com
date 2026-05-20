
import { getProviderByUsername } from "@/lib/data";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicPageLayout } from "../_components/public-page-layout";
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const provider = await getProviderByUsername(username);
  if (!provider || !provider.settings.customPages?.about?.enabled) {
    return { title: 'Not Found' };
  }
  
  const aboutSettings = provider.settings.customPages.about;
  const pageTitle = aboutSettings.title || `About ${provider.name}`;
  
  const ogImage = provider.logoUrl || '/og-image.png';

  return {
    title: pageTitle,
    description: aboutSettings.description?.substring(0, 160) || `Learn more about ${provider.name}.`,
    alternates: {
      canonical: `/${username}/about`,
    },
    openGraph: {
      title: pageTitle,
      description: aboutSettings.description?.substring(0, 160),
      url: `/${username}/about`,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: aboutSettings.description?.substring(0, 160),
      images: [ogImage],
    }
  };
}

export default async function ProviderAboutPage({ params }: Props) {
    const { username } = await params;
    const provider = await getProviderByUsername(username);

    if (!provider || !provider.settings.customPages?.about?.enabled) {
        notFound();
    }

    const { title, description } = provider.settings.customPages.about;

    return (
        <PublicPageLayout provider={provider} pageName="About">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div 
                        className="prose dark:prose-invert max-w-none whitespace-pre-line"
                    >
                      {description}
                    </div>
                </CardContent>
            </Card>
        </PublicPageLayout>
    );
}
