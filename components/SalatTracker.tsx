'use client';

import React, { useState, useEffect } from 'react';

interface SalatLog {
  id: string;
  prayer_name: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  prayer_date: string;
  status: 'completed' | 'missed' | 'qada';
  is_congregation: boolean;
  logged_at: string;
  notes?: string;
}

interface SalatStatus {
  prayer_name: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  status: 'completed' | 'missed' | 'qada';
  is_congregation: boolean;
  logged_at?: string;
}

interface SalatStreak {
  current_streak: number;
  longest_streak: number;
  total_prayers: number;
  completion_rate: number;
}

interface MonthlyStat {
  prayer_name: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  total_days: number;
  completed_count: number;
  missed_count: number;
  qada_count: number;
  completion_rate: number;
  congregation_count: number;
}

export default function SalatTracker() {
  const [todayStatus, setTodayStatus] = useState<SalatStatus[]>([]);
  const [streak, setStreak] = useState<SalatStreak | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const prayerNames = {
    fajr: { arabic: 'الفجر', english: 'Fajr', time: '05:30' },
    dhuhr: { arabic: 'الظهر', english: 'Dhuhr', time: '12:30' },
    asr: { arabic: 'العصر', english: 'Asr', time: '15:45' },
    maghrib: { arabic: 'المغرب', english: 'Maghrib', time: '18:15' },
    isha: { arabic: 'العشاء', english: 'Isha', time: '19:45' },
  };

  useEffect(() => {
    fetchTodayStatus();
    fetchStatistics();
  }, [selectedDate]);

  const fetchTodayStatus = async () => {
    try {
      const response = await fetch(`/api/faith/salat?date=${selectedDate}`);
      const result = await response.json();

      if (response.ok) {
        setTodayStatus(result.data || []);
      } else {
        console.error('Error fetching today status:', result.error);
      }
    } catch (error) {
      console.error('Error fetching today status:', error);
    }
  };

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/faith/salat?include_stats=true');
      const result = await response.json();

      if (response.ok) {
        setStreak(result.statistics?.streak || null);
        setMonthlyStats(result.statistics?.monthly || []);
      } else {
        console.error('Error fetching statistics:', result.error);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const logPrayer = async (prayerName: string, status: 'completed' | 'missed' | 'qada', isCongregation = false) => {
    try {
      const response = await fetch('/api/faith/salat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prayer_name: prayerName,
          prayer_date: selectedDate,
          status: status,
          is_congregation: isCongregation,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        await fetchTodayStatus();
        await fetchStatistics();
      } else {
        console.error('Error logging prayer:', result.error);
        alert('Failed to log prayer: ' + result.error);
      }
    } catch (error) {
      console.error('Error logging prayer:', error);
      alert('Failed to log prayer');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'missed':
        return '❌';
      case 'qada':
        return '🔄';
      default:
        return '⏳';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'missed':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'qada':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatTime = (timeStr: string) => {
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const completedToday = todayStatus.filter(p => p.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Salat Tracker</h2>
          <p className="text-gray-600">Track your daily prayers and maintain your spiritual routine</p>
        </div>
        <div className="flex items-center space-x-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {isToday && (
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">{completedToday}/5</div>
              <div className="text-sm text-gray-600">Today</div>
            </div>
          )}
        </div>
      </div>

      {/* Streak Information */}
      {streak && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{streak.current_streak}</div>
            <div className="text-sm text-gray-600">Current Streak</div>
            <div className="text-xs text-gray-500">days</div>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{streak.longest_streak}</div>
            <div className="text-sm text-gray-600">Longest Streak</div>
            <div className="text-xs text-gray-500">days</div>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{streak.total_prayers}</div>
            <div className="text-sm text-gray-600">Total Prayers</div>
            <div className="text-xs text-gray-500">this year</div>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{streak.completion_rate.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Completion Rate</div>
            <div className="text-xs text-gray-500">this year</div>
          </div>
        </div>
      )}

      {/* Daily Prayer Status */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {isToday ? 'Today\'s Prayers' : `Prayers for ${new Date(selectedDate).toLocaleDateString()}`}
        </h3>
        
        <div className="space-y-4">
          {Object.entries(prayerNames).map(([key, prayer]) => {
            const status = todayStatus.find(p => p.prayer_name === key);
            const currentStatus = status?.status || 'missed';
            
            return (
              <div key={key} className={`p-4 rounded-lg border ${getStatusColor(currentStatus)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">{getStatusIcon(currentStatus)}</div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {prayer.arabic} - {prayer.english}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatTime(prayer.time)}
                        {status?.is_congregation && (
                          <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            Congregation
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => logPrayer(key, 'completed', false)}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      ✓ Completed
                    </button>
                    <button
                      onClick={() => logPrayer(key, 'completed', true)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      🕌 Congregation
                    </button>
                    <button
                      onClick={() => logPrayer(key, 'missed')}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      ✗ Missed
                    </button>
                    <button
                      onClick={() => logPrayer(key, 'qada')}
                      className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                    >
                      🔄 Qada
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Statistics */}
      {monthlyStats.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">This Month's Statistics</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Prayer</th>
                  <th className="text-center py-2">Completed</th>
                  <th className="text-center py-2">Missed</th>
                  <th className="text-center py-2">Qada</th>
                  <th className="text-center py-2">Congregation</th>
                  <th className="text-center py-2">Rate</th>
                </tr>
              </thead>
              <tbody>
                {monthlyStats.map((stat) => (
                  <tr key={stat.prayer_name} className="border-b">
                    <td className="py-2 font-medium">
                      {prayerNames[stat.prayer_name].arabic} - {prayerNames[stat.prayer_name].english}
                    </td>
                    <td className="text-center py-2 text-green-600">{stat.completed_count}</td>
                    <td className="text-center py-2 text-red-600">{stat.missed_count}</td>
                    <td className="text-center py-2 text-yellow-600">{stat.qada_count}</td>
                    <td className="text-center py-2 text-blue-600">{stat.congregation_count}</td>
                    <td className="text-center py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        stat.completion_rate >= 80 ? 'bg-green-100 text-green-800' :
                        stat.completion_rate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {stat.completion_rate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Prayer Times Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">📍 Prayer Times</h4>
        <p className="text-sm text-blue-800 mb-3">
          Times shown are approximate. Please check your local mosque or Islamic center for accurate prayer times.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
          {Object.entries(prayerNames).map(([key, prayer]) => (
            <div key={key} className="text-center">
              <div className="font-medium text-blue-900">{prayer.english}</div>
              <div className="text-blue-700">{formatTime(prayer.time)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-2">💡 Tips for Consistent Prayer</h4>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Set prayer time notifications on your phone</li>
          <li>• Try to pray in congregation when possible</li>
          <li>• Make up missed prayers (Qada) as soon as you can</li>
          <li>• Keep a prayer rug in your workspace for easy access</li>
          <li>• Use prayer apps to find accurate local prayer times</li>
        </ul>
      </div>
    </div>
  );
}
