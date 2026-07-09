
'use client';

import { useState, useEffect, useTransition } from 'react';
import { getPlans, createPlan, updatePlan, deletePlan } from '@/lib/data';
import type { Plan } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, PlusCircle, MoreHorizontal, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const emptyPlan: Partial<Omit<Plan, 'id' | 'createdAt'>> = {
  name: '',
  price: 0,
  offerPrice: undefined,
  duration: 'monthly',
  features: [],
  status: 'active',
  days: 7,
  isFeatured: false,
  displayOrder: 0,
  hidden: false,
};

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Partial<Plan> | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const plansData = await getPlans();
      // Sort by displayOrder
      const sortedPlans = plansData.sort((a,b) => (a.displayOrder ?? 99) - (b.displayOrder ?? 99));
      setPlans(sortedPlans);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch plans.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (plan: Partial<Plan> | null = null) => {
    setCurrentPlan(plan ? { ...plan } : { ...emptyPlan });
    setIsFormOpen(true);
  };

  const handleOpenDeleteAlert = (plan: Plan) => {
    setCurrentPlan(plan);
    setIsDeleteAlertOpen(true);
  };

  const handleSavePlan = () => {
    if (!currentPlan) return;
    
    // Create a mutable copy for the update/create operation.
    const data: Partial<Omit<Plan, 'id' | 'createdAt'>> = {
      name: currentPlan.name,
      price: Number(currentPlan.price || 0),
      duration: currentPlan.duration,
      features: (currentPlan.features || []).map(f => f.trim()).filter(f => f !== ''),
      status: currentPlan.status,
      isFeatured: currentPlan.isFeatured || false,
      displayOrder: Number(currentPlan.displayOrder || 0),
      hidden: currentPlan.hidden || false,
    };

    // Handle optional offerPrice
    const offerPriceValue = currentPlan.offerPrice;
    if (offerPriceValue !== null && offerPriceValue !== undefined && String(offerPriceValue) !== '' && !isNaN(Number(offerPriceValue))) {
        data.offerPrice = Number(offerPriceValue);
    } else {
        data.offerPrice = null;
    }

    // Handle optional days for trial
    if (currentPlan.duration === 'trial') {
        data.days = Number(currentPlan.days || 7);
    } else {
        data.days = null;
    }


    startTransition(async () => {
      try {
        if (currentPlan.id) {
          // Update existing plan
          await updatePlan(currentPlan.id, data);
          toast({ title: 'Success', description: 'Plan updated successfully.' });
        } else {
          // Create new plan
          await createPlan(data as Omit<Plan, 'id' | 'createdAt'>);
          toast({ title: 'Success', description: 'Plan created successfully.' });
        }
        setIsFormOpen(false);
        setCurrentPlan(null);
        await fetchPlans(); // Re-fetch and sort plans
      } catch (error: any) {
        console.error('Error saving plan:', error);
        toast({ title: 'Error', description: error.message || 'Failed to save plan.', variant: 'destructive' });
      }
    });
  };


  const handleDeletePlan = () => {
    if (!currentPlan?.id) return;
    startTransition(async () => {
      try {
        await deletePlan(currentPlan.id!);
        toast({ title: 'Success', description: 'Plan deleted successfully.' });
        setIsDeleteAlertOpen(false);
        setCurrentPlan(null);
        fetchPlans();
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to delete plan.', variant: 'destructive' });
      }
    });
  };

  const handleToggleStatus = async (plan: Plan) => {
    try {
      const newStatus = plan.status === 'active' ? 'inactive' : 'active';
      // Optimistic state update
      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, status: newStatus } : p));
      await updatePlan(plan.id, { status: newStatus });
      toast({ title: 'Plan Updated', description: `Plan "${plan.name}" is now ${newStatus}.` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update plan status.', variant: 'destructive' });
      // Revert state
      const plansData = await getPlans();
      plansData.sort((a, b) => (a.displayOrder ?? 99) - (b.displayOrder ?? 99));
      setPlans(plansData);
    }
  };

  const handleToggleHidden = async (plan: Plan) => {
    try {
      const newHidden = !plan.hidden;
      // Optimistic state update
      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, hidden: newHidden } : p));
      await updatePlan(plan.id, { hidden: newHidden });
      toast({ title: 'Plan Updated', description: `Plan "${plan.name}" is now ${newHidden ? 'hidden' : 'visible'}.` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update plan visibility.', variant: 'destructive' });
      // Revert state
      const plansData = await getPlans();
      plansData.sort((a, b) => (a.displayOrder ?? 99) - (b.displayOrder ?? 99));
      setPlans(plansData);
    }
  };

  const handleFormChange = (field: keyof Plan, value: any) => {
    if (!currentPlan) return;
    if (field === 'features') {
        setCurrentPlan({ ...currentPlan, [field]: value.split('\n') });
    } else {
        setCurrentPlan({ ...currentPlan, [field]: value });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between items-start">
        <div>
          <CardTitle>Manage Subscription Plans</CardTitle>
          <CardDescription>Create, edit, and manage subscription plans for providers.</CardDescription>
        </div>
        <Button onClick={() => handleOpenForm()} className="w-full sm:w-auto justify-center">
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Plan
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Plan Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead className="text-center">Hidden</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.length > 0 ? (
                    plans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell>{plan.displayOrder}</TableCell>
                        <TableCell className="font-medium flex items-center gap-2">
                          {plan.name}
                          {plan.isFeatured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                          {plan.hidden && <Badge variant="outline" className="border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-[10px]">Hidden</Badge>}
                        </TableCell>
                        <TableCell>
                          {plan.offerPrice && plan.offerPrice < plan.price ? (
                            <div className="flex items-center gap-2">
                               <span className="line-through text-muted-foreground">₹{plan.price}</span>
                               <span>₹{plan.offerPrice}</span>
                            </div>
                          ) : `₹${plan.price}` }
                        </TableCell>
                        <TableCell className="capitalize">{plan.duration}{plan.duration === 'trial' && ` (${plan.days} days)`}</TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={plan.hidden || false}
                            onCheckedChange={() => handleToggleHidden(plan)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Switch
                              checked={plan.status === 'active'}
                              onCheckedChange={() => handleToggleStatus(plan)}
                            />
                            <span className="capitalize text-xs font-medium text-muted-foreground w-12 text-left">
                              {plan.status}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleOpenForm(plan)}>
                              Edit
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleOpenDeleteAlert(plan)}>
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">No plans found. Create one to get started.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="block md:hidden space-y-4">
              {plans.length > 0 ? (
                plans.map((plan) => (
                  <div key={plan.id} className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs text-muted-foreground">Order: {plan.displayOrder}</div>
                        <div className="font-semibold text-lg flex items-center gap-2 mt-0.5">
                          {plan.name}
                          {plan.isFeatured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                          {plan.hidden && <Badge variant="outline" className="border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-[10px]">Hidden</Badge>}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t text-sm">
                      <div className="text-muted-foreground">Price:</div>
                      <div className="text-right font-medium">
                        {plan.offerPrice && plan.offerPrice < plan.price ? (
                          <span className="flex items-center justify-end gap-1.5">
                             <span className="line-through text-xs text-muted-foreground">₹{plan.price}</span>
                             <span>₹{plan.offerPrice}</span>
                          </span>
                        ) : `₹${plan.price}` }
                      </div>

                      <div className="text-muted-foreground">Duration:</div>
                      <div className="text-right font-medium capitalize">
                        {plan.duration}{plan.duration === 'trial' && ` (${plan.days} days)`}
                      </div>

                      <div className="text-muted-foreground flex items-center">Hidden:</div>
                      <div className="flex justify-end items-center">
                        <Switch
                          checked={plan.hidden || false}
                          onCheckedChange={() => handleToggleHidden(plan)}
                        />
                      </div>

                      <div className="text-muted-foreground flex items-center">Status:</div>
                      <div className="flex justify-end items-center gap-2">
                        <span className="capitalize text-xs text-muted-foreground">
                          {plan.status}
                        </span>
                        <Switch
                          checked={plan.status === 'active'}
                          onCheckedChange={() => handleToggleStatus(plan)}
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenForm(plan)}>
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleOpenDeleteAlert(plan)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-4 text-sm text-muted-foreground border rounded-xl bg-card">
                  No plans found. Create one to get started.
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>

      {/* Plan Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{currentPlan?.id ? 'Edit' : 'Create'} Plan</DialogTitle>
            <DialogDescription>
              Fill in the details for the subscription plan.
            </DialogDescription>
          </DialogHeader>
          {currentPlan && (
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={currentPlan.name} onChange={e => handleFormChange('name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Original Price (₹)</Label>
                <Input id="price" type="number" value={currentPlan.price} onChange={e => handleFormChange('price', Number(e.target.value))} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="offerPrice">Offer Price (₹)</Label>
                <Input id="offerPrice" type="number" value={currentPlan.offerPrice ?? ''} onChange={e => handleFormChange('offerPrice', e.target.value)} placeholder="Optional discounted price" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Select value={currentPlan.duration} onValueChange={(value: Plan['duration']) => handleFormChange('duration', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="lifetime">Lifetime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {currentPlan.duration === 'trial' && (
                <div className="space-y-2">
                  <Label htmlFor="days">Trial Days</Label>
                  <Input id="days" type="number" value={currentPlan.days || 7} onChange={e => handleFormChange('days', Number(e.target.value))} />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="features">Features</Label>
                <Textarea id="features" value={Array.isArray(currentPlan.features) ? currentPlan.features.join('\n') : ''} onChange={e => handleFormChange('features', e.target.value)} className="min-h-[120px] resize-y" placeholder="One feature per line" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input id="displayOrder" type="number" value={currentPlan.displayOrder ?? 0} onChange={e => handleFormChange('displayOrder', Number(e.target.value))} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/20">
                <div className="space-y-0.5">
                  <Label htmlFor="status">Plan Status</Label>
                  <p className="text-xs text-muted-foreground">Toggle to set the plan active or inactive.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                      id="status"
                      checked={currentPlan.status === 'active'}
                      onCheckedChange={checked => handleFormChange('status', checked ? 'active' : 'inactive')}
                  />
                  <span className="capitalize text-sm font-medium">{currentPlan.status}</span>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/20">
                <div className="space-y-0.5">
                  <Label htmlFor="isFeatured">Highlight Plan</Label>
                  <p className="text-xs text-muted-foreground">Show as "Best Value" to stand out.</p>
                </div>
                <Switch
                    id="isFeatured"
                    checked={currentPlan.isFeatured}
                    onCheckedChange={checked => handleFormChange('isFeatured', checked)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/20">
                <div className="space-y-0.5">
                  <Label htmlFor="hidden">Hide Plan</Label>
                  <p className="text-xs text-muted-foreground">Hide from public landing and provider subscription pages.</p>
                </div>
                <Switch
                    id="hidden"
                    checked={currentPlan.hidden || false}
                    onCheckedChange={checked => handleFormChange('hidden', checked)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePlan} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the plan "{currentPlan?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePlan} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </Card>
  );
}
