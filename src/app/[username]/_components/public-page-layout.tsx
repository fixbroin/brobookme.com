
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Provider } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
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

      <footer className="w-full max-w-7xl mx-auto mt-12 py-8 border-t text-center text-sm text-muted-foreground">
          Powered by <Link href="/" className="font-semibold text-primary hover:underline">BroBookMe</Link>
      </footer>

      <ProviderFloatingButtons settings={provider.settings.floatingButtons} />
    </div>
  );
}
