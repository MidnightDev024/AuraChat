import webpush from 'web-push';

// VAPID keys for web push notifications
// In production, these should be generated once and stored as environment variables
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:support@aurachat.com';

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(
        vapidEmail,
        vapidPublicKey,
        vapidPrivateKey
    );
}

// Function to send push notification
export const sendPushNotification = async (subscription, payload) => {
    if (!vapidPublicKey || !vapidPrivateKey) {
        console.log('VAPID keys not configured, skipping push notification');
        return;
    }
    
    try {
        await webpush.sendNotification(subscription, JSON.stringify(payload));
        console.log('Push notification sent successfully');
    } catch (error) {
        console.error('Error sending push notification:', error.message);
        // If subscription is no longer valid, return the error for handling
        if (error.statusCode === 410) {
            throw new Error('SUBSCRIPTION_EXPIRED');
        }
    }
};

export const getVapidPublicKey = () => vapidPublicKey;

export default webpush;