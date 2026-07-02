
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Provider } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Instagram, Facebook, Twitter, Youtube, Linkedin, Globe, MessageCircle } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ProviderFloatingButtons } from "@/components/provider-floating-buttons";

export function PublicPageLayout({ provider, children, pageName }: { provider: Provider; children: React.ReactNode; pageName: string }) {
  const customPages = provider.settings.customPages;
  const sl = provider.settings.socialLinks;

  return (
    <div className="min-h-screen bg-muted/40 flex flex-col items-center p-4 md:p-8">
      <header className="w-full max-w-7xl mx-auto mb-4">
        <div className="flex h-14 items-center justify-between rounded-lg bg-background px-4 shadow-sm border">
            <Link href={`/${provider.username}`} className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    <Image 
                        src={provider.logoUrl} 
                        alt={provider.name} 
                        width={32}
                        height={32}
                        className="aspect-square h-full w-full object-cover"
                    />
                    <AvatarFallback>{provider.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <h1 className="text-xl font-bold">{provider.name}</h1>
            </Link>
            <nav className="hidden items-center gap-4 lg:flex">
                {/* Navigation links can go here if needed in the future */}
            </nav>
        </div>
      </header>

      <main className="w-full max-w-7xl flex-1">
        <div className="mb-6 flex justify-between items-center">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/${provider.username}`}>{provider.name}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{pageName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
           <Button asChild variant="outline" size="sm" className="hidden md:flex">
            <Link href={`/${provider.username}`}><ArrowLeft className="mr-2 h-4 w-4" />Back to Profile</Link>
          </Button>
        </div>
        {children}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto mt-16 border-t border-border/60">
        <div className="py-10 flex flex-col items-center gap-6">
          {/* Provider name */}
          <p className="text-lg font-bold">{provider.name}</p>

          {/* Social icons — only shown if at least one link is set */}
          {sl && Object.values(sl).some(v => !!v) && (
            <div className="flex items-center gap-3 flex-wrap justify-center">
              {sl.instagram && (
                <Link href={sl.instagram} target="_blank" rel="noopener noreferrer"
                  className="h-10 w-10 flex items-center justify-center rounded-full bg-muted hover:bg-pink-100 hover:text-pink-600 dark:hover:bg-pink-900/30 dark:hover:text-pink-400 transition-colors"
                  aria-label="Instagram">
                  <Instagram className="h-5 w-5" />
                </Link>
              )}
              {sl.facebook && (
                <Link href={sl.facebook} target="_blank" rel="noopener noreferrer"
                  className="h-10 w-10 flex items-center justify-center rounded-full bg-muted hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors"
                  aria-label="Facebook">
                  <Facebook className="h-5 w-5" />
                </Link>
              )}
              {sl.twitter && (
                <Link href={sl.twitter} target="_blank" rel="noopener noreferrer"
                  className="h-10 w-10 flex items-center justify-center rounded-full bg-muted hover:bg-sky-100 hover:text-sky-600 dark:hover:bg-sky-900/30 dark:hover:text-sky-400 transition-colors"
                  aria-label="Twitter / X">
                  <Twitter className="h-5 w-5" />
                </Link>
              )}
              {sl.youtube && (
                <Link href={sl.youtube} target="_blank" rel="noopener noreferrer"
                  className="h-10 w-10 flex items-center justify-center rounded-full bg-muted hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                  aria-label="YouTube">
                  <Youtube className="h-5 w-5" />
                </Link>
              )}
              {sl.linkedin && (
                <Link href={sl.linkedin} target="_blank" rel="noopener noreferrer"
                  className="h-10 w-10 flex items-center justify-center rounded-full bg-muted hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/30 dark:hover:text-blue-300 transition-colors"
                  aria-label="LinkedIn">
                  <Linkedin className="h-5 w-5" />
                </Link>
              )}
              {sl.whatsapp && (
                <Link href={sl.whatsapp} target="_blank" rel="noopener noreferrer"
                  className="h-10 w-10 flex items-center justify-center rounded-full bg-muted hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/30 dark:hover:text-green-400 transition-colors"
                  aria-label="WhatsApp">
                  <MessageCircle className="h-5 w-5" />
                </Link>
              )}
              {sl.website && (
                <Link href={sl.website} target="_blank" rel="noopener noreferrer"
                  className="h-10 w-10 flex items-center justify-center rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
                  aria-label="Website">
                  <Globe className="h-5 w-5" />
                </Link>
              )}
            </div>
          )}

          {/* Powered by */}
          <p className="text-xs text-muted-foreground">
            Powered by{' '}
            <Link href="/" className="font-semibold text-primary hover:underline">BroBookMe</Link>
          </p>
        </div>
      </footer>

      <ProviderFloatingButtons settings={provider.settings.floatingButtons} />
    </div>
  );
}
