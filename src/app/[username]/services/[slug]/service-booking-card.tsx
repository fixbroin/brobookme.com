'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Clock, Tag, ChevronRight, ShieldCheck, Minus, Plus } from 'lucide-react';
import type { Service } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface ServiceBookingCardProps {
  service: Service;
  username: string;
  currencySymbol: string;
}

export function ServiceBookingCard({ service, username, currencySymbol }: ServiceBookingCardProps) {
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();

  const unitPrice = service.offerPrice != null && service.offerPrice < service.price
    ? service.offerPrice
    : service.price;

  const totalPrice = unitPrice * quantity;
  const originalTotal = service.price * quantity;
  const hasOffer = service.offerPrice != null && service.offerPrice < service.price;
  const isFree = service.price === 0;
  const maxQty = service.maxQuantity ?? 10;

  const decrement = () => setQuantity(q => Math.max(1, q - 1));
  const increment = () => {
    if (quantity >= maxQty) {
      toast({
        title: 'Maximum Quantity Reached',
        description: `You cannot add more than ${maxQty} units for this service.`,
        variant: 'destructive',
      });
      return;
    }
    setQuantity(q => q + 1);
  };

  const bookHref = `/${username}/book?serviceSlug=${service.slug || service.id}${service.quantityEnabled ? `&quantity=${quantity}` : ''}`;

  return (
    <Card className="sticky top-8 shadow-xl border-primary/10">
      <CardHeader>
        <CardTitle>Booking Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {/* Price row */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Tag className="h-5 w-5" />
              <span>Price</span>
            </div>
            <div className="text-xl font-bold">
              {isFree ? (
                <span className="text-green-600 font-bold">Free</span>
              ) : hasOffer ? (
                <div className="flex flex-col items-end">
                  <span className="line-through text-muted-foreground text-sm">
                    {currencySymbol}{originalTotal}
                  </span>
                  <span className="text-primary">
                    {currencySymbol}{totalPrice}
                  </span>
                </div>
              ) : (
                <span>{currencySymbol}{totalPrice}</span>
              )}
            </div>
          </div>

          {/* Duration row */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Clock className="h-5 w-5" />
              <span>Duration</span>
            </div>
            <span className="font-semibold">{service.duration} minutes</span>
          </div>

          {/* Quantity selector — only when provider has enabled it */}
          {service.quantityEnabled && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-muted-foreground font-medium">Quantity</span>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={decrement}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-6 text-center font-semibold text-base select-none">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={increment}
                  aria-label="Increase quantity"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <Button asChild size="lg" className="w-full text-lg h-14 shadow-lg hover:shadow-primary/20 transition-all group">
          <Link href={bookHref}>
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
  );
}
