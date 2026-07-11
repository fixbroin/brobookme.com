'use client';

import { useEffect, useState, useRef } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from '@/lib/firebase';
import { addFCMToken } from '@/lib/fcm.actions';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';

export function PushNotificationManager({ userId, type }: { userId?: string; type: 'user' | 'guest' }) {
  const [permissionState, setPermissionState] = useState<string>('granted'); // default to granted to prevent flicker
  const registeredRef = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);
    }
  }, []);

  const setupFCM = async () => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      !('Notification' in window)
    ) {
      return;
    }

    if (registeredRef.current) return;
    registeredRef.current = true;

    try {
      // Register FCM Service Worker with dynamic config parameters from env
      const config = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
      };
      const queryString = new URLSearchParams(config).toString();
      const registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?v=6&${queryString}`, {
        scope: '/'
      });
      console.log('FCM Service Worker registered scope:', registration.scope);

      // Retrieve Registration Token
      const messaging = getMessaging(app);
      const token = await getToken(messaging, {
        serviceWorkerRegistration: registration,
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });

      if (token) {
        console.log('FCM Token retrieved successfully.');
        
        // Cache in sessionStorage for guests
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('guest_fcm_token', token);
        }

        // Save to Firestore via Server Action if userId is present
        if (userId) {
          await addFCMToken(userId, token, type);
        }

        // Register foreground listener to display push notifications even if browser tab is open/active
        const unsubscribe = onMessage(messaging, (payload) => {
          console.log('[PushNotificationManager] Foreground message received:', payload);
          if (Notification.permission === 'granted') {
            const notification = payload.notification;
            const title = (notification && notification.title) || 'BroBookMe Alert';
            const options = {
              body: (notification && notification.body) || '',
              icon: (notification && notification.icon) || '/icon-192x192.png',
              badge: '/icon-192x192.png',
              data: payload.data || {}
            };
            
            // Trigger native desktop notification explicitly
            try {
              new Notification(title, options);
            } catch (err) {
              console.error('Failed to display foreground native notification:', err);
            }
          }
        });

        return unsubscribe;
      } else {
        console.warn('FCM token retrieval returned empty.');
      }
    } catch (error) {
      console.error('Error setting up FCM web push notifications:', error);
    }
  };

  useEffect(() => {
    let activeUnsubscribe: (() => void) | undefined = undefined;

    if (permissionState === 'granted') {
      setupFCM().then(unsub => {
        if (unsub) {
          activeUnsubscribe = unsub;
        }
      });
    }

    return () => {
      if (activeUnsubscribe) {
        activeUnsubscribe();
      }
    };
  }, [permissionState, userId, type]);

  const handleRequestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);
    } catch (err) {
      console.error('Failed to request notification permission:', err);
    }
  };

  if (permissionState === 'default') {
    return (
      <div className="fixed bottom-6 right-6 z-[9999] max-w-sm w-[calc(100vw-3rem)] bg-background border rounded-xl shadow-2xl p-4 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-full shrink-0">
            <Bell className="h-5 w-5" />
          </div>
          <div className="flex-grow">
            <h4 className="font-semibold text-sm text-foreground">Enable Booking Alerts</h4>
            <p className="text-xs text-muted-foreground mt-1 leading-normal">
              {type === 'user' 
                ? 'Get instant desktop push notifications when clients book or cancel appointments.'
                : 'Receive native browser alerts for your appointment confirmations and cancellations.'}
            </p>
            <div className="flex gap-2 mt-3 justify-end">
              <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => setPermissionState('dismissed')}>
                Later
              </Button>
              <Button size="sm" className="text-xs h-8 px-4" onClick={handleRequestPermission}>
                Enable
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
