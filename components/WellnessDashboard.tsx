'use client';

import React, { useState, useEffect } from 'react';
import HabitsDashboard from './HabitsDashboard';
import HealthDashboard from './HealthDashboard';
import HabitStreakHeatmap from './HabitStreakHeatmap';
import HealthChart from './HealthChart';

interface WellnessStats {
  habits: {
    total: number;
    active: number;
    completed_today: number;
    avg_streak: number;
  };
  health: {
    logs_this_week: number;
    last_log: string | null;
    goals_achieved: number;
    total_goals: number;
  };
  integrations: {
    google_fit: boolean;
    apple_health: boolean;
  };
}

export default function WellnessDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'habits' | 'health' | 'integrations'>('overview');
  const [stats, setStats] = useState<WellnessStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock data for demo
  const mockStats: WellnessStats = {
    habits: {
      total: 5,
      active: 4,
      completed_today: 2,
      avg_streak: 8.5,
    },
    health: {
      logs_this_week: 15,
      last_log: new Date().toISOString(),
      goals_achieved: 3,
      total_goals: 4,
    },
    integrations: {
      google_fit: false,
      apple_health: false,
    },
  };

  const mockHeatmapData = Array.from({ length: 365 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (364 - i));
    const completed = Math.random() > 0.25; // 75% completion rate
    return {
      date: date.toISOString().split('T')[0],
      completed,
      value: completed ? 1 : 0,
      target: 1,
    };
  });

  const mockHealthData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.toISOString().split('T')[0],
      value: 6.5 + Math.random() * 2, // Sleep hours between 6.5-8.5
    };
  });

  useEffect(() => {
    // In a real app, this would fetch from the API
    setStats(mockStats);
    setLoading(false);
  }, []);

  const handleIntegrationToggle = async (provider: 'google_fit' | 'apple_health') => {
    // In a real app, this would handle the OAuth flow
    setStats(prev => prev ? {
      ...prev,
      integrations: {
        ...prev.integrations,
        [provider]: !prev.integrations[provider],
      },
    } : null);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Habits</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.habits.active || 0}</p>
            </div>
            <div className="text-3xl">🎯</div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {stats?.habits.completed_today || 0} completed today
          </p>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Streak</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.habits.avg_streak || 0} days</p>
            </div>
            <div className="text-3xl">🔥</div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Across all habits
          </p>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Health Logs</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.health.logs_this_week || 0}</p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            This week
          </p>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Goals Achieved</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.health.goals_achieved || 0}/{stats?.health.total_goals || 0}
              </p>
            </div>
            <div className="text-3xl">🏆</div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            This period
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HabitStreakHeatmap
          data={mockHeatmapData}
          title="Habit Completion Overview"
        />
        <HealthChart
          data={mockHealthData}
          title="Sleep Trend"
          type="line"
          color="#8B5CF6"
          unit="h"
          goal={8}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center">
            <div className="text-2xl mb-2">✅</div>
            <div className="text-sm font-medium">Check In Habit</div>
          </button>
          <button className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center">
            <div className="text-2xl mb-2">📝</div>
            <div className="text-sm font-medium">Log Health Data</div>
          </button>
          <button className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center">
            <div className="text-2xl mb-2">🎯</div>
            <div className="text-sm font-medium">Set New Goal</div>
          </button>
          <button className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center">
            <div className="text-2xl mb-2">🔄</div>
            <div className="text-sm font-medium">Sync Data</div>
          </button>
        </div>
      </div>
    </div>
  );

  const renderIntegrations = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Health App Integrations</h2>
        <p className="text-gray-600 mb-6">
          Connect your health apps to automatically sync your fitness and wellness data.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Google Fit Integration */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏃‍♂️</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Google Fit</h3>
                <p className="text-sm text-gray-600">Sync steps, calories, and workouts</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm ${
              stats?.integrations.google_fit 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {stats?.integrations.google_fit ? 'Connected' : 'Not Connected'}
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              <strong>Available Data:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Daily step count</li>
                <li>Calories burned</li>
                <li>Heart rate data</li>
                <li>Workout sessions</li>
              </ul>
            </div>

            <button
              onClick={() => handleIntegrationToggle('google_fit')}
              className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                stats?.integrations.google_fit
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {stats?.integrations.google_fit ? 'Disconnect' : 'Connect Google Fit'}
            </button>
          </div>
        </div>

        {/* Apple Health Integration */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">❤️</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Apple Health</h3>
                <p className="text-sm text-gray-600">Comprehensive health metrics</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm ${
              stats?.integrations.apple_health 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {stats?.integrations.apple_health ? 'Connected' : 'Not Connected'}
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              <strong>Available Data:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Sleep analysis</li>
                <li>Heart rate & blood pressure</li>
                <li>Weight & body measurements</li>
                <li>Nutrition data</li>
              </ul>
            </div>

            <button
              onClick={() => handleIntegrationToggle('apple_health')}
              className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                stats?.integrations.apple_health
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {stats?.integrations.apple_health ? 'Disconnect' : 'Connect Apple Health'}
            </button>
          </div>
        </div>
      </div>

      {/* Integration Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-medium text-blue-900 mb-2">How to Connect</h4>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>Google Fit:</strong> Click connect and authorize HayatOS to access your Google Fit data.</p>
          <p><strong>Apple Health:</strong> Use our mobile app to sync data directly from Apple Health.</p>
          <p><strong>Privacy:</strong> Your health data is encrypted and only used to provide insights within HayatOS.</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading wellness dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wellness Dashboard</h1>
          <p className="text-gray-600">Track your habits, health, and wellness journey</p>
        </div>
      </div>

      {/* Demo Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-yellow-600 mr-2">⚠️</span>
          <div>
            <h4 className="font-medium text-yellow-800">Demo Mode</h4>
            <p className="text-sm text-yellow-700">
              This is a demonstration with mock data. In full mode, all features would be fully functional with real data.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'habits', label: 'Habits', icon: '🎯' },
            { id: 'health', label: 'Health', icon: '❤️' },
            { id: 'integrations', label: 'Integrations', icon: '🔗' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'habits' && <HabitsDashboard />}
        {activeTab === 'health' && <HealthDashboard />}
        {activeTab === 'integrations' && renderIntegrations()}
      </div>
    </div>
  );
}
