
'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { getProviderByUsername, updateProvider } from '@/lib/data';
import { testRazorpayConnection } from '@/lib/actions';
import type { Provider, PaymentGatewaySettings } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, ShieldCheck, AlertCircle, Copy, CheckCircle2, XCircle } from 'lucide-react';
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
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
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

  const handleGatewayToggle = (enabled: boolean) => {
    if (!provider) return;
    const currentGateways = provider.settings.paymentGateways || {
        razorpay: { enabled: false, keyId: '', keySecret: '', webhookSecret: '' },
        stripe: { enabled: false, publicKey: '', secretKey: '' },
        paypal: { enabled: false, clientId: '', clientSecret: '' },
        custom: { enabled: false, paymentLink: '' }
    };
    
    const updatedGateways = {
        ...currentGateways,
        razorpay: { ...currentGateways.razorpay, enabled }
    };
    
    setProvider({ ...provider, settings: { ...provider.settings, paymentGateways: updatedGateways } });
    setTestResult(null);
  };

  const handleInputChange = (field: 'keyId' | 'keySecret' | 'webhookSecret', value: string) => {
    if (!provider) return;
     const currentGateways = provider.settings.paymentGateways || {
        razorpay: { enabled: false, keyId: '', keySecret: '', webhookSecret: '' },
        stripe: { enabled: false, publicKey: '', secretKey: '' },
        paypal: { enabled: false, clientId: '', clientSecret: '' },
        custom: { enabled: false, paymentLink: '' }
    };
    
    const updatedGateways = {
        ...currentGateways,
        razorpay: { ...currentGateways.razorpay, [field]: value }
    };
    
    setProvider({ ...provider, settings: { ...provider.settings, paymentGateways: updatedGateways } });
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    const razorpay = provider?.settings.paymentGateways?.razorpay;
    if (!razorpay?.keyId || !razorpay?.keySecret) {
        toast({ title: "Required", description: "Please enter both Key ID and Key Secret to test.", variant: "destructive" });
        return;
    }

    setTesting(true);
    setTestResult(null);
    try {
        const result = await testRazorpayConnection(razorpay.keyId, razorpay.keySecret);
        if (result.success) {
            setTestResult({ success: true, message: "Connection successful! Your keys are valid." });
            toast({ title: "Success", description: "Razorpay connection verified!" });
        } else {
            setTestResult({ success: false, message: result.error || "Authentication failed." });
            toast({ title: "Connection Failed", description: result.error, variant: "destructive" });
        }
    } catch (error: any) {
        setTestResult({ success: false, message: "An unexpected error occurred." });
    } finally {
        setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!provider) return;
    setSaving(true);
    try {
      await updateProvider(provider.username, { 
        settings: { 
            ...provider.settings, 
            paymentGateways: provider.settings.paymentGateways,
            onlinePaymentEnabled: provider.settings.paymentGateways?.razorpay.enabled || false
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
  
  const getWebhookUrl = () => {
    if (typeof window !== 'undefined') {
        return `${window.location.origin}/api/webhooks/provider-razorpay`;
    }
    return '/api/webhooks/provider-razorpay';
  };
  
  const webhookUrl = getWebhookUrl();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Payment Setup</h1>
        <div className="flex gap-2">
            <Button variant="outline" onClick={handleTestConnection} disabled={testing || !razorpay.enabled}>
                {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                Test Connection
            </Button>
            <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
            </Button>
        </div>
      </div>

      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Secure Connection</AlertTitle>
        <AlertDescription>
          Your payment gateway credentials are used to process bookings directly into your account. Admin credentials are used only for platform subscriptions.
        </AlertDescription>
      </Alert>

      {testResult && (
          <Alert variant={testResult.success ? "default" : "destructive"} className={testResult.success ? "border-green-500 bg-green-50 dark:bg-green-900/10" : ""}>
              {testResult.success ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4" />}
              <AlertTitle>{testResult.success ? "Valid Credentials" : "Connection Failed"}</AlertTitle>
              <AlertDescription>{testResult.message}</AlertDescription>
          </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <CardTitle>Razorpay Integration</CardTitle>
            </div>
            <Switch 
                id="razorpay-enabled" 
                checked={razorpay.enabled} 
                onCheckedChange={handleGatewayToggle} 
            />
          </div>
          <CardDescription>
            Enable Razorpay to accept online payments from your customers during booking.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="key-id">Razorpay Key ID</Label>
              <Input 
                id="key-id" 
                placeholder="rzp_test_..." 
                value={razorpay.keyId} 
                onChange={(e) => handleInputChange('keyId', e.target.value)}
                disabled={!razorpay.enabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="key-secret">Razorpay Key Secret</Label>
              <Input 
                id="key-secret" 
                type="password" 
                placeholder="••••••••••••••••" 
                value={razorpay.keySecret} 
                onChange={(e) => handleInputChange('keySecret', e.target.value)}
                disabled={!razorpay.enabled}
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Label htmlFor="webhook-secret">Webhook Secret (Optional)</Label>
            <Input 
                id="webhook-secret" 
                type="password"
                placeholder="Your Razorpay Webhook Secret" 
                value={razorpay.webhookSecret || ''} 
                onChange={(e) => handleInputChange('webhookSecret', e.target.value)}
                disabled={!razorpay.enabled}
            />
            <p className="text-xs text-muted-foreground">Required only if you want to use webhooks to automatically confirm payments.</p>
          </div>

          <div className="space-y-2 pt-4 border-t">
              <Label>Webhook URL</Label>
              <div className="flex items-center gap-2">
                  <Input readOnly value={webhookUrl} className="bg-muted" />
                  <Button variant="outline" size="sm" onClick={() => {
                      navigator.clipboard.writeText(webhookUrl);
                      toast({ title: "Copied", description: "Webhook URL copied to clipboard." });
                  }}>
                      <Copy className="h-4 w-4 mr-2" /> Copy
                  </Button>
              </div>
              <p className="text-xs text-muted-foreground">Configure this URL in your Razorpay Dashboard under Settings &gt; Webhooks.</p>
          </div>

          {!razorpay.enabled && (
             <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <span>When disabled, customers will not see the "Online Payment" option.</span>
             </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="border-dashed border-2">
        <CardHeader>
            <CardTitle className="text-muted-foreground text-lg">Other Gateways</CardTitle>
            <CardDescription>Stripe and PayPal integrations are coming soon.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
