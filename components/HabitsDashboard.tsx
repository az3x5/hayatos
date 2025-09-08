'use client';

import React, { useState, useEffect } from 'react';
import HabitStreakHeatmap from './HabitStreakHeatmap';

interface Habit {
  id: string;
  title: string;
  description?: string;
  cadence: 'daily' | 'weekly' | 'monthly' | 'custom';
  target_value: number;
  target_unit: string;
  color: string;
  icon: string;
  is_active: boolean;
  stats?: {
    current_streak: number;
    longest_streak: number;
    total_completions: number;
    completion_rate: number;
    completed_today: boolean;
    today_value: number;
  };
}

interface HabitLog {
  id: string;
  habit_id: string;
  value: number;
  logged_at: string;
  notes?: string;
  mood_rating?: number;
}

export default function HabitsDashboard() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  // Mock data for demo
  const mockHabits: Habit[] = [
    {
      id: '1',
      title: 'Morning Exercise',
      description: '30 minutes of physical activity',
      cadence: 'daily',
      target_value: 1,
      target_unit: 'session',
      color: '#10B981',
      icon: '🏃‍♂️',
      is_active: true,
      stats: {
        current_streak: 7,
        longest_streak: 15,
        total_completions: 45,
        completion_rate: 85,
        completed_today: true,
        today_value: 1,
      },
    },
    {
      id: '2',
      title: 'Read Books',
      description: 'Read for at least 30 minutes',
      cadence: 'daily',
      target_value: 30,
      target_unit: 'minutes',
      color: '#3B82F6',
      icon: '📚',
      is_active: true,
      stats: {
        current_streak: 3,
        longest_streak: 12,
        total_completions: 28,
        completion_rate: 70,
        completed_today: false,
        today_value: 0,
      },
    },
    {
      id: '3',
      title: 'Drink Water',
      description: 'Stay hydrated throughout the day',
      cadence: 'daily',
      target_value: 8,
      target_unit: 'glasses',
      color: '#06B6D4',
      icon: '💧',
      is_active: true,
      stats: {
        current_streak: 12,
        longest_streak: 20,
        total_completions: 52,
        completion_rate: 92,
        completed_today: false,
        today_value: 5,
      },
    },
  ];

  const mockHeatmapData = Array.from({ length: 365 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (364 - i));
    const completed = Math.random() > 0.3; // 70% completion rate
    return {
      date: date.toISOString().split('T')[0],
      completed,
      value: completed ? 1 : 0,
      target: 1,
    };
  });

  useEffect(() => {
    // In a real app, this would fetch from the API
    setHabits(mockHabits);
    setHeatmapData(mockHeatmapData);
    setLoading(false);
  }, []);

  const handleCheckIn = async (habitId: string, value: number = 1) => {
    setCheckingIn(habitId);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update habit stats
      setHabits(prev => prev.map(habit => {
        if (habit.id === habitId && habit.stats) {
          const newTodayValue = habit.stats.today_value + value;
          const isCompleted = newTodayValue >= habit.target_value;
          
          return {
            ...habit,
            stats: {
              ...habit.stats,
              today_value: newTodayValue,
              completed_today: isCompleted,
              current_streak: isCompleted ? habit.stats.current_streak + 1 : habit.stats.current_streak,
              total_completions: isCompleted ? habit.stats.total_completions + 1 : habit.stats.total_completions,
            },
          };
        }
        return habit;
      }));
    } catch (error) {
      setError('Failed to check in habit');
    } finally {
      setCheckingIn(null);
    }
  };

  const getProgressPercentage = (habit: Habit) => {
    if (!habit.stats) return 0;
    return Math.min((habit.stats.today_value / habit.target_value) * 100, 100);
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-purple-600';
    if (streak >= 14) return 'text-green-600';
    if (streak >= 7) return 'text-blue-600';
    if (streak >= 3) return 'text-yellow-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading habits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Habits Dashboard</h1>
          <p className="text-gray-600">Track your daily habits and build lasting routines</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Add New Habit
        </button>
      </div>

      {/* Demo Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-yellow-600 mr-2">⚠️</span>
          <div>
            <h4 className="font-medium text-yellow-800">Demo Mode</h4>
            <p className="text-sm text-yellow-700">
              This is a demonstration with mock data. In full mode, data would be synced with your database.
            </p>
          </div>
        </div>
      </div>

      {/* Habits Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {habits.map((habit) => (
          <div
            key={habit.id}
            className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedHabit(habit)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{habit.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{habit.title}</h3>
                  <p className="text-sm text-gray-600">{habit.description}</p>
                </div>
              </div>
              <div className={`text-right ${getStreakColor(habit.stats?.current_streak || 0)}`}>
                <div className="text-lg font-bold">{habit.stats?.current_streak || 0}</div>
                <div className="text-xs">day streak</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Today's Progress</span>
                <span>
                  {habit.stats?.today_value || 0}/{habit.target_value} {habit.target_unit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${getProgressPercentage(habit)}%`,
                    backgroundColor: habit.color,
                  }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 text-center text-sm">
              <div>
                <div className="font-semibold text-gray-900">{habit.stats?.longest_streak || 0}</div>
                <div className="text-gray-600">Best Streak</div>
              </div>
              <div>
                <div className="font-semibold text-gray-900">{habit.stats?.completion_rate || 0}%</div>
                <div className="text-gray-600">Success Rate</div>
              </div>
            </div>

            {/* Check-in Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCheckIn(habit.id);
              }}
              disabled={checkingIn === habit.id || habit.stats?.completed_today}
              className={`w-full mt-4 py-2 px-4 rounded-lg font-medium transition-colors ${
                habit.stats?.completed_today
                  ? 'bg-green-100 text-green-800 cursor-not-allowed'
                  : checkingIn === habit.id
                  ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {checkingIn === habit.id ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Checking in...
                </span>
              ) : habit.stats?.completed_today ? (
                '✓ Completed Today'
              ) : (
                'Check In'
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      {selectedHabit && (
        <HabitStreakHeatmap
          data={heatmapData}
          title={`${selectedHabit.title} - Year Overview`}
          className="mt-6"
        />
      )}

      {!selectedHabit && (
        <div className="bg-white rounded-lg border p-6 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Habit</h3>
          <p className="text-gray-600">Click on a habit above to view its detailed streak heatmap</p>
        </div>
      )}
    </div>
  );
}
