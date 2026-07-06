

'use client';

import { useEffect, useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Loader2, BookCopy, CalendarClock, UserX, KeyRound, UserCheck, CreditCard, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getAllProviders, getPlans } from '@/lib/data';
import { sendProviderPasswordResetEmail, extendProviderTrial, toggleProviderSuspension, assignProviderSubscription, adminDeleteProvider } from '@/lib/admin.actions';
import type { EnrichedProvider, Plan } from '@/lib/types';
import { format } from 'date-fns';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<EnrichedProvider[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<EnrichedProvider | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const [providersData, plansData] = await Promise.all([
        getAllProviders(),
        getPlans()
      ]);
      setProviders(providersData);
      setPlans(plansData.sort((a, b) => (a.displayOrder ?? 99) - (b.displayOrder ?? 99)));
    } catch (error) {
      console.error("Failed to fetch providers or plans:", error);
      toast({ title: 'Error', description: 'Could not fetch provider list or subscription plans.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleAction = (action: () => Promise<{ success: boolean; error?: string }>, successMessage: string) => {
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        toast({ title: 'Success', description: successMessage });
        fetchProviders(); // Re-fetch to show updated state
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    });
  };

  const getSubscriptionStatus = (provider: EnrichedProvider) => {
      if (provider.isSuspended) {
          return <Badge variant="destructive">Suspended</Badge>
      }
      if (!provider.planId || !provider.planExpiry) {
          return <Badge variant="destructive">No Plan</Badge>
      }
      if (provider.planExpiry > new Date()) {
          const variant = provider.plan?.duration === 'trial' ? 'secondary' : 'default';
          return <Badge variant={variant as any}>{provider.plan?.name || 'Active'}</Badge>
      }
      return <Badge variant="destructive">Expired</Badge>
  }


  return (
     <Card>
        <CardHeader>
            <CardTitle>Manage Providers</CardTitle>
            <CardDescription>View and manage all registered service providers.</CardDescription>
        </CardHeader>
        <CardContent>
           {loading ? (
             <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
           ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Plan Expiry</TableHead>
                  <TableHead>Total Bookings</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.length > 0 ? providers.map(provider => (
                  <TableRow key={provider.username} className={isPending ? 'opacity-50' : ''}>
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
                    <TableCell>
                      {getSubscriptionStatus(provider)}
                    </TableCell>
                     <TableCell>
                        {provider.planExpiry ? format(provider.planExpiry, 'PPP') : 'N/A'}
                    </TableCell>
                    <TableCell>
                        {provider.totalBookings ?? 0}
                    </TableCell>
                    <TableCell>
                      {provider.joinedDate ? format(provider.joinedDate, 'PPP') : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isPending}>
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                             <DropdownMenuItem asChild>
                                <Link href={`/admin/providers/${provider.username}`}>
                                    <BookCopy className="mr-2 h-4 w-4" />
                                    <span>View Bookings</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction(() => sendProviderPasswordResetEmail(provider.contact.email), 'Password reset email sent.')}>
                                <KeyRound className="mr-2 h-4 w-4" />
                                <span>Reset Password</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction(() => extendProviderTrial(provider.username, 7), 'Provider trial has been extended by 7 days.')}>
                                <CalendarClock className="mr-2 h-4 w-4" />
                                <span>Extend Trial (7 days)</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                                 setSelectedProvider(provider);
                                 setSelectedPlanId(provider.planId || '');
                                 setIsAssignOpen(true);
                             }}>
                                 <CreditCard className="mr-2 h-4 w-4" />
                                 <span>Assign Subscription Plan</span>
                             </DropdownMenuItem>
                            <DropdownMenuSeparator />
                             <DropdownMenuItem className={provider.isSuspended ? "text-green-600" : "text-red-500"} onClick={() => handleAction(() => toggleProviderSuspension(provider.username, !!provider.isSuspended), `Provider has been ${provider.isSuspended ? 'reinstated' : 'suspended'}.`)}>
                                 {provider.isSuspended ? <UserCheck className="mr-2 h-4 w-4" /> : <UserX className="mr-2 h-4 w-4" />}
                                 <span>{provider.isSuspended ? 'Un-suspend' : 'Suspend'} Provider</span>
                             </DropdownMenuItem>
                             <DropdownMenuSeparator />
                             <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20" onClick={() => {
                                 setSelectedProvider(provider);
                                 setDeleteConfirmText('');
                                 setIsDeleteOpen(true);
                             }}>
                                 <Trash2 className="mr-2 h-4 w-4" />
                                 <span>Delete Provider</span>
                             </DropdownMenuItem>
                           </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )) : (
                   <TableRow>
                    <TableCell colSpan={6} className="text-center">No providers found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
           )}
        </CardContent>
        <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
           <DialogContent className="sm:max-w-[425px]">
             <DialogHeader>
               <DialogTitle>Assign Subscription Plan</DialogTitle>
               <DialogDescription>
                 Select a subscription plan to assign to <strong>{selectedProvider?.name}</strong>. This will override their current subscription and update their plan expiry date.
               </DialogDescription>
             </DialogHeader>
             <div className="space-y-4 py-4">
               <div className="space-y-2">
                 <Label htmlFor="plan-select">Subscription Plan</Label>
                 <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                   <SelectTrigger id="plan-select">
                     <SelectValue placeholder="Select a plan" />
                   </SelectTrigger>
                   <SelectContent>
                     {plans.map((plan) => (
                       <SelectItem key={plan.id} value={plan.id}>
                         {plan.name} ({plan.duration} - {plan.price > 0 ? `₹${plan.price}` : 'Free'})
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
             </div>
             <DialogFooter>
               <Button variant="outline" onClick={() => setIsAssignOpen(false)}>Cancel</Button>
               <Button onClick={() => {
                 if (selectedProvider && selectedPlanId) {
                   handleAction(
                     () => assignProviderSubscription(selectedProvider.username, selectedPlanId),
                     `Successfully assigned plan to ${selectedProvider.name}.`
                   );
                   setIsAssignOpen(false);
                 }
               }} disabled={isPending || !selectedPlanId}>
                 {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                 Assign Plan
               </Button>
             </DialogFooter>
           </DialogContent>
         </Dialog>
         <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-destructive flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  Delete Provider Account
                </DialogTitle>
                <DialogDescription>
                  This action is permanent and cannot be undone. This will permanently delete the provider account for <strong>{selectedProvider?.name}</strong> and all associated data.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="delete-confirm" className="text-sm font-medium">
                    To confirm, type <span className="font-mono bg-muted px-1.5 py-0.5 rounded select-all font-bold text-destructive">{selectedProvider?.username}</span> below:
                  </Label>
                  <Input
                    id="delete-confirm"
                    placeholder={selectedProvider?.username || "Enter provider username"}
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="border-destructive/30 focus-visible:ring-destructive"
                    autoComplete="off"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    if (selectedProvider && deleteConfirmText === selectedProvider.username) {
                      handleAction(
                        () => adminDeleteProvider(selectedProvider.username),
                        `Successfully deleted provider ${selectedProvider.name}.`
                      );
                      setIsDeleteOpen(false);
                    }
                  }} 
                  disabled={isPending || deleteConfirmText !== selectedProvider?.username}
                >
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Delete Account
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
       </Card>
  );
}