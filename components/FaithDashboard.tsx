'use client';

import React, { useState, useEffect } from 'react';

interface DashboardSummary {
  today_prayers_completed: number;
  today_prayers_total: number;
  current_salat_streak: number;
  quran_sessions_this_week: number;
  quran_minutes_this_week: number;
  bookmarks_count: number;
  last_reading_session?: string;
}

interface SalatStatus {
  prayer_name: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  status: 'completed' | 'missed' | 'qada';
  is_congregation: boolean;
  logged_at?: string;
}

interface QuranSession {
  id: string;
  surah_id: number;
  start_verse: number;
  end_verse: number;
  duration_minutes?: number;
  session_date: string;
  created_at: string;
  quran_surahs: {
    name_arabic: string;
    name_english: string;
    name_dhivehi?: string;
  };
}

interface QuranProgress {
  total_sessions: number;
  total_minutes: number;
  unique_surahs: number;
  verses_read: number;
  avg_session_duration: number;
  reading_streak: number;
}

interface SalatStreak {
  current_streak: number;
  longest_streak: number;
  total_prayers: number;
  completion_rate: number;
}

interface AzkarReminder {
  id: string;
  reminder_time: string;
  is_enabled: boolean;
  azkar: {
    title_english: string;
    type: string;
  };
}

export default function FaithDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [todaySalat, setTodaySalat] = useState<SalatStatus[]>([]);
  const [recentSessions, setRecentSessions] = useState<QuranSession[]>([]);
  const [quranProgress, setQuranProgress] = useState<QuranProgress | null>(null);
  const [salatStreak, setSalatStreak] = useState<SalatStreak | null>(null);
  const [azkarReminders, setAzkarReminders] = useState<AzkarReminder[]>([]);
  const [loading, setLoading] = useState(true);

  const prayerNames = {
    fajr: { arabic: 'الفجر', english: 'Fajr' },
    dhuhr: { arabic: 'الظهر', english: 'Dhuhr' },
    asr: { arabic: 'العصر', english: 'Asr' },
    maghrib: { arabic: 'المغرب', english: 'Maghrib' },
    isha: { arabic: 'العشاء', english: 'Isha' },
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/faith/dashboard');
      const result = await response.json();

      if (response.ok) {
        const data = result.data;
        setSummary(data.summary);
        setTodaySalat(data.today_salat || []);
        setRecentSessions(data.recent_quran_sessions || []);
        setQuranProgress(data.quran_progress);
        setSalatStreak(data.salat_streak);
        setAzkarReminders(data.azkar_reminders || []);
      } else {
        console.error('Error fetching dashboard data:', result.error);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickLogPrayer = async (prayerName: string, status: 'completed' | 'missed' = 'completed') => {
    try {
      const response = await fetch('/api/faith/dashboard?action=quick_salat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prayer_name: prayerName,
          status: status,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        await fetchDashboardData();
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
        return 'text-green-600 bg-green-50';
      case 'missed':
        return 'text-red-600 bg-red-50';
      case 'qada':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatTime = (timeStr: string) => {
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading faith dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Faith Dashboard</h2>
          <p className="text-gray-600">Track your spiritual journey and daily worship</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">
            {summary?.today_prayers_completed || 0}/{summary?.today_prayers_total || 5}
          </div>
          <div className="text-sm text-gray-600">Today's Prayers</div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{salatStreak?.current_streak || 0}</div>
          <div className="text-sm text-gray-600">Prayer Streak</div>
          <div className="text-xs text-gray-500">days</div>
        </div>

        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{quranProgress?.reading_streak || 0}</div>
          <div className="text-sm text-gray-600">Quran Streak</div>
          <div className="text-xs text-gray-500">days</div>
        </div>

        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{summary?.quran_sessions_this_week || 0}</div>
          <div className="text-sm text-gray-600">Sessions</div>
          <div className="text-xs text-gray-500">this week</div>
        </div>

        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{summary?.quran_minutes_this_week || 0}</div>
          <div className="text-sm text-gray-600">Minutes</div>
          <div className="text-xs text-gray-500">reading</div>
        </div>
      </div>

      {/* Today's Prayers */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Prayers</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {Object.entries(prayerNames).map(([key, prayer]) => {
            const status = todaySalat.find(p => p.prayer_name === key);
            const currentStatus = status?.status || 'missed';
            
            return (
              <div key={key} className={`p-3 rounded-lg ${getStatusColor(currentStatus)}`}>
                <div className="text-center">
                  <div className="text-2xl mb-1">{getStatusIcon(currentStatus)}</div>
                  <div className="font-medium text-sm">{prayer.english}</div>
                  <div className="text-xs" dir="rtl">{prayer.arabic}</div>
                  {status?.is_congregation && (
                    <div className="text-xs mt-1 px-1 bg-blue-100 text-blue-800 rounded">
                      Congregation
                    </div>
                  )}
                  {currentStatus === 'missed' && (
                    <button
                      onClick={() => quickLogPrayer(key, 'completed')}
                      className="mt-2 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      Mark Done
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quran Sessions */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Quran Reading</h3>
          
          {recentSessions.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <div className="text-2xl mb-2">📖</div>
              <p className="text-sm">No recent reading sessions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSessions.slice(0, 3).map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">
                      {session.quran_surahs.name_english}
                    </div>
                    <div className="text-sm text-gray-600">
                      Verses {session.start_verse}-{session.end_verse}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(session.session_date)}
                    </div>
                  </div>
                  <div className="text-right">
                    {session.duration_minutes && (
                      <div className="text-sm font-medium text-green-600">
                        {session.duration_minutes} min
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Azkar Reminders */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Azkar Reminders</h3>
          
          {azkarReminders.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <div className="text-2xl mb-2">🔔</div>
              <p className="text-sm">No reminders set up</p>
            </div>
          ) : (
            <div className="space-y-3">
              {azkarReminders.filter(r => r.is_enabled).slice(0, 3).map((reminder) => (
                <div key={reminder.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">
                      {reminder.azkar.title_english}
                    </div>
                    <div className="text-sm text-gray-600 capitalize">
                      {reminder.azkar.type.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-blue-600">
                    {formatTime(reminder.reminder_time)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Progress Overview */}
      {(quranProgress || salatStreak) && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Overview</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Salat Progress */}
            {salatStreak && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Prayer Statistics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Completion Rate</span>
                    <span className="text-sm font-medium">{salatStreak.completion_rate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${salatStreak.completion_rate}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Longest Streak: {salatStreak.longest_streak} days</span>
                    <span>Total: {salatStreak.total_prayers} prayers</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quran Progress */}
            {quranProgress && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Quran Reading</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Unique Surahs</span>
                    <span className="text-sm font-medium">{quranProgress.unique_surahs}/114</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(quranProgress.unique_surahs / 114) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Avg Session: {quranProgress.avg_session_duration.toFixed(1)} min</span>
                    <span>Verses Read: {quranProgress.verses_read}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-3">🌟 Quick Actions</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="p-3 bg-white rounded-lg border hover:bg-gray-50 transition-colors text-center">
            <div className="text-2xl mb-1">📖</div>
            <div className="text-sm font-medium">Read Quran</div>
          </button>
          <button className="p-3 bg-white rounded-lg border hover:bg-gray-50 transition-colors text-center">
            <div className="text-2xl mb-1">📜</div>
            <div className="text-sm font-medium">Browse Hadith</div>
          </button>
          <button className="p-3 bg-white rounded-lg border hover:bg-gray-50 transition-colors text-center">
            <div className="text-2xl mb-1">🤲</div>
            <div className="text-sm font-medium">Find Duas</div>
          </button>
          <button className="p-3 bg-white rounded-lg border hover:bg-gray-50 transition-colors text-center">
            <div className="text-2xl mb-1">🔔</div>
            <div className="text-sm font-medium">Set Reminders</div>
          </button>
        </div>
      </div>

      {/* Islamic Calendar Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">🌙 Today's Islamic Date</h4>
        <p className="text-sm text-blue-800">
          {new Date().toLocaleDateString('en-US-u-ca-islamic', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>
    </div>
  );
}
