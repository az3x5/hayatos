'use client';

import React, { useState, useEffect } from 'react';

interface PushToken {
  device_id: string;
  platform: 'web' | 'android' | 'ios';
  token: string;
  is_active: boolean;
  last_used_at: string;
}

export default function PushNotificationSetup() {
  const [pushTokens, setPushTokens] = useState<PushToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'default' | 'granted' | 'denied'>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    checkPushSupport();
    checkPermissionStatus();
    fetchPushTokens();
  }, []);

  const checkPushSupport = () => {
    if (typeof window !== 'undefined') {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window;
      setIsSupported(supported);
    }
  };

  const checkPermissionStatus = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  };

  const fetchPushTokens = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notifications/push-tokens');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch push tokens');
      }

      setPushTokens(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch push tokens');
      console.error('Error fetching push tokens:', err);
    } finally {
      setLoading(false);
    }
  };

  const requestPermission = async () => {
    if (!isSupported) {
      setError('Push notifications are not supported in this browser');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission === 'granted') {
        setSuccessMessage('Push notification permission granted!');
        setTimeout(() => setSuccessMessage(null), 3000);
        await registerServiceWorker();
      } else {
        setError('Push notification permission denied');
      }
    } catch (err) {
      setError('Failed to request push notification permission');
      console.error('Error requesting permission:', err);
    }
  };

  const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      await subscribeToPush(registration);
    } catch (err) {
      console.error('Error registering service worker:', err);
      throw err;
    }
  };

  const subscribeToPush = async (registration: ServiceWorkerRegistration) => {
    setRegistering(true);

    try {
      // Get existing subscription or create new one
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Create new subscription
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          throw new Error('VAPID public key not configured');
        }

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
        });
      }

      // Register token with backend
      await registerPushToken(subscription);

    } catch (err) {
      setError('Failed to subscribe to push notifications');
      console.error('Error subscribing to push:', err);
    } finally {
      setRegistering(false);
    }
  };

  const registerPushToken = async (subscription: PushSubscription) => {
    try {
      const deviceId = await getDeviceId();
      const platform = getPlatform();
      const token = JSON.stringify(subscription);

      const response = await fetch('/api/notifications/push-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: deviceId,
          platform,
          token,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to register push token');
      }

      setSuccessMessage('Push notifications enabled successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchPushTokens();
    } catch (err) {
      setError('Failed to register push token');
      console.error('Error registering push token:', err);
    }
  };

  const unsubscribeFromPush = async (deviceId: string, platform: string) => {
    if (!confirm('Are you sure you want to disable push notifications for this device?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/notifications/push-tokens?device_id=${deviceId}&platform=${platform}`,
        { method: 'DELETE' }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to unsubscribe');
      }

      setSuccessMessage('Push notifications disabled for this device');
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchPushTokens();

      // Also unsubscribe from service worker if this is the current device
      if (platform === getPlatform()) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            await subscription.unsubscribe();
          }
        }
      }
    } catch (err) {
      setError('Failed to disable push notifications');
      console.error('Error unsubscribing:', err);
    }
  };

  const testPushNotification = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification_type: 'welcome',
          title: 'Test Notification',
          body: 'This is a test push notification from HayatOS!',
          scheduled_at: new Date().toISOString(),
          delivery_methods: ['push'],
          priority: 'normal',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send test notification');
      }

      setSuccessMessage('Test notification sent! Check your device.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to send test notification');
      console.error('Error sending test notification:', err);
    }
  };

  // Utility functions
  const getDeviceId = async (): Promise<string> => {
    // Generate or retrieve device ID
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = 'web_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  };

  const getPlatform = (): 'web' | 'android' | 'ios' => {
    if (typeof window === 'undefined') return 'web';
    
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('android')) return 'android';
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'ios';
    return 'web';
  };

  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'web': return '🌐';
      case 'android': return '🤖';
      case 'ios': return '🍎';
      default: return '📱';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading push notification settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Push Notification Setup</h2>
        <p className="text-gray-600">Configure push notifications for reminders and alerts</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Browser Support Check */}
      {!isSupported && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-yellow-600 mr-2">⚠️</span>
            <div>
              <h4 className="font-medium text-yellow-800">Push Notifications Not Supported</h4>
              <p className="text-sm text-yellow-700">
                Your browser doesn't support push notifications. Please use a modern browser like Chrome, Firefox, or Safari.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Permission Status */}
      {isSupported && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Permission Status</h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                permissionStatus === 'granted' ? 'bg-green-500' :
                permissionStatus === 'denied' ? 'bg-red-500' : 'bg-yellow-500'
              }`}></div>
              <div>
                <div className="font-medium">
                  {permissionStatus === 'granted' && 'Push notifications enabled'}
                  {permissionStatus === 'denied' && 'Push notifications blocked'}
                  {permissionStatus === 'default' && 'Push notifications not configured'}
                </div>
                <div className="text-sm text-gray-600">
                  {permissionStatus === 'granted' && 'You will receive push notifications for reminders and alerts'}
                  {permissionStatus === 'denied' && 'Push notifications are blocked. Enable them in your browser settings.'}
                  {permissionStatus === 'default' && 'Click the button to enable push notifications'}
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              {permissionStatus !== 'granted' && (
                <button
                  onClick={requestPermission}
                  disabled={registering}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {registering ? 'Setting up...' : 'Enable Push Notifications'}
                </button>
              )}

              {permissionStatus === 'granted' && (
                <button
                  onClick={testPushNotification}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Send Test Notification
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Registered Devices */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Registered Devices</h3>
        
        {pushTokens.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📱</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No devices registered</h4>
            <p className="text-gray-600">Enable push notifications to receive reminders on this device</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pushTokens.map((token, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getPlatformIcon(token.platform)}</span>
                  <div>
                    <div className="font-medium capitalize">{token.platform} Device</div>
                    <div className="text-sm text-gray-600">
                      Device ID: {token.device_id}
                    </div>
                    <div className="text-sm text-gray-600">
                      Last used: {formatDate(token.last_used_at)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    token.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {token.is_active ? 'Active' : 'Inactive'}
                  </span>
                  
                  <button
                    onClick={() => unsubscribeFromPush(token.device_id, token.platform)}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Push Notification Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-3">📱 Push Notification Features</h4>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>Cross-Platform:</strong> Works on web browsers, Android, and iOS devices</p>
          <p><strong>Real-time Delivery:</strong> Instant notifications using Firebase Cloud Messaging</p>
          <p><strong>Smart Scheduling:</strong> Respects quiet hours and user preferences</p>
          <p><strong>Rich Content:</strong> Support for images, actions, and interactive notifications</p>
          <p><strong>Offline Support:</strong> Notifications delivered even when app is closed</p>
          <p><strong>Privacy Focused:</strong> Tokens are encrypted and can be revoked anytime</p>
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">🔧 Setup Instructions</h4>
        <div className="text-sm text-gray-700 space-y-2">
          <p><strong>1. Enable Permissions:</strong> Click "Enable Push Notifications" and allow when prompted</p>
          <p><strong>2. Test Delivery:</strong> Use "Send Test Notification" to verify setup</p>
          <p><strong>3. Configure Preferences:</strong> Set notification preferences in Settings</p>
          <p><strong>4. Multiple Devices:</strong> Repeat setup on each device you want to receive notifications</p>
          <p><strong>5. Troubleshooting:</strong> If notifications don't work, check browser settings and permissions</p>
        </div>
      </div>
    </div>
  );
}
