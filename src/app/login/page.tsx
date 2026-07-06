
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { auth } from '@/lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { createProvider, getProviderByEmail } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';


const GoogleIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

export default function LoginPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [emailAuthLoading, setEmailAuthLoading] = useState(false);
  const [googleAuthLoading, setGoogleAuthLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is logged in, redirect to dashboard
        router.replace('/dashboard');
      } else {
        // User is not logged in, show the login page
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailAuthLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      await createProvider(name, email);
      // New user, redirect to subscription
      router.push('/subscription');
    } catch (err: any) {
      setError(err.message);
      setEmailAuthLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailAuthLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Existing user, onAuthStateChanged will redirect
    } catch (err: any)      {
      setError(err.message);
      setEmailAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleAuthLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const { user } = result;

      if (!user.email) {
          throw new Error("Google sign-in failed: no email found.");
      }

      // Check if the user is new before creating a provider record
      const providerData = await getProviderByEmail(user.email);

      if (providerData) {
        // Existing user, onAuthStateChanged will redirect
        router.replace('/dashboard');
      } else {
        // New user
        if (user.displayName && user.email) {
            await createProvider(user.displayName, user.email);
        }
        router.replace('/subscription');
      }
    } catch (err: any) {
      setError(err.message);
      setGoogleAuthLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address.',
        variant: 'destructive',
      });
      return;
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast({
        title: 'Password Reset Email Sent',
        description: 'Please check your inbox for instructions to reset your password.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send password reset email.',
        variant: 'destructive',
      });
    } finally {
      setResetLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Tabs defaultValue="login" className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <Card>
            <form onSubmit={handleEmailSignIn}>
              <CardHeader className="text-center">
                <CardTitle>Welcome Back!</CardTitle>
                <CardDescription>Sign in to access your dashboard.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                </div>
                <div className="space-y-2">
                   <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                     <Dialog>
                       <DialogTrigger asChild>
                          <Button variant="link" type="button" className="p-0 h-auto text-xs">Forgot password?</Button>
                       </DialogTrigger>
                       <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Reset Password</DialogTitle>
                            <DialogDescription>
                              Enter your email address and we'll send you a link to reset your password.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-2">
                            <Label htmlFor="reset-email">Email</Label>
                            <Input
                              id="reset-email"
                              type="email"
                              placeholder="you@example.com"
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                              autoComplete="email"
                            />
                          </div>
                          <DialogFooter>
                             <DialogClose asChild>
                               <Button type="button" variant="secondary">
                                 Cancel
                               </Button>
                            </DialogClose>
                            <Button type="button" onClick={handlePasswordReset} disabled={resetLoading}>
                               {resetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                               Send Reset Link
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                    </Dialog>
                  </div>
                  <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" disabled={emailAuthLoading || googleAuthLoading} className="w-full">
                  {emailAuthLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Login
                </Button>
              </CardContent>
            </form>
            <CardFooter className="flex flex-col gap-4">
                <div className="relative w-full">
                    <Separator />
                    <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-card px-2 text-xs text-muted-foreground">OR</span>
                </div>
                <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={emailAuthLoading || googleAuthLoading}>
                    {googleAuthLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <GoogleIcon className="mr-2 h-4 w-4 shrink-0" />
                    Sign in with Google
                </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card>
            <form onSubmit={handleEmailSignUp}>
              <CardHeader className="text-center">
                <CardTitle>Create an Account</CardTitle>
                <CardDescription>Get started with BroBookMe today.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Business Name</Label>
                  <Input id="signup-name" type="text" placeholder="Your Company Name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" disabled={emailAuthLoading || googleAuthLoading} className="w-full">
                  {emailAuthLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </CardContent>
            </form>
             <CardFooter className="flex flex-col gap-4">
                <div className="relative w-full">
                    <Separator />
                    <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-card px-2 text-xs text-muted-foreground">OR</span>
                </div>
                <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={emailAuthLoading || googleAuthLoading}>
                    {googleAuthLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <GoogleIcon className="mr-2 h-4 w-4 shrink-0" />
                    Sign up with Google
                </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      <div className="mt-6 text-center text-sm text-muted-foreground">
        By signing up, you agree to our{' '}
        <Link href="/terms-of-service" className="underline hover:text-primary">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy-policy" className="underline hover:text-primary">
          Privacy Policy
        </Link>
        .
      </div>
    </div>
  );
}
