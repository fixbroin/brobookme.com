import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

if (getApps().length === 0) {
  try {
    const configStr = process.env.FIREBASE_ADMIN_SDK_CONFIG;
    if (configStr) {
      const config = JSON.parse(configStr);
      initializeApp({
        credential: cert(config),
      });
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
  }
}

export const adminAuth = getApps().length > 0 ? getAuth() : null;
export const adminDb = getApps().length > 0 ? getFirestore() : null;
