import { useState, useEffect, useCallback } from 'react';

// Types
interface Habit {
  id: string;
  title: string;
  description?: string;
  cadence: 'daily' | 'weekly' | 'monthly' | 'custom';
  cadence_config: Record<string, any>;
  target_value: number;
  target_unit: string;
  color: string;
  icon: string;
  is_active: boolean;
  reminders: any[];
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

interface HealthLog {
  id: string;
  type: 'sleep' | 'water' | 'exercise' | 'diet' | 'mood' | 'weight' | 'blood_pressure' | 'heart_rate' | 'steps' | 'calories';
  value: Record<string, any>;
  start_time: string;
  end_time?: string;
  notes?: string;
  source: string;
}

interface HealthGoal {
  id: string;
  type: string;
  target_value: Record<string, any>;
  period: 'daily' | 'weekly' | 'monthly';
  is_active: boolean;
  progress?: {
    current_value: number;
    percentage: number;
    is_achieved: boolean;
  };
}

// Habits Hook
export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHabits = useCallback(async (includeStats = false) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (includeStats) params.append('include_stats', 'true');

      const response = await fetch(`/api/habits?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch habits');
      }

      setHabits(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch habits');
      console.error('Error fetching habits:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createHabit = useCallback(async (habitData: Partial<Habit>) => {
    try {
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(habitData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create habit');
      }

      setHabits(prev => [result.data, ...prev]);
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create habit');
      console.error('Error creating habit:', err);
      return null;
    }
  }, []);

  const updateHabit = useCallback(async (id: string, updates: Partial<Habit>) => {
    try {
      const response = await fetch(`/api/habits/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update habit');
      }

      setHabits(prev => prev.map(habit => habit.id === id ? result.data : habit));
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update habit');
      console.error('Error updating habit:', err);
      return null;
    }
  }, []);

  const deleteHabit = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/habits/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete habit');
      }

      setHabits(prev => prev.filter(habit => habit.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete habit');
      console.error('Error deleting habit:', err);
      return false;
    }
  }, []);

  const checkInHabit = useCallback(async (habitId: string, value = 1, notes?: string, moodRating?: number) => {
    try {
      const response = await fetch(`/api/habits/${habitId}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value, notes, mood_rating: moodRating }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to check in habit');
      }

      // Update habit stats if available
      setHabits(prev => prev.map(habit => {
        if (habit.id === habitId && habit.stats) {
          return {
            ...habit,
            stats: {
              ...habit.stats,
              today_value: habit.stats.today_value + value,
              completed_today: (habit.stats.today_value + value) >= habit.target_value,
            },
          };
        }
        return habit;
      }));

      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check in habit');
      console.error('Error checking in habit:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchHabits(true);
  }, [fetchHabits]);

  return {
    habits,
    loading,
    error,
    fetchHabits,
    createHabit,
    updateHabit,
    deleteHabit,
    checkInHabit,
  };
}

// Health Logs Hook
export function useHealthLogs() {
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHealthLogs = useCallback(async (filters?: {
    type?: string;
    start_date?: string;
    end_date?: string;
    include_trends?: boolean;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await fetch(`/api/health?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch health logs');
      }

      setHealthLogs(result.data || []);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health logs');
      console.error('Error fetching health logs:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createHealthLog = useCallback(async (logData: Partial<HealthLog>) => {
    try {
      const response = await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create health log');
      }

      setHealthLogs(prev => [result.data, ...prev]);
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create health log');
      console.error('Error creating health log:', err);
      return null;
    }
  }, []);

  return {
    healthLogs,
    loading,
    error,
    fetchHealthLogs,
    createHealthLog,
  };
}

// Health Goals Hook
export function useHealthGoals() {
  const [healthGoals, setHealthGoals] = useState<HealthGoal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHealthGoals = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/health/goals');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch health goals');
      }

      setHealthGoals(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health goals');
      console.error('Error fetching health goals:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createHealthGoal = useCallback(async (goalData: Partial<HealthGoal>) => {
    try {
      const response = await fetch('/api/health/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create health goal');
      }

      setHealthGoals(prev => [result.data, ...prev]);
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create health goal');
      console.error('Error creating health goal:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchHealthGoals();
  }, [fetchHealthGoals]);

  return {
    healthGoals,
    loading,
    error,
    fetchHealthGoals,
    createHealthGoal,
  };
}

// Integrations Hook
export function useHealthIntegrations() {
  const [integrations, setIntegrations] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkIntegrationStatus = useCallback(async (provider: 'google_fit' | 'apple_health') => {
    try {
      const response = await fetch(`/api/integrations/${provider.replace('_', '-')}`);
      const result = await response.json();

      if (response.ok) {
        setIntegrations(prev => ({
          ...prev,
          [provider]: result.data,
        }));
        return result.data;
      }
    } catch (err) {
      console.error(`Error checking ${provider} status:`, err);
    }
    return null;
  }, []);

  const connectIntegration = useCallback(async (provider: 'google_fit' | 'apple_health', data: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/integrations/${provider.replace('_', '-')}?action=connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to connect ${provider}`);
      }

      setIntegrations(prev => ({
        ...prev,
        [provider]: result.data,
      }));

      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to connect ${provider}`);
      console.error(`Error connecting ${provider}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const syncIntegration = useCallback(async (provider: 'google_fit' | 'apple_health', data?: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/integrations/${provider.replace('_', '-')}?action=sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data || {}),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to sync ${provider}`);
      }

      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to sync ${provider}`);
      console.error(`Error syncing ${provider}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnectIntegration = useCallback(async (provider: 'google_fit' | 'apple_health') => {
    try {
      const response = await fetch(`/api/integrations/${provider.replace('_', '-')}?action=disconnect`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to disconnect ${provider}`);
      }

      setIntegrations(prev => ({
        ...prev,
        [provider]: null,
      }));

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to disconnect ${provider}`);
      console.error(`Error disconnecting ${provider}:`, err);
      return false;
    }
  }, []);

  useEffect(() => {
    checkIntegrationStatus('google_fit');
    checkIntegrationStatus('apple_health');
  }, [checkIntegrationStatus]);

  return {
    integrations,
    loading,
    error,
    checkIntegrationStatus,
    connectIntegration,
    syncIntegration,
    disconnectIntegration,
  };
}
