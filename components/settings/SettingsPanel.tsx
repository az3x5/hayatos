'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  timezone: string;
  language: string;
  currency: string;
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  taskReminders: boolean;
  habitReminders: boolean;
  prayerReminders: boolean;
  financeAlerts: boolean;
}

interface ThemeSettings {
  mode: 'light' | 'dark' | 'system';
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
}

const mockProfile: UserProfile = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  timezone: 'America/New_York',
  language: 'English',
  currency: 'USD'
};

const mockNotifications: NotificationSettings = {
  email: true,
  push: true,
  sms: false,
  taskReminders: true,
  habitReminders: true,
  prayerReminders: true,
  financeAlerts: false
};

const mockTheme: ThemeSettings = {
  mode: 'system',
  primaryColor: '#3b82f6',
  fontSize: 'medium'
};

function ProfileSettings() {
  const [profile, setProfile] = useState<UserProfile>(mockProfile);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    // Save profile changes
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile.avatar} alt={profile.name} />
            <AvatarFallback className="text-lg">
              {profile.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <Button variant="outline" size="sm">
              Change Avatar
            </Button>
            <p className="text-sm text-muted-foreground mt-1">
              JPG, PNG or GIF. Max size 2MB.
            </p>
          </div>
        </div>

        {/* Profile Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <Input
              value={profile.name}
              onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
              disabled={!isEditing}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
              disabled={!isEditing}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Timezone</label>
            <select
              value={profile.timezone}
              onChange={(e) => setProfile(prev => ({ ...prev, timezone: e.target.value }))}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-input rounded-md bg-background disabled:opacity-50"
            >
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Asia/Dubai">Dubai (GST)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Language</label>
            <select
              value={profile.language}
              onChange={(e) => setProfile(prev => ({ ...prev, language: e.target.value }))}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-input rounded-md bg-background disabled:opacity-50"
            >
              <option value="English">English</option>
              <option value="Arabic">العربية</option>
              <option value="Spanish">Español</option>
              <option value="French">Français</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Currency</label>
            <select
              value={profile.currency}
              onChange={(e) => setProfile(prev => ({ ...prev, currency: e.target.value }))}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-input rounded-md bg-background disabled:opacity-50"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="AED">AED (د.إ)</option>
              <option value="SAR">SAR (ر.س)</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave}>Save Changes</Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationSettings() {
  const [notifications, setNotifications] = useState<NotificationSettings>(mockNotifications);

  const toggleNotification = (key: keyof NotificationSettings) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Delivery Methods */}
        <div>
          <h4 className="font-medium mb-3">Delivery Methods</h4>
          <div className="space-y-3">
            {[
              { key: 'email' as const, label: 'Email Notifications', icon: '📧' },
              { key: 'push' as const, label: 'Push Notifications', icon: '📱' },
              { key: 'sms' as const, label: 'SMS Notifications', icon: '💬' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                <button
                  onClick={() => toggleNotification(item.key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications[item.key] ? 'bg-primary' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications[item.key] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Notification Types */}
        <div>
          <h4 className="font-medium mb-3">Notification Types</h4>
          <div className="space-y-3">
            {[
              { key: 'taskReminders' as const, label: 'Task Reminders', icon: '✅' },
              { key: 'habitReminders' as const, label: 'Habit Reminders', icon: '🔄' },
              { key: 'prayerReminders' as const, label: 'Prayer Reminders', icon: '🕌' },
              { key: 'financeAlerts' as const, label: 'Finance Alerts', icon: '💰' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                <button
                  onClick={() => toggleNotification(item.key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications[item.key] ? 'bg-primary' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications[item.key] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ThemeSettings() {
  const [theme, setTheme] = useState<ThemeSettings>(mockTheme);

  const colors = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Pink', value: '#ec4899' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme Mode */}
        <div>
          <h4 className="font-medium mb-3">Appearance</h4>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'light', label: 'Light', icon: '☀️' },
              { value: 'dark', label: 'Dark', icon: '🌙' },
              { value: 'system', label: 'System', icon: '💻' },
            ].map((mode) => (
              <button
                key={mode.value}
                onClick={() => setTheme(prev => ({ ...prev, mode: mode.value as any }))}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  theme.mode === mode.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:bg-muted'
                }`}
              >
                <div className="text-2xl mb-1">{mode.icon}</div>
                <div className="text-sm font-medium">{mode.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Primary Color */}
        <div>
          <h4 className="font-medium mb-3">Primary Color</h4>
          <div className="grid grid-cols-6 gap-3">
            {colors.map((color) => (
              <button
                key={color.value}
                onClick={() => setTheme(prev => ({ ...prev, primaryColor: color.value }))}
                className={`w-12 h-12 rounded-lg border-2 transition-all ${
                  theme.primaryColor === color.value
                    ? 'border-gray-900 scale-110'
                    : 'border-gray-200 hover:scale-105'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div>
          <h4 className="font-medium mb-3">Font Size</h4>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'small', label: 'Small', size: 'text-sm' },
              { value: 'medium', label: 'Medium', size: 'text-base' },
              { value: 'large', label: 'Large', size: 'text-lg' },
            ].map((size) => (
              <button
                key={size.value}
                onClick={() => setTheme(prev => ({ ...prev, fontSize: size.value as any }))}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  theme.fontSize === size.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:bg-muted'
                }`}
              >
                <div className={`font-medium ${size.size}`}>{size.label}</div>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function IntegrationsSettings() {
  const integrations = [
    { name: 'Google Calendar', status: 'connected', icon: '📅' },
    { name: 'Todoist', status: 'disconnected', icon: '✅' },
    { name: 'Notion', status: 'disconnected', icon: '📝' },
    { name: 'Spotify', status: 'connected', icon: '🎵' },
    { name: 'GitHub', status: 'disconnected', icon: '🐙' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integrations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {integrations.map((integration) => (
            <div key={integration.name} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{integration.icon}</span>
                <div>
                  <div className="font-medium">{integration.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {integration.status === 'connected' ? 'Connected' : 'Not connected'}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={integration.status === 'connected' ? 'default' : 'outline'}>
                  {integration.status === 'connected' ? 'Connected' : 'Disconnected'}
                </Badge>
                <Button
                  variant={integration.status === 'connected' ? 'destructive' : 'default'}
                  size="sm"
                >
                  {integration.status === 'connected' ? 'Disconnect' : 'Connect'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsPanel() {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'theme' | 'integrations'>('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'theme', label: 'Theme', icon: '🎨' },
    { id: 'integrations', label: 'Integrations', icon: '🔗' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'theme':
        return <ThemeSettings />;
      case 'integrations':
        return <IntegrationsSettings />;
      default:
        return <ProfileSettings />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors flex-1 justify-center ${
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
}
