'use client';

import React, { useState, useEffect } from 'react';

interface NotificationSettings {
  id: string;
  user_id: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  
  task_notifications: boolean;
  task_reminders: boolean;
  task_deadlines: boolean;
  
  habit_notifications: boolean;
  habit_reminders: boolean;
  habit_streaks: boolean;
  
  salat_notifications: boolean;
  salat_reminders: boolean;
  azkar_reminders: boolean;
  
  finance_notifications: boolean;
  budget_alerts: boolean;
  bill_reminders: boolean;
  
  health_notifications: boolean;
  medication_reminders: boolean;
  appointment_reminders: boolean;
  
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  weekend_notifications: boolean;
  
  notification_sound: string;
  vibration_enabled: boolean;
  
  created_at: string;
  updated_at: string;
}

export default function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const notificationSounds = [
    'default',
    'chime',
    'bell',
    'notification',
    'alert',
    'gentle',
    'islamic_call',
  ];

  const moduleCategories = [
    {
      key: 'tasks',
      title: 'Tasks & Productivity',
      icon: '✅',
      description: 'Task reminders, deadlines, and completion notifications',
      settings: ['task_notifications', 'task_reminders', 'task_deadlines'],
    },
    {
      key: 'habits',
      title: 'Habits & Routines',
      icon: '🔄',
      description: 'Habit reminders, streak notifications, and progress updates',
      settings: ['habit_notifications', 'habit_reminders', 'habit_streaks'],
    },
    {
      key: 'faith',
      title: 'Faith & Spirituality',
      icon: '🕌',
      description: 'Prayer reminders, azkar notifications, and spiritual tracking',
      settings: ['salat_notifications', 'salat_reminders', 'azkar_reminders'],
    },
    {
      key: 'finance',
      title: 'Finance & Money',
      icon: '💰',
      description: 'Budget alerts, bill reminders, and financial notifications',
      settings: ['finance_notifications', 'budget_alerts', 'bill_reminders'],
    },
    {
      key: 'health',
      title: 'Health & Wellness',
      icon: '🏥',
      description: 'Health tracking, medication reminders, and appointments',
      settings: ['health_notifications', 'medication_reminders', 'appointment_reminders'],
    },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/settings/notifications');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch notification settings');
      }

      setSettings(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notification settings');
      console.error('Error fetching notification settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<NotificationSettings>) => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update notification settings');
      }

      setSettings(result.data);
      setSuccessMessage('Notification settings updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update notification settings');
      console.error('Error updating notification settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (field: keyof NotificationSettings, value: boolean) => {
    if (settings) {
      const updatedSettings = { ...settings, [field]: value };
      setSettings(updatedSettings);
      updateSettings({ [field]: value });
    }
  };

  const handleBulkUpdate = async (category: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/settings/notifications?action=bulk_update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, enabled }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update notifications');
      }

      setSettings(result.data);
      setSuccessMessage(`${category} notifications ${enabled ? 'enabled' : 'disabled'}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update notifications');
      console.error('Error bulk updating notifications:', err);
    }
  };

  const testNotification = async (type: 'email' | 'push' | 'sms') => {
    setTesting(type);
    setError(null);

    try {
      const response = await fetch('/api/settings/notifications?action=test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send test notification');
      }

      setSuccessMessage(result.data.message);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send test notification');
      console.error('Error testing notification:', err);
    } finally {
      setTesting(null);
    }
  };

  const resetToDefaults = async () => {
    if (!confirm('Are you sure you want to reset all notification settings to defaults?')) {
      return;
    }

    try {
      const response = await fetch('/api/settings/notifications?action=reset', {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset notification settings');
      }

      setSettings(result.data);
      setSuccessMessage('Notification settings reset to defaults');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset notification settings');
      console.error('Error resetting notification settings:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notification settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Failed to load notification settings</p>
        <button
          onClick={fetchSettings}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Notification Settings</h2>
        <p className="text-gray-600">Manage how and when you receive notifications</p>
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

      {/* Global Settings */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Global Settings</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Enable Notifications</h4>
              <p className="text-sm text-gray-600">Master switch for all notifications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications_enabled}
                onChange={(e) => handleToggle('notifications_enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Notification Methods */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Methods</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">📧 Email</h4>
                <p className="text-sm text-gray-600">Receive notifications via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.email_notifications}
                  onChange={(e) => handleToggle('email_notifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <button
              onClick={() => testNotification('email')}
              disabled={!settings.email_notifications || testing === 'email'}
              className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {testing === 'email' ? 'Sending...' : 'Test Email'}
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">🔔 Push</h4>
                <p className="text-sm text-gray-600">Browser push notifications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.push_notifications}
                  onChange={(e) => handleToggle('push_notifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <button
              onClick={() => testNotification('push')}
              disabled={!settings.push_notifications || testing === 'push'}
              className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {testing === 'push' ? 'Sending...' : 'Test Push'}
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">📱 SMS</h4>
                <p className="text-sm text-gray-600">Text message notifications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.sms_notifications}
                  onChange={(e) => handleToggle('sms_notifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <button
              onClick={() => testNotification('sms')}
              disabled={!settings.sms_notifications || testing === 'sms'}
              className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {testing === 'sms' ? 'Sending...' : 'Test SMS'}
            </button>
          </div>
        </div>
      </div>

      {/* Module-specific Notifications */}
      <div className="space-y-4">
        {moduleCategories.map((category) => (
          <div key={category.key} className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{category.icon}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkUpdate(category.key, true)}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Enable All
                </button>
                <button
                  onClick={() => handleBulkUpdate(category.key, false)}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Disable All
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              {category.settings.map((settingKey) => (
                <div key={settingKey} className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 capitalize">
                      {settingKey.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
                    </h4>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings[settingKey as keyof NotificationSettings] as boolean}
                      onChange={(e) => handleToggle(settingKey as keyof NotificationSettings, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Timing Settings */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Timing & Schedule</h3>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Quiet Hours</h4>
              <p className="text-sm text-gray-600">Disable notifications during specified hours</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.quiet_hours_enabled}
                onChange={(e) => handleToggle('quiet_hours_enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {settings.quiet_hours_enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={settings.quiet_hours_start}
                  onChange={(e) => updateSettings({ quiet_hours_start: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={settings.quiet_hours_end}
                  onChange={(e) => updateSettings({ quiet_hours_end: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Weekend Notifications</h4>
              <p className="text-sm text-gray-600">Receive notifications on weekends</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.weekend_notifications}
                onChange={(e) => handleToggle('weekend_notifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Sound & Vibration */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sound & Vibration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notification Sound
            </label>
            <select
              value={settings.notification_sound}
              onChange={(e) => updateSettings({ notification_sound: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {notificationSounds.map((sound) => (
                <option key={sound} value={sound}>
                  {sound.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Vibration</h4>
              <p className="text-sm text-gray-600">Enable vibration for notifications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.vibration_enabled}
                onChange={(e) => handleToggle('vibration_enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <button
          onClick={resetToDefaults}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Reset to Defaults
        </button>
        
        <button
          onClick={() => handleBulkUpdate('all', false)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Disable All Notifications
        </button>
      </div>
    </div>
  );
}
