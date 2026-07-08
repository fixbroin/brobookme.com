

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Users, FileText, BarChart2, PieChart as PieChartIcon, CheckCircle, XCircle, Book, DollarSign, Trash2 } from 'lucide-react';
import { getReportsData, hardDeleteBooking } from '@/lib/data';
import type { ReportsData, EnrichedProvider, EnrichedBooking, BookingStatus } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, Pie, PieChart, LineChart, Line, Tooltip } from "recharts"
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";


const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

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


export default function AdminReportsPage() {
    const [data, setData] = useState<ReportsData | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        providerUsername: string;
        bookingId: string;
        isDeletedByProvider: boolean;
    }>({
        open: false,
        providerUsername: '',
        bookingId: '',
        isDeletedByProvider: false
    });
    const [isDeleting, setIsDeleting] = useState(false);

    const confirmDelete = async () => {
        setIsDeleting(true);
        try {
            await hardDeleteBooking(deleteDialog.providerUsername, deleteDialog.bookingId);
            setData(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    bookingStats: {
                        ...prev.bookingStats,
                        total: prev.bookingStats.total - 1,
                        allBookings: prev.bookingStats.allBookings.filter(b => b.id !== deleteDialog.bookingId)
                    }
                }
            });
            toast({ title: "Success", description: "Booking has been permanently deleted." });
            setDeleteDialog(prev => ({ ...prev, open: false }));
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete booking.", variant: "destructive" });
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        getReportsData().then(reportsData => {
            setData(reportsData);
            setLoading(false);
        });
    }, []);
    
    if (loading || !data) {
        return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics & Reports</h1>
            <p className="text-muted-foreground">
                Deep dive into your platform's performance with detailed reports on providers, revenue, and service usage.
            </p>
        </div>
        <Tabs defaultValue="providers">
            <TabsList className="md:grid md:grid-cols-4">
                <TabsTrigger value="providers">Providers</TabsTrigger>
                <TabsTrigger value="service-usage">Service Usage</TabsTrigger>
                <TabsTrigger value="bookings">Bookings</TabsTrigger>
                <TabsTrigger value="revenue">Revenue</TabsTrigger>
            </TabsList>

            {/* Providers Tab */}
            <TabsContent value="providers" className="space-y-6">
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard title="Total Providers" value={data.providerStats.total} icon={Users} />
                    <StatCard title="Paid Subscriptions" value={data.providerStats.paid} icon={Users} />
                    <StatCard title="Trial Users" value={data.providerStats.trial} icon={Users} />
                    <StatCard title="Expired Subscriptions" value={data.providerStats.expired} icon={Users} />
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Top 5 Providers</CardTitle>
                        <CardDescription>Providers with the most bookings.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Provider</TableHead>
                                <TableHead className="text-right">Total Bookings</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.providerStats.topProviders.map((provider: EnrichedProvider) => (
                                    <TableRow key={provider.username}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                <AvatarImage src={provider.logoUrl} alt={provider.name} />
                                                <AvatarFallback>{provider.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium">{provider.name}</div>
                                                    <div className="text-sm text-muted-foreground">{provider.contact.email}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">{provider.totalBookings}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* Service Usage Tab */}
            <TabsContent value="service-usage" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Bookings by Service Type</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <ChartContainer config={{}} className="mx-auto aspect-square max-h-[300px]">
                                <PieChart>
                                <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                                <Pie data={data.serviceUsage.byType} dataKey="value" nameKey="name" />
                                </PieChart>
                            </ChartContainer>
                        </CardContent>
                     </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Bookings by Hour of Day</CardTitle>
                             <CardDescription>Shows the most popular times for bookings across all providers.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={data.serviceUsage.byHourConfig} className="max-h-[300px]">
                                <BarChart data={data.serviceUsage.byHour} accessibilityLayer>
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="hour"
                                        tickLine={false}
                                        tickMargin={10}
                                        axisLine={false}
                                    />
                                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                    <Bar dataKey="Bookings" fill="var(--color-Bookings)" radius={4} />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>
            
            {/* Bookings Tab */}
            <TabsContent value="bookings" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                    <StatCard title="Total Bookings" value={data.bookingStats.total} icon={Book} />
                    <StatCard title="Completed Bookings" value={data.bookingStats.completed} icon={CheckCircle} />
                    <StatCard title="Canceled Bookings" value={data.bookingStats.canceled} icon={XCircle} />
                </div>
                 <Card>
                    <CardHeader>
                        <CardTitle>Booking Details</CardTitle>
                        <CardDescription>A detailed report on all bookings. Filters and export coming soon.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Provider</TableHead>
                                        <TableHead>Service</TableHead>
                                        <TableHead>Date & Time</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                 <TableBody>
                                    {data.bookingStats.allBookings.map((booking: EnrichedBooking) => (
                                        <TableRow key={booking.id} className={booking.deletedByProvider ? "bg-red-50/60 dark:bg-red-950/10 hover:bg-red-100/50 dark:hover:bg-red-950/20" : ""}>
                                            <TableCell>
                                                <div className="font-medium flex items-center gap-2">
                                                    {booking.customerName}
                                                    {booking.deletedByProvider && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Deleted by Provider</Badge>}
                                                </div>
                                                <div className="text-sm text-muted-foreground">{booking.customerEmail}</div>
                                            </TableCell>
                                             <TableCell>
                                                <div className="font-medium">{booking.provider.name}</div>
                                                <div className="text-sm text-muted-foreground">@{booking.provider.username}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={booking.serviceType === 'Online' ? 'default' : 'outline'}>{booking.serviceType}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div>{format(booking.dateTime, 'PPP')}</div>
                                                <div className="text-sm text-muted-foreground">{format(booking.dateTime, 'p')}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                                     onClick={() => setDeleteDialog({ open: true, providerUsername: booking.providerUsername, bookingId: booking.id, isDeletedByProvider: !!booking.deletedByProvider })}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="sr-only">Delete</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="block md:hidden space-y-4">
                            {data.bookingStats.allBookings.length > 0 ? (
                                data.bookingStats.allBookings.map((booking: EnrichedBooking) => (
                                    <div key={booking.id} className={`rounded-xl border bg-card p-4 space-y-3 shadow-sm ${booking.deletedByProvider ? "border-red-200 bg-red-50/30 dark:bg-red-950/5 dark:border-red-950/30" : "border-border"}`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-semibold flex items-center gap-2">
                                                    {booking.customerName}
                                                    {booking.deletedByProvider && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Deleted by Provider</Badge>}
                                                </div>
                                                <div className="text-xs text-muted-foreground">{booking.customerEmail}</div>
                                            </div>
                                            <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 pt-2 border-t text-sm">
                                            <div className="text-muted-foreground">Provider:</div>
                                            <div className="text-right font-medium truncate">{booking.provider.name} (@{booking.provider.username})</div>

                                            <div className="text-muted-foreground">Service Type:</div>
                                            <div className="text-right">
                                                <Badge variant={booking.serviceType === 'Online' ? 'default' : 'outline'}>{booking.serviceType}</Badge>
                                            </div>

                                            <div className="text-muted-foreground">Date & Time:</div>
                                            <div className="text-right font-medium">
                                                {format(booking.dateTime, 'PP')} at {format(booking.dateTime, 'p')}
                                            </div>
                                        </div>
                                        <div className="pt-2 border-t flex justify-end">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 hover:border-red-300 dark:border-red-950/50"
                                                onClick={() => setDeleteDialog({ open: true, providerUsername: booking.providerUsername, bookingId: booking.id, isDeletedByProvider: !!booking.deletedByProvider })}
                                            >
                                                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                                Delete Booking
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center py-4 text-sm text-muted-foreground border rounded-xl bg-card">
                                    No bookings found.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* Revenue Tab */}
            <TabsContent value="revenue" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                     <StatCard title="Total Subscription Revenue" value={`₹${data.revenueStats.total.toLocaleString()}`} icon={DollarSign} />
                     <Card>
                        <CardHeader>
                            <CardTitle>Revenue Trend (Last 30 Days)</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <ChartContainer config={{}} className="h-[200px] w-full">
                                <LineChart
                                    data={data.revenueStats.chartData}
                                    margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
                                >
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                                    <Tooltip content={<ChartTooltipContent hideLabel />} />
                                    <Line dataKey="revenue" type="monotone" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ChartContainer>
                        </CardContent>
                     </Card>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue by Plan</CardTitle>
                        <CardDescription>Performance of each subscription plan.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Plan Name</TableHead>
                                        <TableHead className="text-right">Total Revenue</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.revenueStats.topPlans.map(plan => (
                                        <TableRow key={plan.name}>
                                            <TableCell className="font-medium">{plan.name}</TableCell>
                                            <TableCell className="text-right font-medium">₹{plan.revenue.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="block md:hidden space-y-4">
                            {data.revenueStats.topPlans.length > 0 ? (
                                data.revenueStats.topPlans.map(plan => (
                                    <div key={plan.name} className="rounded-xl border border-border bg-card p-4 flex justify-between items-center shadow-sm text-sm">
                                        <span className="font-semibold">{plan.name}</span>
                                        <span className="font-bold text-primary">₹{plan.revenue.toLocaleString()}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center py-4 text-sm text-muted-foreground border rounded-xl bg-card">
                                    No revenue data found.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>

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

