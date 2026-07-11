'use server';

import { adminMessaging, adminDb } from './firebase-admin';

export async function addFCMToken(targetId: string, token: string, type: 'user' | 'guest') {
  if (!adminDb) {
    console.error('Firebase Admin Db not initialized.');
    return;
  }

  try {
    const sanitizedId = targetId.toLowerCase().trim();
    const collectionName = type === 'user' ? 'users' : 'guests';
    const docRef = adminDb.collection(collectionName).doc(sanitizedId).collection('fcm_tokens').doc(token);

    await docRef.set({
      token: token,
      updatedAt: new Date().toISOString(),
    });
    console.log(`FCM token registered successfully for ${type}: ${sanitizedId}`);
  } catch (error) {
    console.error(`Error adding FCM token for ${targetId}:`, error);
  }
}

export async function removeFCMToken(targetId: string, token: string, type: 'user' | 'guest') {
  if (!adminDb) {
    console.error('Firebase Admin Db not initialized.');
    return;
  }

  try {
    const sanitizedId = targetId.toLowerCase().trim();
    const collectionName = type === 'user' ? 'users' : 'guests';
    const docRef = adminDb.collection(collectionName).doc(sanitizedId).collection('fcm_tokens').doc(token);

    await docRef.delete();
    console.log(`FCM token deleted successfully for ${type}: ${sanitizedId}`);
  } catch (error) {
    console.error(`Error deleting FCM token for ${targetId}:`, error);
  }
}

export async function sendFCMNotification(
  targetId: string,
  title: string,
  body: string,
  link?: string,
  type: 'user' | 'guest' = 'user'
) {
  const dbInstance = adminDb;
  if (!adminMessaging || !dbInstance) {
    console.warn('Firebase Admin Messaging or DB not initialized.');
    return;
  }

  try {
    const sanitizedId = targetId.toLowerCase().trim();
    const collectionName = type === 'user' ? 'users' : 'guests';
    
    // 1. Fetch all active registration tokens for the recipient
    const tokensSnap = await dbInstance
      .collection(collectionName)
      .doc(sanitizedId)
      .collection('fcm_tokens')
      .get();

    const tokens = tokensSnap.docs.map(doc => doc.id);

    if (tokens.length === 0) {
      console.log(`No active FCM tokens found for ${type}: ${sanitizedId}`);
      return;
    }

    // 2. Build multi-cast payload
    const clickAction = link || '/';
    const messages = tokens.map(token => ({
      token: token,
      notification: {
        title: title,
        body: body,
      },
      data: {
        click_action: clickAction,
        link: clickAction,
      },
      webpush: {
        notification: {
          title: title,
          body: body,
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          data: {
            click_action: clickAction,
            link: clickAction,
          },
        },
      },
    }));

    // 3. Send via Firebase Cloud Messaging
    const response = await adminMessaging.sendEach(messages);
    console.log(`FCM Send Response: ${response.successCount} succeeded, ${response.failureCount} failed.`);

    // 4. Identify and purge expired/invalid tokens
    const tokensToDelete: string[] = [];
    response.responses.forEach((res, idx) => {
      if (!res.success && res.error) {
        const errorCode = res.error.code;
        if (
          errorCode === 'messaging/registration-token-not-registered' ||
          errorCode === 'messaging/invalid-registration-token'
        ) {
          tokensToDelete.push(tokens[idx]);
        }
      }
    });

    if (tokensToDelete.length > 0) {
      const batch = dbInstance.batch();
      tokensToDelete.forEach(token => {
        const docRef = dbInstance
          .collection(collectionName)
          .doc(sanitizedId)
          .collection('fcm_tokens')
          .doc(token);
        batch.delete(docRef);
      });
      await batch.commit();
      console.log(`Purged ${tokensToDelete.length} expired FCM tokens for ${type}: ${sanitizedId}`);
    }
  } catch (error) {
    console.error(`Error sending FCM push notifications to ${targetId}:`, error);
  }
}
