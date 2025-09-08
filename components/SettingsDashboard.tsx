'use client';

import React, { useState } from 'react';
import ProfileSettings from './ProfileSettings';
import ThemeSettings from './ThemeSettings';
import NotificationSettings from './NotificationSettings';
import IntegrationsSettings from './IntegrationsSettings';
import DataExportSettings from './DataExportSettings';
import AccountManagement from './AccountManagement';

export default function SettingsDashboard() {
  const [activeTab, setActiveTab] = useState<'profile' | 'theme' | 'notifications' | 'integrations' | 'export' | 'account'>('profile');

  const tabs = [
    {
      id: 'profile',
      label: 'Profile',
      icon: '👤',
      description: 'Personal information and preferences',
    },
    {
      id: 'theme',
      label: 'Theme',
      icon: '🎨',
      description: 'Appearance and display settings',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: '🔔',
      description: 'Notification preferences and timing',
    },
    {
      id: 'integrations',
      label: 'Integrations',
      icon: '🔗',
      description: 'Connected services and APIs',
    },
    {
      id: 'export',
      label: 'Data Export',
      icon: '📦',
      description: 'Export your data in various formats',
    },
    {
      id: 'account',
      label: 'Account',
      icon: '⚙️',
      description: 'Security and account management',
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings />;
      case 'theme':
        return <ThemeSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'integrations':
        return <IntegrationsSettings />;
      case 'export':
        return <DataExportSettings />;
      case 'account':
        return <AccountManagement />;
      default:
        return <ProfileSettings />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-lg text-gray-600">
            Manage your account, preferences, and integrations
          </p>
        </div>

        {/* Demo Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-center">
            <span className="text-blue-600 mr-2">⚙️</span>
            <div>
              <h4 className="font-medium text-blue-800">Settings Module</h4>
              <p className="text-sm text-blue-700">
                Complete settings management with profile, theme, notifications, integrations, data export, and account management.
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

        {/* Settings Overview */}
        <div className="mt-12 bg-white rounded-lg border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings Module Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-3">👤</div>
              <h4 className="font-semibold text-gray-900 mb-2">Profile Management</h4>
              <p className="text-sm text-gray-600">
                Complete personal profile with avatar upload, timezone, language, and contact information.
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl mb-3">🎨</div>
              <h4 className="font-semibold text-gray-900 mb-2">Theme Customization</h4>
              <p className="text-sm text-gray-600">
                Light, dark, Islamic themes with custom colors, fonts, and display options.
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl mb-3">🔔</div>
              <h4 className="font-semibold text-gray-900 mb-2">Smart Notifications</h4>
              <p className="text-sm text-gray-600">
                Granular notification control for all modules with timing and method preferences.
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl mb-3">🔗</div>
              <h4 className="font-semibold text-gray-900 mb-2">External Integrations</h4>
              <p className="text-sm text-gray-600">
                Connect Google Calendar, Fitbit, banking APIs, and other services with OAuth.
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl mb-3">📦</div>
              <h4 className="font-semibold text-gray-900 mb-2">Data Export</h4>
              <p className="text-sm text-gray-600">
                Export all your data in JSON, CSV, or PDF formats with flexible filtering options.
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl mb-3">⚙️</div>
              <h4 className="font-semibold text-gray-900 mb-2">Account Security</h4>
              <p className="text-sm text-gray-600">
                Password management, 2FA, account deletion with data export options.
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
                <li>• <strong>User Profiles:</strong> Complete personal information management</li>
                <li>• <strong>Theme Settings:</strong> Custom themes with color and font preferences</li>
                <li>• <strong>Notification Preferences:</strong> Granular notification control</li>
                <li>• <strong>Integration Management:</strong> OAuth tokens and sync settings</li>
                <li>• <strong>Data Export Logs:</strong> Export history and file management</li>
                <li>• <strong>Account Deletion:</strong> Scheduled deletion with grace period</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 API Features</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• <strong>Profile API:</strong> Avatar upload, personal info management</li>
                <li>• <strong>Theme API:</strong> Custom theme creation and preview</li>
                <li>• <strong>Notification API:</strong> Test notifications, bulk updates</li>
                <li>• <strong>Integration API:</strong> OAuth flow, sync management</li>
                <li>• <strong>Export API:</strong> Data export with preview and download</li>
                <li>• <strong>Account API:</strong> Security settings, account deletion</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🎨 UI Components</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• <strong>ProfileSettings:</strong> Personal information and avatar</li>
                <li>• <strong>ThemeSettings:</strong> Theme selection and customization</li>
                <li>• <strong>NotificationSettings:</strong> Notification preferences</li>
                <li>• <strong>IntegrationsSettings:</strong> External service connections</li>
                <li>• <strong>DataExportSettings:</strong> Data export management</li>
                <li>• <strong>AccountManagement:</strong> Security and account deletion</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔒 Security Features</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• <strong>Row Level Security:</strong> User data isolation</li>
                <li>• <strong>OAuth Integration:</strong> Secure external connections</li>
                <li>• <strong>Password Management:</strong> Secure password changes</li>
                <li>• <strong>Two-Factor Auth:</strong> Enhanced account security</li>
                <li>• <strong>Data Encryption:</strong> Sensitive data protection</li>
                <li>• <strong>Account Deletion:</strong> GDPR-compliant data removal</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Integration Examples */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-green-900 mb-4">Available Integrations</h2>
          <div className="space-y-4 text-green-800">
            <div>
              <h4 className="font-semibold">📅 Productivity</h4>
              <p className="text-sm">Google Calendar, Notion, Slack, GitHub - sync tasks, events, and work data</p>
            </div>
            <div>
              <h4 className="font-semibold">🏥 Health & Fitness</h4>
              <p className="text-sm">Google Fit, Apple Health, Fitbit - track activity, health metrics, and wellness data</p>
            </div>
            <div>
              <h4 className="font-semibold">💰 Finance</h4>
              <p className="text-sm">Banking APIs - sync transactions, account balances, and financial data</p>
            </div>
            <div>
              <h4 className="font-semibold">🎨 Lifestyle</h4>
              <p className="text-sm">Spotify - track music listening habits and mood correlation</p>
            </div>
          </div>
        </div>

        {/* Data Export Options */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-medium text-blue-900 mb-3">📦 Data Export Capabilities</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-blue-800">
            <div>
              <h5 className="font-semibold mb-2">JSON Export</h5>
              <ul className="text-sm space-y-1">
                <li>• Complete data structure</li>
                <li>• Machine-readable format</li>
                <li>• Preserves relationships</li>
                <li>• Developer-friendly</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-2">CSV Export</h5>
              <ul className="text-sm space-y-1">
                <li>• Spreadsheet compatible</li>
                <li>• Easy data analysis</li>
                <li>• Flat data structure</li>
                <li>• Excel/Sheets ready</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-2">PDF Export</h5>
              <ul className="text-sm space-y-1">
                <li>• Human-readable format</li>
                <li>• Formatted reports</li>
                <li>• Print-friendly</li>
                <li>• Summary views</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-3">🔒 Privacy & Security</h4>
          <div className="text-sm text-gray-700 space-y-2">
            <p><strong>Data Protection:</strong> All personal data is encrypted and protected with row-level security</p>
            <p><strong>OAuth Security:</strong> External integrations use secure OAuth 2.0 authentication</p>
            <p><strong>Account Deletion:</strong> GDPR-compliant account deletion with 30-day grace period</p>
            <p><strong>Data Export:</strong> Complete data portability with secure download links</p>
            <p><strong>Two-Factor Auth:</strong> Optional 2FA for enhanced account security</p>
          </div>
        </div>
      </div>
    </div>
  );
}
