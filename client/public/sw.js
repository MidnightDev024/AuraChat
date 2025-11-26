// Service Worker for Push Notifications
const NOTIFICATION_ICON = '/logo_icon.svg';

// Handle push events
self.addEventListener('push', (event) => {
    if (!event.data) {
        console.log('Push event with no data');
        return;
    }

    try {
        const data = event.data.json();
        const title = data.title || 'New Message';
        const options = {
            body: data.body || 'You have a new message',
            icon: data.icon || NOTIFICATION_ICON,
            badge: NOTIFICATION_ICON,
            tag: 'aurachat-message',
            data: data.data || {},
            requireInteraction: true,
            vibrate: [200, 100, 200]
        };

        event.waitUntil(
            self.registration.showNotification(title, options)
        );
    } catch (error) {
        console.error('Error handling push event:', error);
    }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    // Open the app when notification is clicked
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If a window is already open, focus it
            for (const client of clientList) {
                if (client.url && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise, open a new window
            if (self.clients.openWindow) {
                return self.clients.openWindow('/');
            }
        })
    );
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});
