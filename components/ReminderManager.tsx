'use client';

import React, { useState, useEffect } from 'react';

interface ReminderTemplate {
  type: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  defaultTitle: string;
  defaultBody: string;
}

interface CreateReminderForm {
  notification_type: string;
  title: string;
  body: string;
  scheduled_at: string;
  repeat_pattern: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  repeat_interval: number;
  repeat_days: number[];
  repeat_until?: string;
  repeat_count?: number;
  delivery_methods: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  reference_type?: string;
  reference_id?: string;
}

export default function ReminderManager() {
  const [reminderTypes, setReminderTypes] = useState<ReminderTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');

  const [form, setForm] = useState<CreateReminderForm>({
    notification_type: '',
    title: '',
    body: '',
    scheduled_at: '',
    repeat_pattern: 'none',
    repeat_interval: 1,
    repeat_days: [],
    delivery_methods: ['push'],
    priority: 'normal',
  });

  const repeatPatterns = [
    { value: 'none', label: 'No repeat' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  const weekDays = [
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
    { value: 7, label: 'Sun' },
  ];

  const deliveryMethods = [
    { value: 'push', label: 'Push Notification', icon: '📱' },
    { value: 'email', label: 'Email', icon: '📧' },
    { value: 'sms', label: 'SMS', icon: '💬' },
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-gray-600' },
    { value: 'normal', label: 'Normal', color: 'text-blue-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600' },
  ];

  useEffect(() => {
    fetchReminderTypes();
  }, []);

  useEffect(() => {
    if (selectedType) {
      const type = reminderTypes.find(t => t.type === selectedType);
      if (type) {
        setForm(prev => ({
          ...prev,
          notification_type: type.type,
          title: type.defaultTitle,
          body: type.defaultBody,
        }));
      }
    }
  }, [selectedType, reminderTypes]);

  const fetchReminderTypes = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notifications?action=types');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch reminder types');
      }

      setReminderTypes(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reminder types');
      console.error('Error fetching reminder types:', err);
    } finally {
      setLoading(false);
    }
  };

  const createReminder = async () => {
    setCreating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Validate form
      if (!form.notification_type || !form.title || !form.body || !form.scheduled_at) {
        throw new Error('Please fill in all required fields');
      }

      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create reminder');
      }

      setSuccessMessage('Reminder created successfully');
      setShowCreateForm(false);
      resetForm();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create reminder');
      console.error('Error creating reminder:', err);
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setForm({
      notification_type: '',
      title: '',
      body: '',
      scheduled_at: '',
      repeat_pattern: 'none',
      repeat_interval: 1,
      repeat_days: [],
      delivery_methods: ['push'],
      priority: 'normal',
    });
    setSelectedType('');
  };

  const handleFormChange = (field: keyof CreateReminderForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleDeliveryMethodToggle = (method: string) => {
    setForm(prev => ({
      ...prev,
      delivery_methods: prev.delivery_methods.includes(method)
        ? prev.delivery_methods.filter(m => m !== method)
        : [...prev.delivery_methods, method]
    }));
  };

  const handleRepeatDayToggle = (day: number) => {
    setForm(prev => ({
      ...prev,
      repeat_days: prev.repeat_days.includes(day)
        ? prev.repeat_days.filter(d => d !== day)
        : [...prev.repeat_days, day]
    }));
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5); // Minimum 5 minutes from now
    return now.toISOString().slice(0, 16);
  };

  const groupedTypes = reminderTypes.reduce((acc, type) => {
    if (!acc[type.category]) acc[type.category] = [];
    acc[type.category].push(type);
    return acc;
  }, {} as Record<string, ReminderTemplate[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reminder types...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Reminder Manager</h2>
          <p className="text-gray-600">Create and manage custom reminders</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showCreateForm ? 'Cancel' : 'Create Reminder'}
        </button>
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

      {/* Create Reminder Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Reminder</h3>
          
          <div className="space-y-6">
            {/* Reminder Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Reminder Type
              </label>
              <div className="space-y-4">
                {Object.entries(groupedTypes).map(([category, types]) => (
                  <div key={category}>
                    <h4 className="font-medium text-gray-900 mb-2 capitalize">{category}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {types.map((type) => (
                        <button
                          key={type.type}
                          onClick={() => setSelectedType(type.type)}
                          className={`p-3 border rounded-lg text-left transition-colors ${
                            selectedType === type.type
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{type.icon}</span>
                            <div>
                              <div className="font-medium">{type.name}</div>
                              <div className="text-sm text-gray-600">{type.description}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedType && (
              <>
                {/* Title and Body */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => handleFormChange('title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Reminder title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={form.priority}
                      onChange={(e) => handleFormChange('priority', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {priorities.map((priority) => (
                        <option key={priority.value} value={priority.value}>
                          {priority.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={form.body}
                    onChange={(e) => handleFormChange('body', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Reminder message"
                  />
                </div>

                {/* Scheduling */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scheduled Time
                    </label>
                    <input
                      type="datetime-local"
                      value={form.scheduled_at}
                      onChange={(e) => handleFormChange('scheduled_at', e.target.value)}
                      min={getMinDateTime()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Repeat Pattern
                    </label>
                    <select
                      value={form.repeat_pattern}
                      onChange={(e) => handleFormChange('repeat_pattern', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {repeatPatterns.map((pattern) => (
                        <option key={pattern.value} value={pattern.value}>
                          {pattern.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Repeat Options */}
                {form.repeat_pattern !== 'none' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Repeat Every
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={form.repeat_interval}
                            onChange={(e) => handleFormChange('repeat_interval', parseInt(e.target.value))}
                            min="1"
                            max="365"
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-gray-600">
                            {form.repeat_pattern === 'daily' && 'day(s)'}
                            {form.repeat_pattern === 'weekly' && 'week(s)'}
                            {form.repeat_pattern === 'monthly' && 'month(s)'}
                            {form.repeat_pattern === 'yearly' && 'year(s)'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Repeat Until (Optional)
                        </label>
                        <input
                          type="date"
                          value={form.repeat_until || ''}
                          onChange={(e) => handleFormChange('repeat_until', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {form.repeat_pattern === 'weekly' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Repeat on Days
                        </label>
                        <div className="flex space-x-2">
                          {weekDays.map((day) => (
                            <button
                              key={day.value}
                              type="button"
                              onClick={() => handleRepeatDayToggle(day.value)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                form.repeat_days.includes(day.value)
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {day.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Delivery Methods */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Methods
                  </label>
                  <div className="space-y-2">
                    {deliveryMethods.map((method) => (
                      <label key={method.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={form.delivery_methods.includes(method.value)}
                          onChange={() => handleDeliveryMethodToggle(method.value)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700">
                          {method.icon} {method.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createReminder}
                    disabled={creating || !form.notification_type || !form.title || !form.body || !form.scheduled_at}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create Reminder'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Quick Reminder Templates */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Reminder Templates</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(groupedTypes).map(([category, types]) => (
            <div key={category} className="space-y-3">
              <h4 className="font-medium text-gray-900 capitalize">{category}</h4>
              {types.slice(0, 3).map((type) => (
                <div key={type.type} className="border rounded-lg p-3">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-xl">{type.icon}</span>
                    <div>
                      <div className="font-medium text-sm">{type.name}</div>
                      <div className="text-xs text-gray-600">{type.description}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedType(type.type);
                      setShowCreateForm(true);
                    }}
                    className="w-full px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Use Template
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Reminder Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-3">⏰ Reminder Features</h4>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>Flexible Scheduling:</strong> Set one-time or recurring reminders with custom patterns</p>
          <p><strong>Multiple Delivery:</strong> Push notifications, email, and SMS support</p>
          <p><strong>Smart Snoozing:</strong> Snooze reminders up to 3 times with custom intervals</p>
          <p><strong>Priority Levels:</strong> Set urgency levels for different types of reminders</p>
          <p><strong>Auto-Creation:</strong> Automatic reminders for tasks, habits, prayers, and bills</p>
        </div>
      </div>
    </div>
  );
}
