

'use client';

import { getBookingsByProvider, getProviderByUsername, hardDeleteBooking } from "@/lib/data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";
import type { Booking, BookingStatus, Provider } from "@/lib/types";
import { formatInTimeZone } from "date-fns-tz";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { notFound, useRouter, useParams } from "next/navigation";
import Link from "next/link";

type EnrichedBooking = Booking & { status: BookingStatus };

export default function AdminProviderBookingsPage() {
  const params = useParams();
  const username = params.username as string;
  
  const [bookings, setBookings] = useState<EnrichedBooking[]>([]);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();


  useEffect(() => {
    if (!username) return;

    async function fetchData() {
        setLoading(true);
        try {
            const providerData = await getProviderByUsername(username);
            if (!providerData) {
            toast({ title: 'Error', description: 'Could not find provider data.', variant: 'destructive' });
            notFound();
            return;
            }
            const bookingsData = await getBookingsByProvider(username);
            
            setProvider(providerData);

            const enrichedBookings = bookingsData.map(b => {
                let status: BookingStatus = b.status || 'Upcoming';
                if (!b.status && b.dateTime < new Date()) {
                    status = 'Completed';
                }
                return { ...b, status };
            }) as EnrichedBooking[];

            setBookings(enrichedBookings);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to fetch bookings.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }
    fetchData();
  }, [username, toast, router]);


  const [deleteDialog, setDeleteDialog] = useState<{
      open: boolean;
      bookingId: string;
      isDeletedByProvider: boolean;
  }>({
      open: false,
      bookingId: '',
      isDeletedByProvider: false
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
        await hardDeleteBooking(username, deleteDialog.bookingId);
        setBookings(prev => prev.filter(b => b.id !== deleteDialog.bookingId));
        toast({ title: "Success", description: "Booking has been permanently deleted." });
        setDeleteDialog(prev => ({ ...prev, open: false }));
    } catch (error) {
        toast({ title: "Error", description: "Failed to delete booking.", variant: "destructive" });
    } finally {
        setIsDeleting(false);
    }
  };


  if (loading) {
      return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }
  
  if (!provider) {
    return null; // Should be handled by notFound
  }

  const dateFormat = provider?.settings?.dateFormat || 'PPP';
  const timezone = provider?.settings?.timezone || 'UTC';

  const upcomingBookings = bookings.filter(b => b.status === 'Upcoming');
  const pastBookings = bookings.filter(b => b.status === 'Completed' || b.status === 'Canceled');

  const getStatusVariant = (status: BookingStatus) => {
    switch (status) {
        case 'Upcoming':
            return 'default';
        case 'Completed':
            return 'secondary';
        case 'Canceled':
            return 'destructive';
        default:
            return 'outline';
    }
  }

  const BookingTable = ({ bookings }: { bookings: EnrichedBooking[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer</TableHead>
          <TableHead>Service</TableHead>
          <TableHead>Date & Time</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.length > 0 ? (
          bookings.map((booking) => (
            <TableRow key={booking.id} className={booking.deletedByProvider ? "bg-red-50/60 dark:bg-red-950/10 hover:bg-red-100/50 dark:hover:bg-red-950/20" : ""}>
              <TableCell>
                <div className="font-medium flex items-center gap-2">
                    {booking.customerName}
                    {booking.deletedByProvider && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Deleted by Provider</Badge>}
                </div>
                <div className="text-sm text-muted-foreground">{booking.customerEmail}</div>
              </TableCell>
              <TableCell>
                <Badge variant={booking.serviceType === 'Online' ? 'default' : 'outline'}>{booking.serviceType}</Badge>
                {booking.address && <div className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate">{booking.address}</div>}
              </TableCell>
              <TableCell>
                <div>{formatInTimeZone(booking.dateTime, timezone, dateFormat)}</div>
                <div className="text-sm text-muted-foreground">{formatInTimeZone(booking.dateTime, timezone, 'p')}</div>
              </TableCell>
              <TableCell>
                  <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
              </TableCell>
              <TableCell className="text-right">
                  <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                      onClick={() => setDeleteDialog({ open: true, bookingId: booking.id, isDeletedByProvider: !!booking.deletedByProvider })}
                  >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                  </Button>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={5} className="text-center">No bookings found.</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
                <Link href="/admin/providers">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
            </Button>
            <div>
                <h1 className="text-2xl font-bold">Bookings for {provider.name}</h1>
                <p className="text-muted-foreground">A complete history of all appointments.</p>
            </div>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Bookings</CardTitle>
          <CardDescription>
            Appointments that are scheduled for the future.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BookingTable bookings={upcomingBookings} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Past Bookings</CardTitle>
          <CardDescription>
            A record of completed and canceled appointments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BookingTable bookings={pastBookings} />
        </CardContent>
      </Card>

      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
          <DialogContent className="max-w-md mx-auto rounded-xl p-6">
              <DialogHeader className="space-y-3">
                  <DialogTitle className="text-xl font-bold flex items-center gap-2 text-destructive">
                      <Trash2 className="h-5 w-5" />
                      {deleteDialog.isDeletedByProvider ? "Permanently Delete Booking" : "Force Delete Active Booking"}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground pt-1">
                      {deleteDialog.isDeletedByProvider 
                        ? "This booking was soft-deleted by the provider. Permanently deleting it will remove it from the database forever. This action cannot be undone."
                        : "Warning: This booking is currently active. Force deleting it will remove it from the database forever and erase it from all reports. This action cannot be undone."
                      }
                  </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t mt-4 justify-end">
                  <Button variant="outline" onClick={() => setDeleteDialog(prev => ({ ...prev, open: false }))}>
                      Cancel
                  </Button>
                  <Button 
                      variant="destructive" 
                      onClick={confirmDelete}
                      disabled={isDeleting}
                  >
                      {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {deleteDialog.isDeletedByProvider ? "Permanently Delete" : "Force Delete"}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
