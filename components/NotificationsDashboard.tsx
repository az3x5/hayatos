'use client';

import React, { useState } from 'react';
import NotificationCenter from './NotificationCenter';
import ReminderManager from './ReminderManager';
import PushNotificationSetup from './PushNotificationSetup';

export default function NotificationsDashboard() {
  const [activeTab, setActiveTab] = useState<'center' | 'reminders' | 'push' | 'analytics'>('center');

  const tabs = [
    {
      id: 'center',
      label: 'Notification Center',
      icon: '🔔',
      description: 'View and manage all notifications',
    },
    {
      id: 'reminders',
      label: 'Reminder Manager',
      icon: '⏰',
      description: 'Create and schedule custom reminders',
    },
    {
      id: 'push',
      label: 'Push Setup',
      icon: '📱',
      description: 'Configure push notification devices',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: '📊',
      description: 'Notification delivery and engagement stats',
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'center':
        return <NotificationCenter />;
      case 'reminders':
        return <ReminderManager />;
      case 'push':
        return <PushNotificationSetup />;
      case 'analytics':
        return <NotificationAnalytics />;
      default:
        return <NotificationCenter />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Notifications System</h1>
          <p className="text-lg text-gray-600">
            Complete notification management with push notifications, reminders, and analytics
          </p>
        </div>

        {/* Demo Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-center">
            <span className="text-blue-600 mr-2">🔔</span>
            <div>
              <h4 className="font-medium text-blue-800">Notifications System</h4>
              <p className="text-sm text-blue-700">
                Advanced notification system with push notifications, smart reminders, snooze functionality, and cron-based automation.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg border p-4 sticky top-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{tab.icon}</span>
                      <div>
                        <div className="font-medium">{tab.label}</div>
                        <div className="text-sm text-gray-500">{tab.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {renderTabContent()}
          </div>
        </div>

        {/* System Overview */}
        <div className="mt-12 bg-white rounded-lg border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Notifications System Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-3">🔔</div>
              <h4 className="font-semibold text-gray-900 mb-2">Smart Notifications</h4>
              <p className="text-sm text-gray-600">
                Intelligent notification system with priority levels, snooze, and delivery tracking.
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl mb-3">⏰</div>
              <h4 className="font-semibold text-gray-900 mb-2">Flexible Reminders</h4>
              <p className="text-sm text-gray-600">
                Create custom reminders with recurring patterns, snooze options, and multiple delivery methods.
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl mb-3">📱</div>
              <h4 className="font-semibold text-gray-900 mb-2">Push Notifications</h4>
              <p className="text-sm text-gray-600">
                Cross-platform push notifications using Firebase Cloud Messaging for web, Android, and iOS.
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl mb-3">🤖</div>
              <h4 className="font-semibold text-gray-900 mb-2">Automated Processing</h4>
              <p className="text-sm text-gray-600">
                Cron-based Edge Functions for automatic reminder creation and notification processing.
              </p>
            </div>
          </div>
        </div>

        {/* Technical Implementation */}
        <div className="mt-8 bg-white rounded-lg border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Technical Implementation</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🗄️ Database Features</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• <strong>Notifications Table:</strong> Complete notification management with scheduling</li>
                <li>• <strong>Push Tokens:</strong> Device token management for cross-platform delivery</li>
                <li>• <strong>Notification Types:</strong> Configurable notification templates and categories</li>
                <li>• <strong>Delivery Logs:</strong> Comprehensive delivery tracking and analytics</li>
                <li>• <strong>User Preferences:</strong> Granular notification preference management</li>
                <li>• <strong>Interaction Tracking:</strong> User engagement and interaction analytics</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 API Features</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• <strong>Notification API:</strong> Create, update, snooze, and cancel notifications</li>
                <li>• <strong>Push Token API:</strong> Register and manage device push tokens</li>
                <li>• <strong>Reminder API:</strong> Custom reminder creation with flexible scheduling</li>
                <li>• <strong>Analytics API:</strong> Delivery stats and engagement metrics</li>
                <li>• <strong>Bulk Operations:</strong> Batch notification creation and management</li>
                <li>• <strong>Webhook Support:</strong> Real-time notification status updates</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📱 Push Notification Features</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• <strong>Firebase Integration:</strong> FCM for reliable cross-platform delivery</li>
                <li>• <strong>Service Worker:</strong> Background notification handling</li>
                <li>• <strong>Rich Notifications:</strong> Images, actions, and interactive content</li>
                <li>• <strong>Platform Optimization:</strong> Native features for web, Android, iOS</li>
                <li>• <strong>Offline Support:</strong> Notifications delivered when app is closed</li>
                <li>• <strong>Token Management:</strong> Automatic token refresh and validation</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Automation Features</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• <strong>Cron Jobs:</strong> Supabase Edge Functions for scheduled processing</li>
                <li>• <strong>Auto Reminders:</strong> Automatic creation for tasks, habits, prayers</li>
                <li>• <strong>Smart Scheduling:</strong> Respect quiet hours and user preferences</li>
                <li>• <strong>Retry Logic:</strong> Failed notification retry with exponential backoff</li>
                <li>• <strong>Cleanup Tasks:</strong> Automatic cleanup of old notifications and logs</li>
                <li>• <strong>Health Monitoring:</strong> System health checks and error reporting</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Notification Types */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-green-900 mb-4">Supported Notification Types</h2>
          <div className="space-y-4 text-green-800">
            <div>
              <h4 className="font-semibold">📋 Task Notifications</h4>
              <p className="text-sm">Task due reminders, overdue alerts, and completion confirmations</p>
            </div>
            <div>
              <h4 className="font-semibold">🔄 Habit Reminders</h4>
              <p className="text-sm">Daily habit check-ins, streak milestones, and missed habit alerts</p>
            </div>
            <div>
              <h4 className="font-semibold">🕌 Faith Notifications</h4>
              <p className="text-sm">Prayer time reminders, Azkar alerts, and Quran reading reminders</p>
            </div>
            <div>
              <h4 className="font-semibold">💰 Finance Alerts</h4>
              <p className="text-sm">Bill due reminders, budget alerts, and expense tracking reminders</p>
            </div>
            <div>
              <h4 className="font-semibold">🏥 Health Reminders</h4>
              <p className="text-sm">Medication reminders, appointment alerts, and health check-in prompts</p>
            </div>
            <div>
              <h4 className="font-semibold">⚙️ System Notifications</h4>
              <p className="text-sm">Welcome messages, update alerts, and backup reminders</p>
            </div>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Setup Instructions</h2>
          <div className="space-y-4 text-blue-800">
            <div>
              <h4 className="font-semibold">1. Database Setup</h4>
              <p className="text-sm">Run notification migrations to create tables and functions</p>
            </div>
            <div>
              <h4 className="font-semibold">2. Firebase Configuration</h4>
              <p className="text-sm">Set up Firebase project and configure FCM credentials</p>
            </div>
            <div>
              <h4 className="font-semibold">3. Edge Functions</h4>
              <p className="text-sm">Deploy Supabase Edge Functions for cron-based processing</p>
            </div>
            <div>
              <h4 className="font-semibold">4. Service Worker</h4>
              <p className="text-sm">Configure service worker for push notification handling</p>
            </div>
            <div>
              <h4 className="font-semibold">5. Cron Schedule</h4>
              <p className="text-sm">Set up cron jobs for automatic notification processing</p>
            </div>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-3">🔒 Privacy & Security</h4>
          <div className="text-sm text-gray-700 space-y-2">
            <p><strong>Data Protection:</strong> All notification data is encrypted and protected with RLS policies</p>
            <p><strong>Token Security:</strong> Push tokens are encrypted and can be revoked anytime</p>
            <p><strong>User Control:</strong> Complete control over notification preferences and delivery methods</p>
            <p><strong>Audit Logging:</strong> All notification interactions are logged for transparency</p>
            <p><strong>GDPR Compliance:</strong> Full data portability and deletion capabilities</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Placeholder component for analytics
function NotificationAnalytics() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Notification Analytics</h2>
        <p className="text-gray-600">Delivery statistics and engagement metrics</p>
      </div>
      
      <div className="bg-white rounded-lg border p-6">
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
          <p className="text-gray-600">
            Detailed analytics for notification delivery rates, user engagement, and system performance.
          </p>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-3">📈 Analytics Features</h4>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>Delivery Rates:</strong> Track successful delivery across platforms</p>
          <p><strong>Engagement Metrics:</strong> Click-through rates and user interactions</p>
          <p><strong>Performance Monitoring:</strong> System health and processing times</p>
          <p><strong>User Insights:</strong> Notification preferences and behavior patterns</p>
        </div>
      </div>
    </div>
  );
}
