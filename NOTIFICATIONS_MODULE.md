# Notifications System - Advanced Notification Management

## 🔔 Overview

The Notifications System provides comprehensive notification management with push notifications, smart reminders, snooze functionality, and automated processing. Built with Firebase Cloud Messaging (FCM) for cross-platform delivery and Supabase Edge Functions for cron-based automation.

## ✨ Features Implemented

### 🔔 Smart Notifications
- **Priority Levels**: Low, normal, high, and urgent priority notifications
- **Delivery Methods**: Push notifications, email, and SMS support
- **Status Tracking**: Pending, sent, failed, cancelled, and snoozed states
- **Delivery Logs**: Comprehensive tracking of delivery attempts and results
- **User Interactions**: Track views, clicks, dismissals, and custom actions
- **Batch Operations**: Bulk notification creation and management

### ⏰ Flexible Reminders
- **Custom Scheduling**: One-time or recurring reminders with flexible patterns
- **Repeat Patterns**: Daily, weekly, monthly, yearly, and custom intervals
- **Smart Snoozing**: Snooze up to 3 times with custom intervals
- **Reference Linking**: Link reminders to tasks, habits, prayers, bills, etc.
- **Auto-Creation**: Automatic reminders for tasks, habits, prayers, and bills
- **Template System**: Pre-configured reminder templates for common use cases

### 📱 Push Notifications
- **Cross-Platform**: Web, Android, and iOS support via Firebase Cloud Messaging
- **Rich Content**: Images, actions, and interactive notification support
- **Service Worker**: Background notification handling for web browsers
- **Token Management**: Automatic token registration, refresh, and validation
- **Offline Support**: Notifications delivered even when app is closed
- **Platform Optimization**: Native features for each platform

### 🤖 Automated Processing
- **Cron Jobs**: Supabase Edge Functions for scheduled notification processing
- **Auto Reminders**: Automatic creation for tasks, habits, prayers, and bills
- **Smart Scheduling**: Respect quiet hours and user preferences
- **Retry Logic**: Failed notification retry with exponential backoff
- **Cleanup Tasks**: Automatic cleanup of old notifications and logs
- **Health Monitoring**: System health checks and error reporting

## 🗄️ Database Schema

### Core Tables
```sql
-- Push notification device tokens
push_tokens (id, user_id, device_id, platform, token, is_active, last_used_at)

-- Notification templates and types
notification_types (id, type_key, name, description, category, default_title, 
                   default_body, icon, sound, priority, is_active)

-- User notifications and reminders
notifications (id, user_id, notification_type_id, title, body, data, scheduled_at,
              sent_at, status, is_reminder, reminder_type, reference_type, reference_id,
              repeat_pattern, repeat_interval, repeat_days, repeat_until, repeat_count,
              snooze_until, snooze_count, max_snooze_count, delivery_methods, priority)

-- Notification delivery logs
notification_logs (id, notification_id, user_id, delivery_method, platform, device_token,
                  status, external_id, response_data, error_message, sent_at, delivered_at, clicked_at)

-- User notification preferences
notification_preferences (id, user_id, notification_type_id, is_enabled, delivery_methods,
                         sound, vibration, advance_minutes, quiet_hours_override, max_repeats)

-- Notification actions (for interactive notifications)
notification_actions (id, notification_type_id, action_key, label, action_type, icon, is_destructive)

-- User interactions with notifications
notification_interactions (id, notification_id, user_id, action_type, action_key, action_data, interacted_at)

-- Notification batches (for bulk operations)
notification_batches (id, name, description, notification_type_id, total_notifications,
                     sent_notifications, failed_notifications, status, scheduled_at, started_at, completed_at)
```

### Advanced Database Functions
```sql
-- Notification management
create_notification(user_uuid, type_key, title, body, scheduled_time, data, reference_type, reference_id, repeat_pattern, delivery_methods)
get_pending_notifications(batch_size) -- Get notifications ready for processing
mark_notification_sent(notification_uuid, delivery_method, platform, external_id, response_data)
create_next_occurrence(notification_uuid) -- Create next occurrence for repeating notifications
snooze_notification(notification_uuid, snooze_minutes) -- Snooze with validation
cancel_notification(notification_uuid, user_uuid) -- Cancel pending notification

-- Push token management
register_push_token(user_uuid, device_id, platform, token) -- Register device token
get_user_push_tokens(user_uuid, platform_filter) -- Get user's registered devices

-- Analytics and cleanup
get_notification_stats(user_uuid, days_back) -- Get notification analytics
cleanup_old_notifications(days_to_keep) -- Clean up old data
```

## 🔧 API Endpoints

### Notification Management API
```typescript
GET    /api/notifications                    // List and filter notifications
GET    /api/notifications?action=stats       // Get notification statistics
GET    /api/notifications?action=types       // Get notification types
POST   /api/notifications                    // Create new notification
POST   /api/notifications?action=snooze      // Snooze notification
POST   /api/notifications?action=interact    // Record user interaction
POST   /api/notifications?action=bulk_create // Bulk create notifications
PUT    /api/notifications?id=uuid            // Update notification
DELETE /api/notifications?id=uuid            // Delete notification
DELETE /api/notifications?action=cancel      // Cancel notification
```

### Push Token Management API
```typescript
GET    /api/notifications/push-tokens        // Get user's push tokens
GET    /api/notifications/push-tokens?platform=web // Filter by platform
POST   /api/notifications/push-tokens        // Register new push token
PUT    /api/notifications/push-tokens?device_id=x&platform=y // Update token
DELETE /api/notifications/push-tokens?device_id=x&platform=y // Delete token
DELETE /api/notifications/push-tokens?action=deactivate_all  // Deactivate all tokens
```

## 📱 Push Notification Service

### Firebase Integration
```typescript
// Push notification service with FCM integration
class PushNotificationService {
  sendToDevice(token, payload, platform, options) // Send to single device
  sendToMultipleDevices(tokens, payload, options) // Send to multiple devices
  sendToTopic(topic, payload, options) // Send to topic subscribers
  subscribeToTopic(tokens, topic) // Subscribe devices to topic
  unsubscribeFromTopic(tokens, topic) // Unsubscribe from topic
  validateTokens(tokens) // Validate registration tokens
}

// Platform-specific configurations
buildAndroidConfig(payload, options) // Android-specific settings
buildApnsConfig(payload, options) // iOS-specific settings
buildWebPushConfig(payload, options) // Web-specific settings
```

### Cross-Platform Support
- **Web Browsers**: Service Worker with VAPID keys for web push
- **Android**: FCM with Android-specific notification channels and actions
- **iOS**: APNs integration with iOS-specific payload and features
- **Token Management**: Automatic token refresh and validation across platforms

## ⚙️ Supabase Edge Functions

### process-notifications Function
```typescript
// Processes pending notifications for delivery
POST /functions/v1/process-notifications

Features:
- Fetch pending notifications from database
- Send push notifications via FCM
- Send email notifications via service
- Send SMS notifications via service
- Log delivery attempts and results
- Create next occurrence for repeating notifications
- Handle failed deliveries with retry logic
```

### notification-cron Function
```typescript
// Automated cron job for notification management
POST /functions/v1/notification-cron

Features:
- Call process-notifications function
- Create automatic task due reminders
- Create daily habit check-in reminders
- Create prayer time reminders
- Create bill due reminders
- Create medication reminders
- Clean up old notifications and logs
- Update notification statistics
```

## 🎨 React Components

### Core Components
- **NotificationsDashboard**: Main tabbed interface for notification management
- **NotificationCenter**: View and manage all notifications with filtering
- **ReminderManager**: Create and schedule custom reminders with templates
- **PushNotificationSetup**: Configure push notification devices and permissions

### Component Features
- **Real-time Updates**: Live notification status and delivery tracking
- **Interactive Actions**: Snooze, cancel, and interact with notifications
- **Filtering & Search**: Filter by status, type, priority, and date
- **Responsive Design**: Mobile-first responsive layout
- **Error Handling**: Comprehensive error states and recovery
- **Accessibility**: Full keyboard navigation and screen reader support

## 🔒 Security Features

### Data Protection
- **Row Level Security**: Complete RLS policies for user data isolation
- **Token Encryption**: Push tokens encrypted and securely stored
- **Input Validation**: Comprehensive validation and sanitization
- **Rate Limiting**: API rate limiting to prevent abuse
- **Audit Logging**: All notification interactions logged
- **GDPR Compliance**: Full data portability and deletion capabilities

### Push Notification Security
- **VAPID Keys**: Secure web push authentication
- **Token Validation**: Automatic token validation and cleanup
- **Secure Transmission**: All data encrypted in transit
- **User Control**: Complete control over notification preferences
- **Revocation**: Ability to revoke device access anytime

## 🚀 Getting Started

### 1. Database Setup
```bash
# Run notification migrations
npx supabase db reset

# Migrations applied:
# - 20240101000015_notifications_schema.sql
# - 20240101000016_notifications_functions.sql
```

### 2. Firebase Configuration
```bash
# Set up Firebase project and enable FCM
# Configure service account credentials
# Set environment variables:
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY=your_private_key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
```

### 3. Edge Functions Deployment
```bash
# Deploy Edge Functions
npx supabase functions deploy process-notifications
npx supabase functions deploy notification-cron

# Set up cron job to call notification-cron regularly
# Example: Every 5 minutes
```

### 4. Service Worker Setup
```javascript
// public/sw.js - Service Worker for push notifications
self.addEventListener('push', function(event) {
  const options = {
    body: event.data.text(),
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {action: 'explore', title: 'Explore', icon: '/icons/checkmark.png'},
      {action: 'close', title: 'Close', icon: '/icons/xmark.png'},
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('HayatOS Notification', options)
  );
});
```

### 5. Component Usage
```tsx
import NotificationsDashboard from '@/components/NotificationsDashboard';

export default function NotificationsPage() {
  return <NotificationsDashboard />;
}
```

### 6. Demo Access
Visit `/notifications` to explore:
- Complete notification center with filtering and management
- Custom reminder creation with flexible scheduling
- Push notification setup and device management
- Notification analytics and delivery tracking

## 📊 Notification Types

### Automatic Reminders
- **Task Due**: Reminders for upcoming task deadlines
- **Habit Check-in**: Daily habit completion reminders
- **Prayer Times**: Islamic prayer time notifications
- **Bill Due**: Bill payment reminders
- **Medication**: Medication time reminders
- **Appointments**: Medical appointment reminders

### System Notifications
- **Welcome**: New user onboarding messages
- **Updates**: App update notifications
- **Backup**: Data backup reminders
- **Security**: Security alerts and notifications

### Custom Reminders
- **One-time**: Single occurrence reminders
- **Recurring**: Daily, weekly, monthly, yearly patterns
- **Custom Patterns**: Flexible scheduling with specific days
- **Priority Levels**: Low, normal, high, urgent priorities
- **Multiple Delivery**: Push, email, SMS combinations

## 🔮 Advanced Features

### Smart Scheduling
- **Quiet Hours**: Respect user-defined quiet hours
- **Time Zones**: Automatic timezone handling
- **Frequency Control**: Prevent notification spam
- **Batch Processing**: Efficient bulk notification handling
- **Priority Queuing**: High-priority notifications processed first

### Analytics & Monitoring
- **Delivery Rates**: Track successful delivery across platforms
- **Engagement Metrics**: Click-through rates and user interactions
- **Performance Monitoring**: System health and processing times
- **Error Tracking**: Failed delivery analysis and retry logic
- **User Insights**: Notification preferences and behavior patterns

### Integration Capabilities
- **Webhook Support**: Real-time notification status updates
- **API Integration**: RESTful API for external integrations
- **Event Triggers**: Database triggers for automatic notifications
- **Custom Actions**: Interactive notification actions
- **Deep Linking**: Direct app navigation from notifications

---

The Notifications System provides a comprehensive, secure, and scalable notification management solution with advanced features for push notifications, smart reminders, and automated processing while maintaining high standards for user experience and data privacy.
