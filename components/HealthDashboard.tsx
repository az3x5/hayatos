'use client';

import React, { useState, useEffect } from 'react';
import HealthChart from './HealthChart';

interface HealthLog {
  id: string;
  type: 'sleep' | 'water' | 'exercise' | 'diet' | 'mood' | 'weight' | 'steps';
  value: any;
  start_time: string;
  end_time?: string;
  notes?: string;
  source: string;
}

interface HealthGoal {
  id: string;
  type: string;
  target_value: any;
  period: 'daily' | 'weekly' | 'monthly';
  progress?: {
    current_value: number;
    percentage: number;
    is_achieved: boolean;
  };
}

export default function HealthDashboard() {
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([]);
  const [healthGoals, setHealthGoals] = useState<HealthGoal[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>('sleep');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(true);

  // Mock data for demo
  const mockHealthLogs: HealthLog[] = [
    // Sleep data
    ...Array.from({ length: 30 }, (_, i) => ({
      id: `sleep-${i}`,
      type: 'sleep' as const,
      value: { hours: 6.5 + Math.random() * 2, quality: Math.floor(Math.random() * 5) + 1 },
      start_time: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      source: 'manual',
    })),
    // Water data
    ...Array.from({ length: 30 }, (_, i) => ({
      id: `water-${i}`,
      type: 'water' as const,
      value: { amount: 1500 + Math.random() * 1000, unit: 'ml' },
      start_time: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      source: 'manual',
    })),
    // Exercise data
    ...Array.from({ length: 20 }, (_, i) => ({
      id: `exercise-${i}`,
      type: 'exercise' as const,
      value: { type: 'running', duration: 20 + Math.random() * 40, calories: 200 + Math.random() * 300 },
      start_time: new Date(Date.now() - i * 24 * 60 * 60 * 1000 * 1.5).toISOString(),
      source: 'manual',
    })),
    // Weight data
    ...Array.from({ length: 15 }, (_, i) => ({
      id: `weight-${i}`,
      type: 'weight' as const,
      value: { weight: 70 + Math.random() * 4 - 2, unit: 'kg' },
      start_time: new Date(Date.now() - i * 24 * 60 * 60 * 1000 * 2).toISOString(),
      source: 'manual',
    })),
    // Steps data
    ...Array.from({ length: 30 }, (_, i) => ({
      id: `steps-${i}`,
      type: 'steps' as const,
      value: { count: 5000 + Math.random() * 8000 },
      start_time: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      source: 'google_fit',
    })),
  ];

  const mockHealthGoals: HealthGoal[] = [
    {
      id: '1',
      type: 'sleep',
      target_value: { hours: 8 },
      period: 'daily',
      progress: { current_value: 7.2, percentage: 90, is_achieved: false },
    },
    {
      id: '2',
      type: 'water',
      target_value: { amount: 2000, unit: 'ml' },
      period: 'daily',
      progress: { current_value: 1800, percentage: 90, is_achieved: false },
    },
    {
      id: '3',
      type: 'exercise',
      target_value: { duration: 150 },
      period: 'weekly',
      progress: { current_value: 120, percentage: 80, is_achieved: false },
    },
    {
      id: '4',
      type: 'steps',
      target_value: { count: 10000 },
      period: 'daily',
      progress: { current_value: 8500, percentage: 85, is_achieved: false },
    },
  ];

  useEffect(() => {
    // In a real app, this would fetch from the API
    setHealthLogs(mockHealthLogs);
    setHealthGoals(mockHealthGoals);
    setLoading(false);
  }, []);

  const getChartData = (type: string) => {
    const logs = healthLogs
      .filter(log => log.type === type)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    return logs.map(log => {
      let value = 0;
      switch (type) {
        case 'sleep':
          value = log.value.hours;
          break;
        case 'water':
          value = log.value.amount;
          break;
        case 'exercise':
          value = log.value.duration;
          break;
        case 'weight':
          value = log.value.weight;
          break;
        case 'steps':
          value = log.value.count;
          break;
        default:
          value = log.value.value || 0;
      }

      return {
        date: log.start_time.split('T')[0],
        value,
        label: log.notes,
      };
    });
  };

  const getMetricConfig = (type: string) => {
    const configs = {
      sleep: { title: 'Sleep Hours', unit: 'h', color: '#8B5CF6', goal: 8 },
      water: { title: 'Water Intake', unit: 'ml', color: '#06B6D4', goal: 2000 },
      exercise: { title: 'Exercise Duration', unit: 'min', color: '#10B981', goal: 30 },
      weight: { title: 'Weight', unit: 'kg', color: '#F59E0B', goal: undefined },
      steps: { title: 'Daily Steps', unit: '', color: '#EF4444', goal: 10000 },
      mood: { title: 'Mood Rating', unit: '/5', color: '#EC4899', goal: 4 },
    };
    return configs[type as keyof typeof configs] || configs.sleep;
  };

  const metrics = ['sleep', 'water', 'exercise', 'weight', 'steps', 'mood'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading health data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Health Dashboard</h1>
          <p className="text-gray-600">Track your health metrics and achieve your wellness goals</p>
        </div>
        <div className="flex space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Log Health Data
          </button>
        </div>
      </div>

      {/* Demo Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-yellow-600 mr-2">⚠️</span>
          <div>
            <h4 className="font-medium text-yellow-800">Demo Mode</h4>
            <p className="text-sm text-yellow-700">
              This is a demonstration with mock health data. In full mode, you can sync with Google Fit and Apple Health.
            </p>
          </div>
        </div>
      </div>

      {/* Health Goals Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {healthGoals.map((goal) => {
          const config = getMetricConfig(goal.type);
          return (
            <div key={goal.id} className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{config.title}</h3>
                <span className={`text-sm px-2 py-1 rounded ${
                  goal.progress?.is_achieved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {goal.period}
                </span>
              </div>
              
              <div className="mb-3">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{goal.progress?.percentage || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${goal.progress?.percentage || 0}%`,
                      backgroundColor: config.color,
                    }}
                  />
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                Current: <span className="font-medium">{goal.progress?.current_value || 0}{config.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Metric Selection */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-medium text-gray-900 mb-4">Health Metrics</h3>
        <div className="flex flex-wrap gap-2">
          {metrics.map((metric) => {
            const config = getMetricConfig(metric);
            return (
              <button
                key={metric}
                onClick={() => setSelectedMetric(metric)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedMetric === metric
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={{
                  backgroundColor: selectedMetric === metric ? config.color : undefined,
                }}
              >
                {config.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      <HealthChart
        data={getChartData(selectedMetric)}
        title={getMetricConfig(selectedMetric).title}
        type="line"
        color={getMetricConfig(selectedMetric).color}
        unit={getMetricConfig(selectedMetric).unit}
        goal={getMetricConfig(selectedMetric).goal}
      />

      {/* Recent Logs */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Health Logs</h3>
        <div className="space-y-3">
          {healthLogs
            .filter(log => log.type === selectedMetric)
            .slice(0, 5)
            .map((log) => {
              const config = getMetricConfig(log.type);
              let displayValue = '';
              
              switch (log.type) {
                case 'sleep':
                  displayValue = `${log.value.hours}h (Quality: ${log.value.quality}/5)`;
                  break;
                case 'water':
                  displayValue = `${log.value.amount}${log.value.unit}`;
                  break;
                case 'exercise':
                  displayValue = `${log.value.type} - ${log.value.duration}min`;
                  break;
                case 'weight':
                  displayValue = `${log.value.weight}${log.value.unit}`;
                  break;
                case 'steps':
                  displayValue = `${log.value.count.toLocaleString()} steps`;
                  break;
                default:
                  displayValue = JSON.stringify(log.value);
              }

              return (
                <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                    <div>
                      <div className="font-medium text-gray-900">{displayValue}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(log.start_time).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 capitalize">
                    {log.source.replace('_', ' ')}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
