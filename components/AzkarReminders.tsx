'use client';

import React, { useState, useEffect } from 'react';

interface Azkar {
  id: string;
  title_arabic: string;
  title_english: string;
  title_dhivehi?: string;
  text_arabic: string;
  text_english?: string;
  text_dhivehi?: string;
  transliteration?: string;
  type: 'morning' | 'evening' | 'after_prayer' | 'before_sleep' | 'general';
  repetition_count: number;
  reference?: string;
  audio_url?: string;
}

interface AzkarReminder {
  id: string;
  azkar_id: string;
  reminder_time: string;
  days_of_week: number[];
  is_enabled: boolean;
  last_sent_at?: string;
  azkar: {
    id: string;
    title_arabic: string;
    title_english: string;
    title_dhivehi?: string;
    type: string;
    repetition_count: number;
  };
}

export default function AzkarReminders() {
  const [azkarList, setAzkarList] = useState<Azkar[]>([]);
  const [reminders, setReminders] = useState<AzkarReminder[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedAzkar, setSelectedAzkar] = useState<Azkar | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    azkar_id: '',
    reminder_time: '07:00',
    days_of_week: [1, 2, 3, 4, 5, 6, 7] as number[],
    is_enabled: true,
  });

  const azkarTypes = [
    { value: 'morning', label: 'Morning Azkar', icon: '🌅' },
    { value: 'evening', label: 'Evening Azkar', icon: '🌆' },
    { value: 'after_prayer', label: 'After Prayer', icon: '🕌' },
    { value: 'before_sleep', label: 'Before Sleep', icon: '🌙' },
    { value: 'general', label: 'General', icon: '📿' },
  ];

  const daysOfWeek = [
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
    { value: 7, label: 'Sun' },
  ];

  useEffect(() => {
    fetchAzkar();
    fetchReminders();
  }, [selectedType]);

  const fetchAzkar = async () => {
    try {
      const params = new URLSearchParams({
        action: 'azkar',
        limit: '50',
      });

      if (selectedType) {
        params.append('type', selectedType);
      }

      const response = await fetch(`/api/faith/azkar?${params.toString()}`);
      const result = await response.json();

      if (response.ok) {
        setAzkarList(result.data || []);
      } else {
        console.error('Error fetching azkar:', result.error);
      }
    } catch (error) {
      console.error('Error fetching azkar:', error);
    }
  };

  const fetchReminders = async () => {
    try {
      const response = await fetch('/api/faith/azkar?action=reminders');
      const result = await response.json();

      if (response.ok) {
        setReminders(result.data || []);
      } else {
        console.error('Error fetching reminders:', result.error);
      }
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  };

  const createReminder = async () => {
    if (!formData.azkar_id) {
      alert('Please select an azkar');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/faith/azkar?action=reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        await fetchReminders();
        setShowAddForm(false);
        resetForm();
        alert('Reminder created successfully');
      } else {
        console.error('Error creating reminder:', result.error);
        alert('Error creating reminder: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating reminder:', error);
      alert('Error creating reminder');
    } finally {
      setLoading(false);
    }
  };

  const toggleReminder = async (reminderId: string, isEnabled: boolean) => {
    try {
      const response = await fetch('/api/faith/azkar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reminder_id: reminderId,
          is_enabled: isEnabled,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        await fetchReminders();
      } else {
        console.error('Error updating reminder:', result.error);
        alert('Error updating reminder: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating reminder:', error);
      alert('Error updating reminder');
    }
  };

  const deleteReminder = async (reminderId: string) => {
    if (!confirm('Are you sure you want to delete this reminder?')) {
      return;
    }

    try {
      const response = await fetch('/api/faith/azkar', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminder_id: reminderId }),
      });

      const result = await response.json();

      if (response.ok) {
        await fetchReminders();
        alert('Reminder deleted successfully');
      } else {
        console.error('Error deleting reminder:', result.error);
        alert('Error deleting reminder: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting reminder:', error);
      alert('Error deleting reminder');
    }
  };

  const resetForm = () => {
    setFormData({
      azkar_id: '',
      reminder_time: '07:00',
      days_of_week: [1, 2, 3, 4, 5, 6, 7],
      is_enabled: true,
    });
    setSelectedAzkar(null);
  };

  const formatTime = (timeStr: string) => {
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getDaysString = (days: number[]) => {
    if (days.length === 7) return 'Daily';
    if (days.length === 5 && !days.includes(6) && !days.includes(7)) return 'Weekdays';
    if (days.length === 2 && days.includes(6) && days.includes(7)) return 'Weekends';
    
    return days.map(day => daysOfWeek.find(d => d.value === day)?.label).join(', ');
  };

  const getTypeIcon = (type: string) => {
    return azkarTypes.find(t => t.value === type)?.icon || '📿';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Azkar Reminders</h2>
          <p className="text-gray-600">Set up notifications for daily remembrance and supplications</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          {showAddForm ? 'Cancel' : 'Add Reminder'}
        </button>
      </div>

      {/* Add Reminder Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Reminder</h3>
          
          <div className="space-y-4">
            {/* Azkar Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Types</option>
                {azkarTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Azkar Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Azkar *
              </label>
              <select
                value={formData.azkar_id}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, azkar_id: e.target.value }));
                  const azkar = azkarList.find(a => a.id === e.target.value);
                  setSelectedAzkar(azkar || null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Choose an azkar</option>
                {azkarList.map((azkar) => (
                  <option key={azkar.id} value={azkar.id}>
                    {getTypeIcon(azkar.type)} {azkar.title_english} ({azkar.repetition_count}x)
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Azkar Preview */}
            {selectedAzkar && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">{selectedAzkar.title_english}</h4>
                <p className="text-sm text-gray-600 text-right mb-2" dir="rtl">{selectedAzkar.title_arabic}</p>
                <p className="text-sm text-gray-700">{selectedAzkar.text_english}</p>
                {selectedAzkar.repetition_count > 1 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Repeat {selectedAzkar.repetition_count} times
                  </p>
                )}
              </div>
            )}

            {/* Reminder Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reminder Time *
              </label>
              <input
                type="time"
                value={formData.reminder_time}
                onChange={(e) => setFormData(prev => ({ ...prev, reminder_time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            {/* Days of Week */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Days of Week
              </label>
              <div className="flex space-x-2">
                {daysOfWeek.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => {
                      const newDays = formData.days_of_week.includes(day.value)
                        ? formData.days_of_week.filter(d => d !== day.value)
                        : [...formData.days_of_week, day.value];
                      setFormData(prev => ({ ...prev, days_of_week: newDays }));
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.days_of_week.includes(day.value)
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createReminder}
                disabled={loading || !formData.azkar_id}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Reminder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Reminders */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Reminders</h3>
        
        {reminders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🔔</div>
            <p>No reminders set up yet.</p>
            <p className="text-sm">Create your first azkar reminder above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{getTypeIcon(reminder.azkar.type)}</div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {reminder.azkar.title_english}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatTime(reminder.reminder_time)} • {getDaysString(reminder.days_of_week)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {reminder.azkar.repetition_count}x repetition
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={reminder.is_enabled}
                      onChange={(e) => toggleReminder(reminder.id, e.target.checked)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-600">Enabled</span>
                  </label>
                  
                  <button
                    onClick={() => deleteReminder(reminder.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete reminder"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Azkar Types Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-3">📿 Types of Azkar</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {azkarTypes.map((type) => (
            <div key={type.value} className="flex items-center space-x-2 text-sm text-blue-800">
              <span>{type.icon}</span>
              <span className="font-medium">{type.label}:</span>
              <span>
                {type.value === 'morning' && 'Recited after Fajr prayer'}
                {type.value === 'evening' && 'Recited after Maghrib prayer'}
                {type.value === 'after_prayer' && 'Recited after each prayer'}
                {type.value === 'before_sleep' && 'Recited before sleeping'}
                {type.value === 'general' && 'General remembrance'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Notification Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2">🔔 Notification Setup</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Make sure to enable notifications in your browser settings</li>
          <li>• Reminders will be sent at the specified times on selected days</li>
          <li>• You can temporarily disable reminders without deleting them</li>
          <li>• Consider setting morning azkar for after Fajr and evening azkar for after Maghrib</li>
        </ul>
      </div>
    </div>
  );
}
