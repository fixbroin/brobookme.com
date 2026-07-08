
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getPlaceholderImage } from "@/lib/placeholder-images";
import type { Provider, ProviderTestimonial, ProviderGalleryItem } from "@/lib/types";
import { Button } from "./ui/button";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Star, Expand, ChevronLeft, ChevronRight, Camera, Plus, Minus, FileText, Calendar, Video, Instagram, Facebook, Twitter, Youtube, Linkedin, Globe, MessageCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { PublicHeader } from "./public-header";
import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import Autoplay from "embla-carousel-autoplay";
import { motion } from "framer-motion";
import { ScrollAnimation } from "./scroll-animation";
import { useToast } from "@/hooks/use-toast";
import { getCurrency } from "@/lib/currencies";
import { formatInTimeZone } from 'date-fns-tz';
import { ProviderFloatingButtons } from './provider-floating-buttons';
import PwaInstallButton from './pwa-install-button';

function getYoutubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

const DotButton: React.FC<{ selected: boolean; onClick: () => void }> = ({ selected, onClick }) => (
    <button
      className={cn(
        "h-3 w-3 rounded-full transition-colors",
        selected ? "bg-primary" : "bg-primary/20"
      )}
      type="button"
      onClick={onClick}
      aria-label="Go to slide"
    />
);

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


export function ProviderBookingPageContent({ provider }: { provider: Provider }) {
  const logo = getPlaceholderImage('brobookme');
  const customPages = provider.settings.customPages;
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const [testimonialApi, setTestimonialApi] = useState<CarouselApi>()
  const [canScrollPrevTestimonial, setCanScrollPrevTestimonial] = useState(false)
  const [canScrollNextTestimonial, setCanScrollNextTestimonial] = useState(false)
  const [testimonialSelectedIndex, setTestimonialSelectedIndex] = useState(0)
  const [testimonialScrollSnaps, setTestimonialScrollSnaps] = useState<number[]>([])

  const [galleryApi, setGalleryApi] = useState<CarouselApi>()
  const [canScrollPrevGallery, setCanScrollPrevGallery] = useState(false)
  const [canScrollNextGallery, setCanScrollNextGallery] = useState(false)
  const [gallerySelectedIndex, setGallerySelectedIndex] = useState(0)
  const [galleryScrollSnaps, setGalleryScrollSnaps] = useState<number[]>([])

  const [blogApi, setBlogApi] = useState<CarouselApi>()
  const [canScrollPrevBlog, setCanScrollPrevBlog] = useState(false)
  const [canScrollNextBlog, setCanScrollNextBlog] = useState(false)
  const [blogSelectedIndex, setBlogSelectedIndex] = useState(0)
  const [blogScrollSnaps, setBlogScrollSnaps] = useState<number[]>([])

  const [videoApi, setVideoApi] = useState<CarouselApi>()
  const [canScrollPrevVideo, setCanScrollPrevVideo] = useState(false)
  const [canScrollNextVideo, setCanScrollNextVideo] = useState(false)
  const [videoSelectedIndex, setVideoSelectedIndex] = useState(0)
  const [videoScrollSnaps, setVideoScrollSnaps] = useState<number[]>([])

  const testimonialAutoplay = useRef(Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true }));
  const galleryAutoplay = useRef(Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true }));
  const blogAutoplay = useRef(Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true }));
  const videoAutoplay = useRef(Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true }));

  const galleryItems = useMemo(() => 
    provider.settings.gallery?.items.filter(item => item.enabled).sort((a, b) => a.displayOrder - b.displayOrder) || [],
    [provider.settings.gallery]
  );

  const blogs = useMemo(() => 
    provider.settings.blogs?.filter(b => b.enabled).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [],
    [provider.settings.blogs]
  );

  const videoItems = useMemo(() => 
    provider.settings.videos?.items.filter(item => item.enabled).sort((a, b) => a.displayOrder - b.displayOrder) || [],
    [provider.settings.videos]
  );
  
  const showNextImage = useCallback(() => {
    if (selectedImageIndex === null || galleryItems.length === 0) return;
    setSelectedImageIndex((prevIndex) => (prevIndex! + 1) % galleryItems.length);
  }, [selectedImageIndex, galleryItems.length]);

  const showPrevImage = useCallback(() => {
    if (selectedImageIndex === null || galleryItems.length === 0) return;
    setSelectedImageIndex((prevIndex) => (prevIndex! - 1 + galleryItems.length) % galleryItems.length);
  }, [selectedImageIndex, galleryItems.length]);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (selectedImageIndex !== null) {
        if (event.key === 'ArrowRight') {
          showNextImage();
        } else if (event.key === 'ArrowLeft') {
          showPrevImage();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIndex, showNextImage, showPrevImage]);

  const onTestimonialDotButtonClick = useCallback(
    (index: number) => {
      if (!testimonialApi) return
      testimonialApi.scrollTo(index)
      testimonialAutoplay.current.reset()
    },
    [testimonialApi]
  )

  const onGalleryDotButtonClick = useCallback(
    (index: number) => {
      if (!galleryApi) return
      galleryApi.scrollTo(index)
      galleryAutoplay.current.reset()
    },
    [galleryApi]
  )

  const onBlogDotButtonClick = useCallback(
    (index: number) => {
      if (!blogApi) return
      blogApi.scrollTo(index)
      blogAutoplay.current.reset()
    },
    [blogApi]
  )

  const onVideoDotButtonClick = useCallback(
    (index: number) => {
      if (!videoApi) return
      videoApi.scrollTo(index)
      videoAutoplay.current.reset()
    },
    [videoApi]
  )

  useEffect(() => {
    if (!testimonialApi) return
    
    const onSelect = () => {
        setTestimonialSelectedIndex(testimonialApi.selectedScrollSnap())
        setCanScrollPrevTestimonial(testimonialApi.canScrollPrev())
        setCanScrollNextTestimonial(testimonialApi.canScrollNext())
    }
    
    setTestimonialScrollSnaps(testimonialApi.scrollSnapList())
    testimonialApi.on("select", onSelect)
    testimonialApi.on("reInit", onSelect)
    
    return () => {
        testimonialApi.off("select", onSelect)
        testimonialApi.off("reInit", onSelect)
    }
  }, [testimonialApi])

  useEffect(() => {
    if (!galleryApi) return

    const onSelect = () => {
        setGallerySelectedIndex(galleryApi.selectedScrollSnap())
        setCanScrollPrevGallery(galleryApi.canScrollPrev())
        setCanScrollNextGallery(galleryApi.canScrollNext())
    }
    
    setGalleryScrollSnaps(galleryApi.scrollSnapList())
    galleryApi.on("select", onSelect)
    galleryApi.on("reInit", onSelect)
    
    return () => {
        galleryApi.off("select", onSelect)
        galleryApi.off("reInit", onSelect)
    }
  }, [galleryApi])

  useEffect(() => {
    if (!blogApi) return

    const onSelect = () => {
        setBlogSelectedIndex(blogApi.selectedScrollSnap())
        setCanScrollPrevBlog(blogApi.canScrollPrev())
        setCanScrollNextBlog(blogApi.canScrollNext())
    }
    
    setBlogScrollSnaps(blogApi.scrollSnapList())
    blogApi.on("select", onSelect)
    blogApi.on("reInit", onSelect)
    
    return () => {
        blogApi.off("select", onSelect)
        blogApi.off("reInit", onSelect)
    }
  }, [blogApi])

  useEffect(() => {
    if (!videoApi) return

    const onSelect = () => {
        setVideoSelectedIndex(videoApi.selectedScrollSnap())
        setCanScrollPrevVideo(videoApi.canScrollPrev())
        setCanScrollNextVideo(videoApi.canScrollNext())
    }
    
    setVideoScrollSnaps(videoApi.scrollSnapList())
    videoApi.on("select", onSelect)
    videoApi.on("reInit", onSelect)
    
    return () => {
        videoApi.off("select", onSelect)
        videoApi.off("reInit", onSelect)
    }
  }, [videoApi])


  const navLinks = [
      { href: `/${provider.username}/about`, label: 'About', enabled: customPages?.about?.enabled },
      { href: `/${provider.username}/contact`, label: 'Contact', enabled: customPages?.contact?.enabled },
      { href: `/${provider.username}/cancellation-policy`, label: 'Cancellation Policy', enabled: customPages?.cancellationPolicy?.enabled },
  ].filter(link => link.enabled);

  const { toast } = useToast();
  const [serviceQuantities, setServiceQuantities] = useState<Record<string, number>>({});
  const currency = useMemo(() => getCurrency(provider.settings.currency), [provider.settings.currency]);
  const services = useMemo(() => provider.settings.services?.filter(s => s.enabled).sort((a, b) => a.displayOrder - b.displayOrder) || [], [provider.settings.services]);

  const handleQuantityChange = (slug: string, delta: number) => {
      const newQty = (serviceQuantities[slug] || 1) + delta;

      if (newQty < 1) return;

      const service = provider.settings.services?.find(s => s.slug === slug || s.id === slug);
      if (service?.maxQuantity && newQty > service.maxQuantity) {
        toast({
            title: 'Maximum Quantity Reached',
            description: `You cannot add more than ${service.maxQuantity} units for this service.`,
            variant: 'destructive',
        });
        return;
      }

      setServiceQuantities(prev => ({ ...prev, [slug]: newQty }));
    };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="min-h-screen bg-muted/40 flex flex-col items-center p-4 md:py-4 md:px-8 relative"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
        <div className="absolute left-1/3 top-0 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl" />
      </div>
      <PublicHeader provider={provider} />

      <div className="container max-w-7xl mx-auto pt-4 md:pt-8 relative z-10">
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes float-slow {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-8px) rotate(2deg); }
          }
          @keyframes float-reverse {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(8px) rotate(-2deg); }
          }
          .animate-float-slow {
            animation: float-slow 7s ease-in-out infinite;
          }
          .animate-float-reverse {
            animation: float-reverse 9s ease-in-out infinite;
          }
        `}} />
        
        <ScrollAnimation>
            <div className="relative mb-12 rounded-[2.5rem] overflow-hidden border border-primary/10 bg-background shadow-[0_20px_50px_rgba(0,0,0,0.04)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.25)]">
                {/* Banner Gradient Background with Organic Curves and Floral Art */}
                <div className="h-44 md:h-60 w-full bg-gradient-to-tr from-[#fbcfe8] via-[#fef3c7] to-[#ccfbf1] dark:from-[#311042] dark:via-[#1e1135] dark:to-[#0f172a] relative overflow-hidden">
                    {/* Glowing Accent Blobs */}
                    <div className="absolute -top-10 -left-10 w-44 h-44 bg-pink-300/30 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute -bottom-20 -right-10 w-64 h-64 bg-teal-200/20 rounded-full blur-3xl" />
                    
                    {/* Wavy lines/Organic curves in background */}
                    <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" viewBox="0 0 1440 320" preserveAspectRatio="none">
                      <path fill="none" stroke="currentColor" strokeWidth="2" d="M0,160 C320,300 480,100 800,240 C1120,380 1280,120 1440,160" />
                      <path fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" d="M0,100 C320,200 640,50 960,180 C1280,310 1380,150 1440,120" />
                    </svg>

                    {/* Flower Line Art - Left (Float Slow) */}
                    <div className="absolute left-6 top-4 w-24 h-24 text-pink-600/35 dark:text-pink-400/25 animate-float-slow pointer-events-none">
                      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
                        {/* Leaf stem */}
                        <path d="M10,80 C30,70 50,40 45,20" />
                        <path d="M45,20 C55,10 65,15 60,25 C55,35 45,30 45,20 Z" fill="currentColor" fillOpacity="0.05" />
                        <path d="M25,60 C35,55 42,58 38,68 C34,78 25,72 25,60 Z" fill="currentColor" fillOpacity="0.05" />
                        <path d="M38,42 C48,37 55,40 51,50 C47,60 38,54 38,42 Z" fill="currentColor" fillOpacity="0.05" />
                      </svg>
                    </div>

                    {/* Flower Line Art - Right (Float Reverse) */}
                    <div className="absolute right-8 top-6 w-28 h-28 text-teal-600/30 dark:text-teal-400/20 animate-float-reverse pointer-events-none">
                      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
                        {/* Flower stem and head */}
                        <path d="M90,90 C70,70 60,40 70,10" />
                        <circle cx="70" cy="10" r="10" stroke="currentColor" />
                        {/* Petals */}
                        <path d="M70,0 C74,-12 66,-12 70,0 Z" fill="currentColor" fillOpacity="0.1" />
                        <path d="M70,20 C74,32 66,32 70,20 Z" fill="currentColor" fillOpacity="0.1" />
                        <path d="M80,10 C92,14 92,6 80,10 Z" fill="currentColor" fillOpacity="0.1" />
                        <path d="M60,10 C48,14 48,6 60,10 Z" fill="currentColor" fillOpacity="0.1" />
                      </svg>
                    </div>

                    {/* Wavy Curve Bottom Divider */}
                    <svg className="absolute bottom-0 left-0 w-full h-12 text-[#fefaf6] dark:text-[#18122b] fill-current pointer-events-none" viewBox="0 0 1440 120" preserveAspectRatio="none">
                        <path d="M0,64 C288,128 576,0 864,64 C1152,128 1296,64 1440,32 L1440,120 L0,120 Z" />
                    </svg>
                </div>
                {/* Content Area with Squirclish Profile Border */}
                <div className="px-3 pb-7 pt-3 flex flex-col items-center text-center relative z-20 w-full bg-gradient-to-b from-[#fefaf6] via-background to-background dark:from-[#18122b] dark:via-background dark:to-background border-t border-primary/5">
                    <div className="h-32 w-32 md:h-40 md:w-40 border-[6px] border-background shadow-2xl bg-background rounded-[2rem] md:rounded-[2.5rem] overflow-hidden flex items-center justify-center -mt-20 md:-mt-28 relative z-30">
                        <Image 
                            src={provider.logoUrl || logo.imageUrl} 
                            alt={provider.name} 
                            width={160}
                            height={160}
                            className="aspect-square h-full w-full object-cover rounded-[1.5rem] md:rounded-[2rem]"
                            onContextMenu={(e) => e.preventDefault()} 
                            draggable={false} 
                            priority
                        />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-6 text-foreground">{provider.name}</h1>
                    <p className="mt-4 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed font-medium bg-background/60 dark:bg-background/20 backdrop-blur-sm px-1 py-1 rounded-[1.5rem] border border-primary/5 shadow-sm">
                        {provider.description}
                    </p>
                </div>
            </div>
        </ScrollAnimation>
          
        {provider.settings.enableServicesPage ? (
            <section className="w-full max-w-7xl mx-auto pt-5">
                <ScrollAnimation>
                    <h2 className="text-3xl font-extrabold tracking-tight text-center mb-2 bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent">Our Services</h2>
                    <div className="flex justify-center mb-12">
                        <svg className="w-24 h-3 text-primary/30" viewBox="0 0 100 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0,5 C30,10 70,0 100,5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                    </div>
                </ScrollAnimation>
                <ScrollAnimation delay={0.1}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {services.map(s => {
                             const slug = s.slug || s.id;
                             const quantity = serviceQuantities[slug] || 1;
                             const unitPrice = s.offerPrice ?? s.price;
                             const totalPrice = unitPrice * quantity;

                             return (
                                <Card key={s.id} className="flex flex-col h-full group overflow-hidden rounded-[2rem] border border-primary/10 bg-background shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300 ease-out">
                                    <div className="p-4 flex flex-col flex-1">
                                        <Link href={`/${provider.username}/services/${s.slug || s.id}`} className="aspect-square w-full relative mb-4 overflow-hidden rounded-[1.5rem]">
                                            <Image
                                                src={s.imageUrl}
                                                alt={s.title}
                                                fill
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                                className="object-cover transition-transform duration-300 group-hover:scale-110"
                                                onContextMenu={(e) => e.preventDefault()}
                                                draggable={false}
                                            />
                                        </Link>
                                        <Link href={`/${provider.username}/services/${s.slug || s.id}`}>
                                            <h4 className="font-bold hover:text-primary transition-colors text-lg">{s.title}</h4>
                                        </Link>
                                        <p className="text-sm text-muted-foreground mt-1 flex-1 line-clamp-2">{s.description}</p>
                                        <div className="text-lg font-extrabold mt-2">
                                            {s.offerPrice != null && s.offerPrice < s.price ? (
                                                <span>
                                                    <span className="line-through text-muted-foreground text-sm">{currency?.symbol}{s.quantityEnabled && quantity > 1 ? s.price * quantity : s.price}</span>
                                                    {' '}{currency?.symbol}{totalPrice}
                                                </span>
                                            ) : (
                                                s.price > 0
                                                    ? <span>{currency?.symbol}{totalPrice}</span>
                                                    : <span className="text-green-600">Free</span>
                                            )}
                                        </div>
                                        <div className="mt-4 flex flex-col gap-2">
                                            {s.quantityEnabled && (
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(slug, -1)}><Minus/></Button>
                                                    <span className="font-bold text-lg w-10 text-center">{quantity}</span>
                                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(slug, 1)}><Plus/></Button>
                                                </div>
                                            )}
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button asChild variant="outline" className="w-full rounded-full">
                                                    <Link href={`/${provider.username}/services/${s.slug || s.id}`}>
                                                        Details
                                                    </Link>
                                                </Button>
                                                <Button asChild className="w-full rounded-full">
                                                    <Link href={`/${provider.username}/book?serviceSlug=${s.slug || s.id}${s.quantityEnabled ? '&quantity=' + quantity : ''}`}>
                                                        Book Now
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                             )

                        })}
                    </div>
                </ScrollAnimation>
            </section>
        ) : (
             <ScrollAnimation delay={0.1}>
                <div className="w-full">
                    <Card>
                        <CardContent className="p-6 text-center">
                            <h2 className="text-2xl font-semibold mb-4">Ready to book?</h2>
                            <p className="text-muted-foreground mb-6">Click the button below to start scheduling your appointment.</p>
                            <Button asChild size="lg">
                                <Link href={`/${provider.username}/book`}>
                                    Book an Appointment
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </ScrollAnimation>
        )}
      </div>

       {provider.settings?.testimonials?.enabled && provider.settings.testimonials.items.filter(t => t.enabled).length > 0 && (
        <section className="w-full max-w-7xl mx-auto pt-10 relative">
            {/* Visual Curved Spacer */}
            <div className="absolute top-0 left-0 w-full overflow-hidden text-background pointer-events-none opacity-20 -translate-y-8">
                <svg className="w-full h-8 text-primary fill-current" viewBox="0 0 1440 120" preserveAspectRatio="none">
                    <path d="M0,64 C288,128 576,0 864,64 C1152,128 1296,64 1440,32 L1440,120 L0,120 Z" />
                </svg>
            </div>
            
            <ScrollAnimation>
                <h2 className="text-3xl font-extrabold tracking-tight text-center mb-2 bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent flex items-center justify-center gap-2">⭐ What Our Customers Say</h2>
                <div className="flex justify-center mb-12">
                    <svg className="w-24 h-3 text-primary/30" viewBox="0 0 100 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0,5 C30,10 70,0 100,5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                </div>
            </ScrollAnimation>
            <ScrollAnimation delay={0.1}>
                <Carousel 
                    setApi={setTestimonialApi} 
                    opts={{ align: "start", loop: true }}
                    plugins={[testimonialAutoplay.current]}
                    className="w-full"
                >
                    <CarouselContent>
                        {provider.settings.testimonials.items.filter(t => t.enabled).sort((a,b) => a.displayOrder - b.displayOrder).map(testimonial => (
                        <CarouselItem key={testimonial.id} className="md:basis-1/2 lg:basis-1/3">
                            <div className="h-full p-1">
                                <Card className="h-full flex flex-col rounded-[2rem] border border-primary/10 bg-background shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300 ease-out">
                                    <CardHeader className="flex-row gap-4 items-center">
                                        <Avatar className="w-14 h-14 rounded-[1rem] overflow-hidden border">
                                            <AvatarImage src={testimonial.imageUrl} alt={testimonial.name} loading="lazy" onContextMenu={(e) => e.preventDefault()} draggable={false} />
                                            <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h4 className="font-bold">{testimonial.name}</h4>
                                            <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        <div className="flex items-center gap-0.5 mb-2">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`h-4 w-4 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`} />
                                            ))}
                                        </div>
                                        <p className="text-muted-foreground text-sm font-medium">"{testimonial.description}"</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </CarouselItem>
                        ))}
                    </CarouselContent>
                    {canScrollPrevTestimonial && <CarouselPrevious className="absolute -left-12 top-1/2 -translate-y-1/2 z-10 bg-primary text-primary-foreground hidden md:flex" />}
                    {canScrollNextTestimonial && <CarouselNext className="absolute -right-12 top-1/2 -translate-y-1/2 z-10 bg-primary text-primary-foreground hidden md:flex" />}
                </Carousel>
                <div className="flex justify-center gap-2 mt-4">
                    {testimonialScrollSnaps.map((_, index) => (
                        <DotButton
                        key={index}
                        selected={index === testimonialSelectedIndex}
                        onClick={() => onTestimonialDotButtonClick(index)}
                        />
                    ))}
                </div>
            </ScrollAnimation>
        </section>
        )}

        {galleryItems.length > 0 && provider.settings?.gallery?.enabled && (
        <section className="w-full max-w-7xl mx-auto pt-10 relative">
            {/* Visual Curved Spacer */}
            <div className="absolute top-0 left-0 w-full overflow-hidden text-background pointer-events-none opacity-20 -translate-y-8">
                <svg className="w-full h-8 text-primary fill-current" viewBox="0 0 1440 120" preserveAspectRatio="none">
                    <path d="M0,32 C240,85 480,85 720,32 C960,-21 1200,-21 1440,32 L1440,120 L0,120 Z" />
                </svg>
            </div>
            
            <ScrollAnimation>
                <h2 className="text-3xl font-extrabold tracking-tight text-center mb-2 bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent flex items-center justify-center gap-3">
                    <Camera className="h-8 w-8 text-primary" />
                    {provider.settings.gallery?.title || 'Our Work Gallery'}
                </h2>
                <div className="flex justify-center mb-12">
                    <svg className="w-24 h-3 text-primary/30" viewBox="0 0 100 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0,5 C30,10 70,0 100,5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                </div>
            </ScrollAnimation>
            <ScrollAnimation delay={0.1}>
                <Carousel 
                    setApi={setGalleryApi} 
                    opts={{ align: "start", loop: true }}
                    plugins={[galleryAutoplay.current]}
                    className="w-full"
                >
                    <CarouselContent>
                        {galleryItems.map((item, index) => (
                            <CarouselItem key={item.id} className="md:basis-1/2 lg:basis-1/3">
                                <Card
                                    className="overflow-hidden cursor-pointer group rounded-[2rem] border border-primary/10 bg-background shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300 ease-out"
                                    onClick={() => setSelectedImageIndex(index)}
                                >
                                    <CardContent className="p-0">
                                        <div className="aspect-video relative rounded-t-[2rem] overflow-hidden">
                                            <Image src={item.imageUrl} alt={item.title || 'Gallery image'} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover transition-transform duration-300 group-hover:scale-105" onContextMenu={(e) => e.preventDefault()} draggable={false} />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                                <Expand className="h-10 w-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </div>
                                        {(item.title || item.caption) && (
                                            <div className="p-5">
                                                {item.title && <h4 className="font-bold text-lg mb-1">{item.title}</h4>}
                                                {item.caption && <p className="text-sm text-muted-foreground font-medium">{item.caption}</p>}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    {canScrollPrevGallery && <CarouselPrevious className="absolute -left-12 top-1/2 -translate-y-1/2 z-10 bg-primary text-primary-foreground hidden md:flex" />}
                    {canScrollNextGallery && <CarouselNext className="absolute -right-12 top-1/2 -translate-y-1/2 z-10 bg-primary text-primary-foreground hidden md:flex" />}
                </Carousel>
                <div className="flex justify-center gap-2 mt-4">
                    {galleryScrollSnaps.map((_, index) => (
                        <DotButton
                        key={index}
                        selected={index === gallerySelectedIndex}
                        onClick={() => onGalleryDotButtonClick(index)}
                        />
                    ))}
                </div>
            </ScrollAnimation>
        </section>
        )}

        {blogs.length > 0 && (provider.settings.enableBlogsPage ?? true) && (
        <section className="w-full max-w-7xl mx-auto pt-10 relative">
            {/* Visual Curved Spacer */}
            <div className="absolute top-0 left-0 w-full overflow-hidden text-background pointer-events-none opacity-20 -translate-y-8">
                <svg className="w-full h-8 text-primary fill-current" viewBox="0 0 1440 120" preserveAspectRatio="none">
                    <path d="M0,64 C288,0 576,128 864,64 C1152,0 1296,64 1440,32 L1440,120 L0,120 Z" />
                </svg>
            </div>
            
            <ScrollAnimation>
                <h2 className="text-3xl font-extrabold tracking-tight text-center mb-2 bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent flex items-center justify-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    Latest Blog Posts
                </h2>
                <div className="flex justify-center mb-12">
                    <svg className="w-24 h-3 text-primary/30" viewBox="0 0 100 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0,5 C30,10 70,0 100,5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                </div>
            </ScrollAnimation>
            <ScrollAnimation delay={0.1}>
                <Carousel 
                    setApi={setBlogApi} 
                    opts={{ align: "start", loop: true }}
                    plugins={[blogAutoplay.current]}
                    className="w-full"
                >
                    <CarouselContent>
                        {blogs.map(blog => (
                            <CarouselItem key={blog.id} className="md:basis-1/2 lg:basis-1/3">
                                <div className="h-full p-1">
                                    <Card className="flex flex-col h-full overflow-hidden group border border-primary/10 bg-background shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300 ease-out rounded-[2rem]">
                                        {blog.imageUrl ? (
                                            <Link href={`/${provider.username}/blog/${blog.slug || blog.id}`} className="relative aspect-video w-full overflow-hidden block rounded-t-[2rem]">
                                                <Image
                                                    src={blog.imageUrl}
                                                    alt={blog.title}
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                />
                                            </Link>
                                        ) : (
                                            <Link href={`/${provider.username}/blog/${blog.slug || blog.id}`} className="aspect-video w-full bg-muted flex items-center justify-center text-muted-foreground block rounded-t-[2rem]">
                                                <FileText className="h-12 w-12" />
                                            </Link>
                                        )}
                                        <CardHeader className="flex-1 pb-2">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                                <Calendar className="h-3.5 w-3.5" />
                                                <span>{formatInTimeZone(new Date(blog.createdAt), provider.settings.timezone || 'UTC', provider.settings.dateFormat || 'dd/MM/yyyy')}</span>
                                            </div>
                                            <Link href={`/${provider.username}/blog/${blog.slug || blog.id}`}>
                                                <CardTitle className="line-clamp-2 hover:text-primary transition-colors text-lg font-bold">
                                                    {blog.title}
                                                </CardTitle>
                                            </Link>
                                            <p className="text-sm text-muted-foreground line-clamp-3 mt-2 font-medium">
                                                {blog.description}
                                            </p>
                                        </CardHeader>
                                        {blog.tags && blog.tags.length > 0 && (
                                            <div className="px-6 pb-4 flex flex-wrap gap-1">
                                                {blog.tags.slice(0, 3).map((tag, idx) => (
                                                    <Badge key={idx} variant="secondary" className="text-[10px] rounded-full">
                                                        #{tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                        <CardFooter className="border-t pt-4 px-6 pb-4 bg-muted/10 flex justify-between items-center">
                                            <Link href={`/${provider.username}/blog/${blog.slug || blog.id}`} className="text-sm font-semibold text-primary hover:underline flex items-center gap-1 group/btn">
                                                Read Post
                                                <ChevronRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                            </Link>
                                        </CardFooter>
                                    </Card>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    {canScrollPrevBlog && <CarouselPrevious className="absolute -left-12 top-1/2 -translate-y-1/2 z-10 bg-primary text-primary-foreground hidden md:flex" />}
                    {canScrollNextBlog && <CarouselNext className="absolute -right-12 top-1/2 -translate-y-1/2 z-10 bg-primary text-primary-foreground hidden md:flex" />}
                </Carousel>
                <div className="flex justify-center gap-2 mt-4">
                    {blogScrollSnaps.map((_, index) => (
                        <DotButton
                        key={index}
                        selected={index === blogSelectedIndex}
                        onClick={() => onBlogDotButtonClick(index)}
                        />
                    ))}
                </div>
            </ScrollAnimation>
        </section>
        )}

        {videoItems.length > 0 && provider.settings.videos?.enabled && (
        <section className="w-full max-w-7xl mx-auto pt-10 relative">
            {/* Visual Curved Spacer */}
            <div className="absolute top-0 left-0 w-full overflow-hidden text-background pointer-events-none opacity-20 -translate-y-8">
                <svg className="w-full h-8 text-primary fill-current" viewBox="0 0 1440 120" preserveAspectRatio="none">
                    <path d="M0,32 C240,-21 480,-21 720,32 C960,85 1200,85 1440,32 L1440,120 L0,120 Z" />
                </svg>
            </div>
            
            <ScrollAnimation>
                <h2 className="text-3xl font-extrabold tracking-tight text-center mb-2 bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent flex items-center justify-center gap-3">
                    <Video className="h-8 w-8 text-primary" />
                    {provider.settings.videos?.title || 'Review Videos'}
                </h2>
                <div className="flex justify-center mb-12">
                    <svg className="w-24 h-3 text-primary/30" viewBox="0 0 100 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0,5 C30,10 70,0 100,5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                </div>
            </ScrollAnimation>
            <ScrollAnimation delay={0.1}>
                <Carousel 
                    setApi={setVideoApi} 
                    opts={{ align: "start", loop: true }}
                    plugins={[videoAutoplay.current]}
                    className="w-full"
                >
                    <CarouselContent>
                        {videoItems.map(item => {
                            const ytId = item.type === 'youtube' ? getYoutubeId(item.videoUrl) : null;
                            const embedUrl = ytId ? `https://www.youtube.com/embed/${ytId}` : null;
                            return (
                                <CarouselItem key={item.id} className="md:basis-1/2 lg:basis-1/3">
                                    <div className="h-full p-1">
                                        <Card className="flex flex-col h-full overflow-hidden group border border-primary/10 bg-background shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300 ease-out rounded-[2rem]">
                                            <div className="aspect-video relative bg-muted/35 flex items-center justify-center rounded-t-[2rem] overflow-hidden">
                                                {item.type === 'youtube' && embedUrl ? (
                                                    <iframe
                                                        src={embedUrl}
                                                        className="w-full h-full rounded-t-lg border-0"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                        title={item.title}
                                                    />
                                                ) : (
                                                    <video
                                                        src={item.videoUrl}
                                                        className="w-full h-full object-cover rounded-t-lg"
                                                        controls
                                                        playsInline
                                                    />
                                                )}
                                            </div>
                                            <CardHeader className="p-5 flex-1">
                                                <CardTitle className="text-lg font-bold line-clamp-2">{item.title}</CardTitle>
                                            </CardHeader>
                                        </Card>
                                    </div>
                                </CarouselItem>
                            );
                        })}
                    </CarouselContent>
                    {canScrollPrevVideo && <CarouselPrevious className="absolute -left-12 top-1/2 -translate-y-1/2 z-10 bg-primary text-primary-foreground hidden md:flex" />}
                    {canScrollNextVideo && <CarouselNext className="absolute -right-12 top-1/2 -translate-y-1/2 z-10 bg-primary text-primary-foreground hidden md:flex" />}
                </Carousel>
                <div className="flex justify-center gap-2 mt-4">
                    {videoScrollSnaps.map((_, index) => (
                        <DotButton
                        key={index}
                        selected={index === videoSelectedIndex}
                        onClick={() => onVideoDotButtonClick(index)}
                        />
                    ))}
                </div>
            </ScrollAnimation>
        </section>
        )}

      <ScrollAnimation>
        <footer className="mt-16 border-t border-border/60">
          {/* Social links + branding row */}
          <div className="py-10 flex flex-col items-center gap-6">
            {/* Provider name & copyright */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground text-base">{provider.name}</span>
              <span className="hidden sm:inline">&bull;</span>
              <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
            </div>

            {/* Social icons */}
            {provider.settings.socialLinks && Object.values(provider.settings.socialLinks).some(v => !!v) && (
              <div className="flex items-center gap-3 flex-wrap justify-center">
                {provider.settings.socialLinks.instagram && (
                  <Link href={provider.settings.socialLinks.instagram} target="_blank" rel="noopener noreferrer"
                    className="h-10 w-10 flex items-center justify-center rounded-full bg-muted hover:bg-pink-100 hover:text-pink-600 dark:hover:bg-pink-900/30 dark:hover:text-pink-400 transition-colors"
                    aria-label="Instagram">
                    <Instagram className="h-5 w-5" />
                  </Link>
                )}
                {provider.settings.socialLinks.facebook && (
                  <Link href={provider.settings.socialLinks.facebook} target="_blank" rel="noopener noreferrer"
                    className="h-10 w-10 flex items-center justify-center rounded-full bg-muted hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors"
                    aria-label="Facebook">
                    <Facebook className="h-5 w-5" />
                  </Link>
                )}
                {provider.settings.socialLinks.twitter && (
                  <Link href={provider.settings.socialLinks.twitter} target="_blank" rel="noopener noreferrer"
                    className="h-10 w-10 flex items-center justify-center rounded-full bg-muted hover:bg-sky-100 hover:text-sky-600 dark:hover:bg-sky-900/30 dark:hover:text-sky-400 transition-colors"
                    aria-label="Twitter / X">
                    <Twitter className="h-5 w-5" />
                  </Link>
                )}
                {provider.settings.socialLinks.youtube && (
                  <Link href={provider.settings.socialLinks.youtube} target="_blank" rel="noopener noreferrer"
                    className="h-10 w-10 flex items-center justify-center rounded-full bg-muted hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                    aria-label="YouTube">
                    <Youtube className="h-5 w-5" />
                  </Link>
                )}
                {provider.settings.socialLinks.linkedin && (
                  <Link href={provider.settings.socialLinks.linkedin} target="_blank" rel="noopener noreferrer"
                    className="h-10 w-10 flex items-center justify-center rounded-full bg-muted hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/30 dark:hover:text-blue-300 transition-colors"
                    aria-label="LinkedIn">
                    <Linkedin className="h-5 w-5" />
                  </Link>
                )}
                {provider.settings.socialLinks.whatsapp && (
                  <Link href={provider.settings.socialLinks.whatsapp} target="_blank" rel="noopener noreferrer"
                    className="h-10 w-10 flex items-center justify-center rounded-full bg-muted hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/30 dark:hover:text-green-400 transition-colors"
                    aria-label="WhatsApp">
                    <WhatsAppIcon className="h-5 w-5" />
                  </Link>
                )}
                {provider.settings.socialLinks.website && (
                  <Link href={provider.settings.socialLinks.website} target="_blank" rel="noopener noreferrer"
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
      </ScrollAnimation>
      
      <Dialog open={selectedImageIndex !== null} onOpenChange={(isOpen) => !isOpen && setSelectedImageIndex(null)}>
        <DialogContent className="p-2 m-0 w-full max-w-6xl h-auto bg-transparent border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0">
          <DialogTitle className="sr-only">Full screen gallery view</DialogTitle>
          <DialogDescription className="sr-only">Detailed view of the gallery image.</DialogDescription>
          {selectedImageIndex !== null && (
            <div className="relative w-full h-auto max-h-[90vh]">
              <Image
                src={galleryItems[selectedImageIndex].imageUrl}
                alt={galleryItems[selectedImageIndex].title || "Full screen gallery view"}
                width={1920}
                height={1080}
                sizes="100vw"
                className="w-full h-full object-contain rounded-lg"
                onContextMenu={(e) => e.preventDefault()}
                draggable={false}
              />
               <Button
                variant="secondary"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 opacity-70 hover:opacity-100"
                onClick={(e) => { e.stopPropagation(); showPrevImage(); }}
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 opacity-70 hover:opacity-100"
                onClick={(e) => { e.stopPropagation(); showNextImage(); }}
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <ProviderFloatingButtons settings={provider.settings.floatingButtons} />
      <PwaInstallButton appName={provider.name} appDesc={`Book an appointment with ${provider.name}`} appIcon={provider.logoUrl} />
    </motion.div>
  );
}
