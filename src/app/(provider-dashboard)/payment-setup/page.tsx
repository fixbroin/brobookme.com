
'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { getProviderByUsername, updateProvider } from '@/lib/data';
import { testRazorpayConnection, testStripeConnection } from '@/lib/actions';
import type { Provider, PaymentGatewaySettings } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, ShieldCheck, AlertCircle, Copy, CheckCircle2, XCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function PaymentSetupPage() {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && currentUser.email) {
        const username = currentUser.email.split('@')[0];
        try {
          const providerData = await getProviderByUsername(username);
          if (providerData) {
            setProvider(providerData);
          } else {
            router.push('/dashboard');
          }
        } catch (error) {
          toast({ title: "Error", description: "Could not load payment settings.", variant: "destructive" });
        } finally {
          setLoading(false);
        }
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router, toast]);

  const handleGatewayToggle = (gateway: 'razorpay' | 'stripe', enabled: boolean) => {
    if (!provider) return;
    const currentGateways = provider.settings.paymentGateways || {
        razorpay: { enabled: false, keyId: '', keySecret: '', webhookSecret: '' },
        stripe: { enabled: false, publicKey: '', secretKey: '', webhookSecret: '' },
        paypal: { enabled: false, clientId: '', clientSecret: '' },
        custom: { enabled: false, paymentLink: '' }
    };
    
    // Mutual exclusivity: if enabling one, disable others
    const updatedGateways = {
        ...currentGateways,
        razorpay: { ...currentGateways.razorpay, enabled: gateway === 'razorpay' ? enabled : false },
        stripe: { ...currentGateways.stripe, enabled: gateway === 'stripe' ? enabled : false },
        paypal: { ...currentGateways.paypal, enabled: false }, // Explicitly disable others
        custom: { ...currentGateways.custom, enabled: false }
    };
    
    setProvider({ ...provider, settings: { ...provider.settings, paymentGateways: updatedGateways } });
    setTestResults({});
  };

  const handleInputChange = (gateway: 'razorpay' | 'stripe', field: string, value: string) => {
    if (!provider) return;
     const currentGateways = provider.settings.paymentGateways || {
        razorpay: { enabled: false, keyId: '', keySecret: '', webhookSecret: '' },
        stripe: { enabled: false, publicKey: '', secretKey: '', webhookSecret: '' },
        paypal: { enabled: false, clientId: '', clientSecret: '' },
        custom: { enabled: false, paymentLink: '' }
    };
    
    const updatedGateways = {
        ...currentGateways,
        [gateway]: { ...(currentGateways[gateway] as any), [field]: value }
    };
    
    setProvider({ ...provider, settings: { ...provider.settings, paymentGateways: updatedGateways } });
    setTestResults(prev => {
        const next = { ...prev };
        delete next[gateway];
        return next;
    });
  };

  const handleTestRazorpay = async () => {
    const razorpay = provider?.settings.paymentGateways?.razorpay;
    if (!razorpay?.keyId || !razorpay?.keySecret) {
        toast({ title: "Required", description: "Please enter both Key ID and Key Secret to test.", variant: "destructive" });
        return;
    }

    setTesting('razorpay');
    try {
        const result = await testRazorpayConnection(razorpay.keyId, razorpay.keySecret);
        setTestResults(prev => ({ ...prev, razorpay: { success: result.success, message: result.success ? "Connection successful! Your keys are valid." : result.error || "Authentication failed." } }));
        if (result.success) {
            toast({ title: "Success", description: "Razorpay connection verified!" });
        } else {
            toast({ title: "Connection Failed", description: result.error, variant: "destructive" });
        }
    } catch (error: any) {
        setTestResults(prev => ({ ...prev, razorpay: { success: false, message: "An unexpected error occurred." } }));
    } finally {
        setTesting(null);
    }
  };

  const handleTestStripe = async () => {
    const stripe = provider?.settings.paymentGateways?.stripe;
    if (!stripe?.secretKey) {
        toast({ title: "Required", description: "Please enter your Secret Key to test.", variant: "destructive" });
        return;
    }

    setTesting('stripe');
    try {
        const result = await testStripeConnection(stripe.secretKey);
        setTestResults(prev => ({ ...prev, stripe: { success: result.success, message: result.success ? "Connection successful! Your keys are valid." : result.error || "Authentication failed." } }));
        if (result.success) {
            toast({ title: "Success", description: "Stripe connection verified!" });
        } else {
            toast({ title: "Connection Failed", description: result.error, variant: "destructive" });
        }
    } catch (error: any) {
        setTestResults(prev => ({ ...prev, stripe: { success: false, message: "An unexpected error occurred." } }));
    } finally {
        setTesting(null);
    }
  };

  const handleSave = async () => {
    if (!provider) return;
    setSaving(true);
    try {
      const gateways = provider.settings.paymentGateways;
      const anyEnabled = gateways?.razorpay.enabled || gateways?.stripe.enabled || false;
      
      await updateProvider(provider.username, { 
        settings: { 
            ...provider.settings, 
            paymentGateways: provider.settings.paymentGateways,
            onlinePaymentEnabled: anyEnabled
        } 
      });
      toast({ title: "Success", description: "Payment settings saved successfully." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save payment settings.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !provider) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const razorpay = provider.settings.paymentGateways?.razorpay || { enabled: false, keyId: '', keySecret: '', webhookSecret: '' };
  const stripe = provider.settings.paymentGateways?.stripe || { enabled: false, publicKey: '', secretKey: '', webhookSecret: '' };
  
  const getWebhookUrl = (gateway: string) => {
    if (typeof window !== 'undefined') {
        return `${window.location.origin}/api/webhooks/provider-${gateway}`;
    }
    return `/api/webhooks/provider-${gateway}`;
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Payment Setup</h1>
        <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
        </Button>
      </div>

      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Secure & Independent</AlertTitle>
        <AlertDescription>
          Payments go directly to your account. Only one gateway can be enabled at a time.
        </AlertDescription>
      </Alert>

      {/* Razorpay Card */}
      <Card className={razorpay.enabled ? "border-primary ring-1 ring-primary" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <CardTitle>Razorpay Integration</CardTitle>
            </div>
            <Switch 
                id="razorpay-enabled" 
                checked={razorpay.enabled} 
                onCheckedChange={(checked) => handleGatewayToggle('razorpay', checked)} 
            />
          </div>
          <CardDescription>
            Popular in India. Supports UPI, Cards, Netbanking.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {testResults.razorpay && (
              <Alert variant={testResults.razorpay.success ? "default" : "destructive"} className={testResults.razorpay.success ? "border-green-500 bg-green-50 dark:bg-green-900/10" : ""}>
                  {testResults.razorpay.success ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4" />}
                  <AlertTitle>{testResults.razorpay.success ? "Valid Credentials" : "Connection Failed"}</AlertTitle>
                  <AlertDescription>{testResults.razorpay.message}</AlertDescription>
              </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rzp-key-id">Key ID</Label>
              <Input 
                id="rzp-key-id" 
                placeholder="rzp_test_..." 
                value={razorpay.keyId} 
                onChange={(e) => handleInputChange('razorpay', 'keyId', e.target.value)}
                disabled={!razorpay.enabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rzp-key-secret">Key Secret</Label>
              <Input 
                id="rzp-key-secret" 
                type="password" 
                placeholder="••••••••••••••••" 
                value={razorpay.keySecret} 
                onChange={(e) => handleInputChange('razorpay', 'keySecret', e.target.value)}
                disabled={!razorpay.enabled}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rzp-webhook-secret">Webhook Secret (Optional)</Label>
            <Input 
                id="rzp-webhook-secret" 
                type="password"
                placeholder="Your Razorpay Webhook Secret" 
                value={razorpay.webhookSecret || ''} 
                onChange={(e) => handleInputChange('razorpay', 'webhookSecret', e.target.value)}
                disabled={!razorpay.enabled}
            />
          </div>

          {razorpay.enabled && (
              <div className="space-y-2 pt-2 border-t">
                  <Label>Webhook URL</Label>
                  <div className="flex items-center gap-2">
                      <Input readOnly value={getWebhookUrl('razorpay')} className="bg-muted" />
                      <Button variant="outline" size="sm" onClick={() => {
                          navigator.clipboard.writeText(getWebhookUrl('razorpay'));
                          toast({ title: "Copied", description: "Webhook URL copied." });
                      }}>Copy</Button>
                  </div>
              </div>
          )}
          
          <Button variant="outline" size="sm" onClick={handleTestRazorpay} disabled={testing === 'razorpay' || !razorpay.enabled}>
              {testing === 'razorpay' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test Razorpay Connection
          </Button>
        </CardContent>
      </Card>

      {/* Stripe Card */}
      <Card className={stripe.enabled ? "border-primary ring-1 ring-primary" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              <CardTitle>Stripe Integration</CardTitle>
            </div>
            <Switch 
                id="stripe-enabled" 
                checked={stripe.enabled} 
                onCheckedChange={(checked) => handleGatewayToggle('stripe', checked)} 
            />
          </div>
          <CardDescription>
            Global standard. Supports Apple Pay, Google Pay, and Cards.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {testResults.stripe && (
              <Alert variant={testResults.stripe.success ? "default" : "destructive"} className={testResults.stripe.success ? "border-green-500 bg-green-50 dark:bg-green-900/10" : ""}>
                  {testResults.stripe.success ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4" />}
                  <AlertTitle>{testResults.stripe.success ? "Valid Credentials" : "Connection Failed"}</AlertTitle>
                  <AlertDescription>{testResults.stripe.message}</AlertDescription>
              </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="stripe-pub-key">Publishable Key</Label>
              <Input 
                id="stripe-pub-key" 
                placeholder="pk_test_..." 
                value={stripe.publicKey} 
                onChange={(e) => handleInputChange('stripe', 'publicKey', e.target.value)}
                disabled={!stripe.enabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stripe-secret-key">Secret Key</Label>
              <Input 
                id="stripe-secret-key" 
                type="password" 
                placeholder="sk_test_..." 
                value={stripe.secretKey} 
                onChange={(e) => handleInputChange('stripe', 'secretKey', e.target.value)}
                disabled={!stripe.enabled}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stripe-webhook-secret">Webhook Signing Secret</Label>
            <Input 
                id="stripe-webhook-secret" 
                type="password"
                placeholder="whsec_..." 
                value={stripe.webhookSecret || ''} 
                onChange={(e) => handleInputChange('stripe', 'webhookSecret', e.target.value)}
                disabled={!stripe.enabled}
            />
          </div>

          {stripe.enabled && (
              <div className="space-y-2 pt-2 border-t">
                  <Label>Webhook URL</Label>
                  <div className="flex items-center gap-2">
                      <Input readOnly value={getWebhookUrl('stripe')} className="bg-muted" />
                      <Button variant="outline" size="sm" onClick={() => {
                          navigator.clipboard.writeText(getWebhookUrl('stripe'));
                          toast({ title: "Copied", description: "Webhook URL copied." });
                      }}>Copy</Button>
                  </div>
              </div>
          )}

          <Button variant="outline" size="sm" onClick={handleTestStripe} disabled={testing === 'stripe' || !stripe.enabled}>
              {testing === 'stripe' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test Stripe Connection
          </Button>
        </CardContent>
      </Card>
      
      <Card className="border-dashed border-2">
        <CardHeader>
            <CardTitle className="text-muted-foreground text-lg">Other Gateways</CardTitle>
            <CardDescription>PayPal and local payment links are coming soon.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
