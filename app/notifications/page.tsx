import Link from 'next/link';
import NotificationsDashboard from '@/components/NotificationsDashboard';

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/" className="text-green-600 hover:text-green-800">
              ← Back to Home
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Notifications System</h1>
          </div>
          <p className="text-lg text-gray-600">
            Advanced notification system with push notifications, smart reminders, and automated processing
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-3xl mb-3">🔔</div>
            <h3 className="font-semibold text-gray-900 mb-2">Smart Notifications</h3>
            <p className="text-sm text-gray-600">
              Priority levels, snooze, and delivery tracking
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-3xl mb-3">⏰</div>
            <h3 className="font-semibold text-gray-900 mb-2">Flexible Reminders</h3>
            <p className="text-sm text-gray-600">
              Custom reminders with recurring patterns
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-3xl mb-3">📱</div>
            <h3 className="font-semibold text-gray-900 mb-2">Push Notifications</h3>
            <p className="text-sm text-gray-600">
              Cross-platform FCM integration
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="font-semibold text-gray-900 mb-2">Automated Processing</h3>
            <p className="text-sm text-gray-600">
              Cron-based Edge Functions
            </p>
          </div>
        </div>

        {/* Main Dashboard */}
        <NotificationsDashboard />

        {/* Technical Details */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Technical Implementation</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🗄️ Database Schema</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• <strong>notifications:</strong> Core notification management with scheduling</li>
                <li>• <strong>push_tokens:</strong> Device token management for push delivery</li>
                <li>• <strong>notification_types:</strong> Configurable notification templates</li>
                <li>• <strong>notification_logs:</strong> Delivery tracking and analytics</li>
                <li>• <strong>notification_preferences:</strong> User preference management</li>
                <li>• <strong>notification_interactions:</strong> User engagement tracking</li>
                <li>• <strong>notification_batches:</strong> Bulk operation management</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 API Endpoints</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• <strong>GET /api/notifications:</strong> List and filter notifications</li>
                <li>• <strong>POST /api/notifications:</strong> Create new notifications</li>
                <li>• <strong>PUT /api/notifications:</strong> Update notification settings</li>
                <li>• <strong>DELETE /api/notifications:</strong> Cancel or delete notifications</li>
                <li>• <strong>POST /api/notifications/push-tokens:</strong> Register push tokens</li>
                <li>• <strong>GET /api/notifications?action=stats:</strong> Analytics data</li>
                <li>• <strong>POST /api/notifications?action=snooze:</strong> Snooze notifications</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📱 Push Notification Features</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• <strong>Firebase Integration:</strong> FCM for reliable delivery</li>
                <li>• <strong>Cross-Platform:</strong> Web, Android, and iOS support</li>
                <li>• <strong>Rich Content:</strong> Images, actions, and interactive notifications</li>
                <li>• <strong>Service Worker:</strong> Background notification handling</li>
                <li>• <strong>Token Management:</strong> Automatic refresh and validation</li>
                <li>• <strong>Offline Support:</strong> Delivery when app is closed</li>
                <li>• <strong>Priority Handling:</strong> Urgent vs normal notification delivery</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Automation Features</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• <strong>Cron Jobs:</strong> Supabase Edge Functions for scheduling</li>
                <li>• <strong>Auto Reminders:</strong> Task, habit, and prayer reminders</li>
                <li>• <strong>Smart Scheduling:</strong> Respect quiet hours and preferences</li>
                <li>• <strong>Retry Logic:</strong> Failed notification retry with backoff</li>
                <li>• <strong>Cleanup Tasks:</strong> Automatic old data cleanup</li>
                <li>• <strong>Health Monitoring:</strong> System health and error reporting</li>
                <li>• <strong>Batch Processing:</strong> Efficient bulk notification handling</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Database Functions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Database Functions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Management</h3>
              <div className="space-y-3 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-purple-600">create_notification(user_uuid, type, title, body, ...)</code>
                  <p className="text-gray-600 mt-1">Create new notification with scheduling</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-purple-600">get_pending_notifications(batch_size)</code>
                  <p className="text-gray-600 mt-1">Get notifications ready for processing</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-purple-600">snooze_notification(uuid, minutes)</code>
                  <p className="text-gray-600 mt-1">Snooze notification with validation</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-purple-600">mark_notification_sent(uuid, method, ...)</code>
                  <p className="text-gray-600 mt-1">Mark notification as delivered</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Push Token & Analytics</h3>
              <div className="space-y-3 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-purple-600">register_push_token(user_uuid, device_id, ...)</code>
                  <p className="text-gray-600 mt-1">Register device for push notifications</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-purple-600">get_user_push_tokens(user_uuid, platform)</code>
                  <p className="text-gray-600 mt-1">Get user's registered devices</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-purple-600">get_notification_stats(user_uuid, days)</code>
                  <p className="text-gray-600 mt-1">Get notification analytics and stats</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-purple-600">cleanup_old_notifications(days_to_keep)</code>
                  <p className="text-gray-600 mt-1">Clean up old notification data</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edge Functions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Supabase Edge Functions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">process-notifications</h3>
              <div className="space-y-3 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-green-600">POST /functions/v1/process-notifications</code>
                  <p className="text-gray-600 mt-1">Process pending notifications for delivery</p>
                </div>
                <ul className="text-gray-600 space-y-1 ml-4">
                  <li>• Fetch pending notifications from database</li>
                  <li>• Send push notifications via FCM</li>
                  <li>• Send email notifications via service</li>
                  <li>• Send SMS notifications via service</li>
                  <li>• Log delivery attempts and results</li>
                  <li>• Create next occurrence for repeating notifications</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">notification-cron</h3>
              <div className="space-y-3 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-blue-600">POST /functions/v1/notification-cron</code>
                  <p className="text-gray-600 mt-1">Automated cron job for notification management</p>
                </div>
                <ul className="text-gray-600 space-y-1 ml-4">
                  <li>• Call process-notifications function</li>
                  <li>• Create automatic task due reminders</li>
                  <li>• Create daily habit check-in reminders</li>
                  <li>• Create prayer time reminders</li>
                  <li>• Create bill due reminders</li>
                  <li>• Create medication reminders</li>
                  <li>• Clean up old notifications and logs</li>
                  <li>• Update notification statistics</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Types */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-green-900 mb-4">Supported Notification Types</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-green-900 mb-2">📋 Task Notifications</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Task due reminders</li>
                <li>• Overdue task alerts</li>
                <li>• Task completion confirmations</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-green-900 mb-2">🔄 Habit Reminders</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Daily habit check-ins</li>
                <li>• Streak milestone celebrations</li>
                <li>• Missed habit notifications</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-green-900 mb-2">🕌 Faith Notifications</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Prayer time reminders</li>
                <li>• Azkar and dhikr alerts</li>
                <li>• Quran reading reminders</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-green-900 mb-2">💰 Finance Alerts</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Bill due reminders</li>
                <li>• Budget limit alerts</li>
                <li>• Expense tracking reminders</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-green-900 mb-2">🏥 Health Reminders</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Medication reminders</li>
                <li>• Appointment alerts</li>
                <li>• Health check-in prompts</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-green-900 mb-2">⚙️ System Notifications</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Welcome messages</li>
                <li>• Update notifications</li>
                <li>• Backup reminders</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Setup Instructions</h2>
          <div className="space-y-4 text-blue-800">
            <div>
              <h4 className="font-semibold">1. Database Setup</h4>
              <p className="text-sm">Run notification migrations to create tables, functions, and RLS policies</p>
            </div>
            <div>
              <h4 className="font-semibold">2. Firebase Configuration</h4>
              <p className="text-sm">Set up Firebase project, enable FCM, and configure service account credentials</p>
            </div>
            <div>
              <h4 className="font-semibold">3. Environment Variables</h4>
              <p className="text-sm">Configure Firebase credentials, VAPID keys, and service URLs</p>
            </div>
            <div>
              <h4 className="font-semibold">4. Edge Functions Deployment</h4>
              <p className="text-sm">Deploy process-notifications and notification-cron Edge Functions</p>
            </div>
            <div>
              <h4 className="font-semibold">5. Cron Job Setup</h4>
              <p className="text-sm">Configure cron schedule to call notification-cron function regularly</p>
            </div>
            <div>
              <h4 className="font-semibold">6. Service Worker</h4>
              <p className="text-sm">Configure service worker for push notification handling in web browsers</p>
            </div>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-3">🔒 Privacy & Security</h4>
          <div className="text-sm text-gray-700 space-y-2">
            <p><strong>Data Protection:</strong> All notification data encrypted with row-level security policies</p>
            <p><strong>Token Security:</strong> Push tokens encrypted and can be revoked anytime by users</p>
            <p><strong>User Control:</strong> Complete control over notification preferences and delivery methods</p>
            <p><strong>Audit Logging:</strong> All notification interactions logged for transparency and debugging</p>
            <p><strong>GDPR Compliance:</strong> Full data portability and deletion capabilities included</p>
            <p><strong>Rate Limiting:</strong> API rate limiting to prevent abuse and ensure fair usage</p>
          </div>
        </div>
      </div>
    </div>
  );
}
