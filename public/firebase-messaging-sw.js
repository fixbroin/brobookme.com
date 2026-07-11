importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

// Parse configuration from query parameters
const params = new URLSearchParams(self.location.search);
const firebaseConfig = {
  apiKey: params.get('apiKey'),
  authDomain: params.get('authDomain'),
  projectId: params.get('projectId'),
  storageBucket: params.get('storageBucket'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId')
};

if (firebaseConfig.apiKey) {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
} else {
  console.warn('[firebase-messaging-sw.js] Missing Firebase VAPID credentials in query params.');
}

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  const notification = payload.notification;
  const title = (notification && notification.title) || 'BroBookMe Alert';
  const options = {
    body: (notification && notification.body) || '',
    icon: (notification && notification.icon) || '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: payload.data || {}
  };

  self.registration.showNotification(title, options);
});

// Handle click notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data;
  const clickAction = (data && (data.click_action || data.link)) || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(clickAction) && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(clickAction);
      }
    })
  );
});
