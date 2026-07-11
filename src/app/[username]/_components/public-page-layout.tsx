'use client';

import type { Provider } from "@/lib/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Instagram, Facebook, Twitter, Youtube, Linkedin, Globe } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ProviderFloatingButtons } from "@/components/provider-floating-buttons";
import { PublicHeader } from "@/components/public-header";
import PwaInstallButton from "@/components/pwa-install-button";
import { PushNotificationManager } from "@/components/push-notification-manager";

const WhatsAppIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.31 20.55C8.76 21.36 10.37 21.82 12.04 21.82C17.5 21.82 21.95 17.37 21.95 11.91C21.95 6.45 17.5 2 12.04 2M12.04 3.63C16.56 3.63 20.32 7.39 20.32 11.91C20.32 16.43 16.56 20.19 12.04 20.19C10.51 20.19 9.06 19.78 7.82 19.03L7.43 18.8L3.89 19.9L5.02 16.42L4.79 16.03C3.96 14.68 3.5 13.14 3.5 11.91C3.5 7.39 7.26 3.63 12.04 3.63M9.83 6.89C9.63 6.89 9.32 6.99 9.07 7.25C8.82 7.51 8.04 8.27 8.04 9.38C8.04 10.49 9.09 11.54 9.24 11.73C9.39 11.93 10.74 14.12 12.92 15C14.81 15.77 15.11 15.62 15.42 15.58C15.89 15.51 16.81 14.99 17.01 14.4C17.21 13.82 17.21 13.34 17.15 13.24C17.08 13.14 16.88 13.08 16.63 12.95C16.38 12.82 15.1 12.21 14.88 12.11C14.67 12.02 14.52 11.97 14.37 12.23C14.22 12.48 13.72 13.08 13.57 13.28C13.42 13.48 13.27 13.51 13.02 13.38C12.77 13.25 11.93 12.96 10.91 12.06C10.11 11.36 9.58 10.5 9.43 10.24C9.28 9.99 9.4 9.87 9.53 9.74C9.64 9.63 9.78 9.45 9.93 9.29C10.08 9.13 10.13 9.03 10.23 8.84C10.33 8.64 10.28 8.49 10.23 8.36C10.18 8.24 9.93 7.15 9.83 6.89Z" />
    </svg>
);

export function PublicPageLayout({ provider, children, pageName, hideFloatingButtons = false }: { provider: Provider; children: React.ReactNode; pageName: string; hideFloatingButtons?: boolean }) {
  const sl = provider.settings.socialLinks;

  return (
    <div className="min-h-screen bg-muted/40 flex flex-col items-center p-4 md:p-8">
      <PublicHeader provider={provider} />

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
          {/* Provider name & copyright */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground text-base">{provider.name}</span>
            <span className="hidden sm:inline">&bull;</span>
            <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
          </div>

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
                  <WhatsAppIcon className="h-5 w-5" />
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

      {!hideFloatingButtons && (
        <ProviderFloatingButtons settings={provider.settings.floatingButtons} />
      )}
      <PwaInstallButton appName={provider.name} appDesc={`Book an appointment with ${provider.name}`} appIcon={provider.logoUrl} />
      <PushNotificationManager type="guest" />
    </div>
  );
}
