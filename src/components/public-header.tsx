'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Provider } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';

interface PublicHeaderProps {
  provider: Provider;
}

export function PublicHeader({ provider }: PublicHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const customPages = provider.settings.customPages;

  const navLinks = [
      { href: `/${provider.username}/about`, label: 'About', enabled: customPages?.about?.enabled },
      { href: `/${provider.username}/contact`, label: 'Contact', enabled: customPages?.contact?.enabled },
      { href: `/${provider.username}/cancellation-policy`, label: 'Cancellation Policy', enabled: customPages?.cancellationPolicy?.enabled },
  ].filter(link => link.enabled);

  const fallbackLogo = '/placeholder-logo.png'; // Fallback placeholder if logoUrl is empty

  return (
    <header className="w-full max-w-7xl mx-auto sticky top-2 md:top-4 z-50">
      <div className="flex h-14 items-center justify-between rounded-lg bg-background/80 backdrop-blur-md px-4 shadow-sm border border-border/40">
          <Link href={`/${provider.username}`} className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                  <Image 
                      src={provider.logoUrl || fallbackLogo} 
                      alt={provider.name} 
                      width={32}
                      height={32}
                      className="aspect-square h-full w-full object-cover"
                      onContextMenu={(e) => e.preventDefault()}
                      draggable={false}
                      priority
                  />
                  <AvatarFallback>{provider.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <h1 className="text-xl font-bold">{provider.name}</h1>
          </Link>
          <div className="flex items-center gap-4">
              <nav className="hidden items-center gap-4 lg:flex">
                   {navLinks.map(link => (
                      <Link key={link.href} href={link.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                          {link.label}
                      </Link>
                  ))}
              </nav>
              <ThemeToggle />
              {navLinks.length > 0 && (
                <div className="lg:hidden">
                  <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                      <SheetTrigger asChild>
                          <Button variant="outline" size="icon">
                              <Menu />
                          </Button>
                      </SheetTrigger>
                      <SheetContent side="right" className="flex flex-col h-full justify-between p-6 overflow-hidden">
                           {/* Background designs */}
                           <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
                           <div className="absolute -right-10 -bottom-10 w-[200px] h-[200px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                           <div className="absolute -left-10 top-1/4 w-[150px] h-[150px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />
                           
                           {/* Content container */}
                           <div className="flex flex-col h-full justify-between relative z-10 w-full">
                               <div className="space-y-8">
                                   <SheetHeader className="text-left">
                                       <SheetTitle>
                                           <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8">
                                                   <Image 
                                                       src={provider.logoUrl || fallbackLogo} 
                                                       alt={provider.name} 
                                                       width={32}
                                                       height={32}
                                                       className="aspect-square h-full w-full object-cover"
                                                   />
                                                   <AvatarFallback>{provider.name.charAt(0)}</AvatarFallback>
                                               </Avatar>
                                               <h1 className="text-xl font-bold">{provider.name}</h1>
                                           </div>
                                       </SheetTitle>
                                   </SheetHeader>
                                   
                                   <nav className="flex flex-col gap-2">
                                       {navLinks.map(link => (
                                           <SheetClose asChild key={link.href}>
                                               <Link
                                                   href={link.href}
                                                   className="text-lg font-semibold text-muted-foreground hover:text-primary transition-colors py-3 border-b border-border/40"
                                               >
                                                   {link.label}
                                               </Link>
                                           </SheetClose>
                                       ))}
                                   </nav>
                               </div>
                               
                               {/* Footer at the bottom of sheet */}
                               <div className="pt-6 border-t border-border/40 text-center">
                                   <p className="text-xs text-muted-foreground">
                                       Powered by{' '}
                                       <Link href="/" className="font-semibold text-primary hover:underline">BroBookMe</Link>
                                   </p>
                               </div>
                           </div>
                       </SheetContent>
                  </Sheet>
                </div>
              )}
          </div>
      </div>
    </header>
  );
}
