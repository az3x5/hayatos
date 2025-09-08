'use client';

import React, { useState, useEffect } from 'react';

interface Notification {
  id: string;
  title: string;
  body: string;
  data: any;
  scheduled_at: string;
  sent_at?: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled' | 'snoozed';
  is_reminder: boolean;
  reminder_type?: string;
  reference_type?: string;
  reference_id?: string;
  repeat_pattern: string;
  snooze_until?: string;
  snooze_count: number;
  max_snooze_count: number;
  delivery_methods: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  notification_types: {
    type_key: string;
    name: string;
    category: string;
    icon: string;
    sound: string;
  };
}

interface NotificationStats {
  total_notifications: number;
  sent_notifications: number;
  clicked_notifications: number;
  snoozed_notifications: number;
  by_type: Record<string, any>;
  by_day: Record<string, number>;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'sent' | 'snoozed'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { key: 'all', label: 'All', icon: '📋' },
    { key: 'task', label: 'Tasks', icon: '✅' },
    { key: 'habit', label: 'Habits', icon: '🔄' },
    { key: 'faith', label: 'Faith', icon: '🕌' },
    { key: 'finance', label: 'Finance', icon: '💰' },
    { key: 'health', label: 'Health', icon: '🏥' },
    { key: 'system', label: 'System', icon: '⚙️' },
  ];

  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, [filter, selectedCategory]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      if (selectedCategory !== 'all') params.append('type', selectedCategory);
      params.append('limit', '50');

      const response = await fetch(`/api/notifications?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch notifications');
      }

      setNotifications(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/notifications?action=stats');
      const result = await response.json();

      if (response.ok) {
        setStats(result.data);
      }
    } catch (err) {
      console.error('Error fetching notification stats:', err);
    }
  };

  const snoozeNotification = async (notificationId: string, minutes: number = 10) => {
    try {
      const response = await fetch(`/api/notifications?action=snooze&id=${notificationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snooze_minutes: minutes }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to snooze notification');
      }

      // Update notification in state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? {
                ...notification,
                status: 'snoozed' as const,
                snooze_until: result.data.snooze_until,
                snooze_count: notification.snooze_count + 1,
              }
            : notification
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to snooze notification');
      console.error('Error snoozing notification:', err);
    }
  };

  const cancelNotification = async (notificationId: string) => {
    if (!confirm('Are you sure you want to cancel this notification?')) {
      return;
    }

    try {
      const response = await fetch(`/api/notifications?action=cancel&id=${notificationId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel notification');
      }

      // Remove notification from state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel notification');
      console.error('Error cancelling notification:', err);
    }
  };

  const markAsInteracted = async (notificationId: string, actionType: string) => {
    try {
      await fetch('/api/notifications?action=interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification_id: notificationId,
          action_type: actionType,
        }),
      });
    } catch (err) {
      console.error('Error recording interaction:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-blue-600 bg-blue-100';
      case 'snoozed':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'cancelled':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'normal':
        return 'text-blue-600';
      case 'low':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Notification Center</h2>
        <p className="text-gray-600">Manage your notifications and reminders</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total_notifications}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.sent_notifications}</div>
            <div className="text-sm text-gray-600">Sent</div>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.clicked_notifications}</div>
            <div className="text-sm text-gray-600">Clicked</div>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.snoozed_notifications}</div>
            <div className="text-sm text-gray-600">Snoozed</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-wrap gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="snoozed">Snoozed</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((category) => (
                <option key={category.key} value={category.key}>
                  {category.icon} {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <div className="flex items-end">
            <button
              onClick={fetchNotifications}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-lg border">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔔</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-600">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div key={notification.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {/* Icon */}
                    <div className="text-2xl">
                      {notification.notification_types.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900 truncate">
                          {notification.title}
                        </h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(notification.status)}`}>
                          {notification.status}
                        </span>
                        <span className={`text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                          {notification.priority}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-2">{notification.body}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>
                          {notification.sent_at ? 'Sent' : 'Scheduled'}: {' '}
                          {formatDate(notification.sent_at || notification.scheduled_at)}
                        </span>
                        
                        {notification.is_reminder && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Reminder
                          </span>
                        )}
                        
                        {notification.repeat_pattern !== 'none' && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                            Repeats {notification.repeat_pattern}
                          </span>
                        )}
                        
                        {notification.snooze_until && (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            Snoozed until {new Date(notification.snooze_until).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    {notification.status === 'pending' && (
                      <>
                        {notification.snooze_count < notification.max_snooze_count && (
                          <div className="relative group">
                            <button
                              onClick={() => snoozeNotification(notification.id, 10)}
                              className="p-2 text-gray-400 hover:text-yellow-600 transition-colors"
                              title="Snooze for 10 minutes"
                            >
                              ⏰
                            </button>
                            <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                              Snooze 10min
                            </div>
                          </div>
                        )}
                        
                        <button
                          onClick={() => cancelNotification(notification.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Cancel notification"
                        >
                          ❌
                        </button>
                      </>
                    )}

                    {notification.status === 'sent' && (
                      <button
                        onClick={() => markAsInteracted(notification.id, 'viewed')}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Mark as viewed"
                      >
                        👁️
                      </button>
                    )}

                    {notification.status === 'snoozed' && (
                      <button
                        onClick={() => cancelNotification(notification.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Cancel snoozed notification"
                      >
                        ❌
                      </button>
                    )}
                  </div>
                </div>

                {/* Additional Info */}
                {notification.data && Object.keys(notification.data).length > 0 && (
                  <div className="mt-3 pl-11">
                    <details className="text-xs text-gray-500">
                      <summary className="cursor-pointer hover:text-gray-700">
                        Additional data
                      </summary>
                      <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(notification.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-3">🔔 Notification Center</h4>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>Snooze:</strong> Temporarily delay notifications (up to 3 times)</p>
          <p><strong>Cancel:</strong> Stop pending notifications from being sent</p>
          <p><strong>Reminders:</strong> Automatic reminders for tasks, habits, prayers, and more</p>
          <p><strong>Delivery:</strong> Push notifications, email, and SMS support</p>
        </div>
      </div>
    </div>
  );
}
