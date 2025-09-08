import { useState, useEffect, useCallback } from 'react';

// Types
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

interface Surah {
  id: number;
  name_arabic: string;
  name_english: string;
  name_dhivehi?: string;
  revelation_place: string;
  verse_count: number;
  order_number: number;
}

interface Verse {
  id: string;
  verse_number: number;
  text_arabic: string;
  text_english?: string;
  text_dhivehi?: string;
  transliteration?: string;
  audio_url?: string;
  quran_surahs?: {
    name_arabic: string;
    name_english: string;
    name_dhivehi?: string;
  };
}

interface Hadith {
  id: string;
  collection_name: string;
  hadith_number: number;
  text_arabic: string;
  text_english?: string;
  text_dhivehi?: string;
  narrator: string;
  grade: 'sahih' | 'hasan' | 'daif' | 'mawdu';
  category: string;
  reference: string;
}

interface Dua {
  id: string;
  title_arabic: string;
  title_english: string;
  title_dhivehi?: string;
  text_arabic: string;
  text_english?: string;
  text_dhivehi?: string;
  transliteration?: string;
  category: string;
  occasion?: string;
  reference?: string;
  audio_url?: string;
}

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
  azkar: {
    title_english: string;
    type: string;
  };
}

// Salat Hook
export function useSalat() {
  const [todayStatus, setTodayStatus] = useState<SalatStatus[]>([]);
  const [streak, setStreak] = useState<SalatStreak | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTodayStatus = useCallback(async (date?: string) => {
    setLoading(true);
    setError(null);

    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/faith/salat?date=${targetDate}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch salat status');
      }

      setTodayStatus(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch salat status');
      console.error('Error fetching salat status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStreak = useCallback(async () => {
    try {
      const response = await fetch('/api/faith/salat?include_stats=true');
      const result = await response.json();

      if (response.ok) {
        setStreak(result.statistics?.streak || null);
      }
    } catch (err) {
      console.error('Error fetching salat streak:', err);
    }
  }, []);

  const logPrayer = useCallback(async (
    prayerName: string,
    status: 'completed' | 'missed' | 'qada',
    isCongregation = false,
    date?: string
  ) => {
    try {
      const response = await fetch('/api/faith/salat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prayer_name: prayerName,
          prayer_date: date,
          status: status,
          is_congregation: isCongregation,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to log prayer');
      }

      // Refresh data
      await fetchTodayStatus(date);
      await fetchStreak();

      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log prayer');
      console.error('Error logging prayer:', err);
      return null;
    }
  }, [fetchTodayStatus, fetchStreak]);

  useEffect(() => {
    fetchTodayStatus();
    fetchStreak();
  }, [fetchTodayStatus, fetchStreak]);

  return {
    todayStatus,
    streak,
    loading,
    error,
    fetchTodayStatus,
    logPrayer,
  };
}

// Quran Hook
export function useQuran() {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 0,
  });

  const fetchSurahs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/faith/quran?action=surahs');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch surahs');
      }

      setSurahs(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch surahs');
      console.error('Error fetching surahs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVerses = useCallback(async (
    surahId: number,
    page = 1,
    translation: 'english' | 'dhivehi' | 'both' = 'english'
  ) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        action: 'verses',
        surah_id: surahId.toString(),
        translation: translation,
        include_audio: 'true',
        page: page.toString(),
        limit: '10',
      });

      const response = await fetch(`/api/faith/quran?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch verses');
      }

      setVerses(result.data || []);
      setPagination(result.pagination || pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch verses');
      console.error('Error fetching verses:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination]);

  const searchVerses = useCallback(async (
    query: string,
    translation: 'english' | 'dhivehi' | 'both' = 'english'
  ) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        action: 'search',
        search: query,
        translation: translation,
        include_audio: 'true',
        limit: '20',
      });

      const response = await fetch(`/api/faith/quran?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to search verses');
      }

      return result.data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search verses');
      console.error('Error searching verses:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const logReadingSession = useCallback(async (sessionData: {
    surah_id: number;
    start_verse: number;
    end_verse: number;
    duration_minutes?: number;
    notes?: string;
  }) => {
    try {
      const response = await fetch('/api/faith/quran?action=reading_session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to log reading session');
      }

      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log reading session');
      console.error('Error logging reading session:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchSurahs();
  }, [fetchSurahs]);

  return {
    surahs,
    verses,
    loading,
    error,
    pagination,
    fetchVerses,
    searchVerses,
    logReadingSession,
  };
}

// Hadith & Duas Hook
export function useHadithDuas() {
  const [hadithResults, setHadithResults] = useState<Hadith[]>([]);
  const [duasResults, setDuasResults] = useState<Dua[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 0,
  });

  const fetchCollections = useCallback(async () => {
    try {
      const response = await fetch('/api/faith/hadith?action=collections');
      const result = await response.json();

      if (response.ok) {
        setCollections(result.data || []);
      }
    } catch (err) {
      console.error('Error fetching collections:', err);
    }
  }, []);

  const searchHadith = useCallback(async (filters: {
    search?: string;
    collection_id?: string;
    category?: string;
    grade?: string;
    page?: number;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        action: 'hadith',
        page: (filters.page || 1).toString(),
        limit: '10',
      });

      if (filters.search) params.append('search', filters.search);
      if (filters.collection_id) params.append('collection_id', filters.collection_id);
      if (filters.category) params.append('category', filters.category);
      if (filters.grade) params.append('grade', filters.grade);

      const response = await fetch(`/api/faith/hadith?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to search hadith');
      }

      setHadithResults(result.data || []);
      setPagination(result.pagination || pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search hadith');
      console.error('Error searching hadith:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination]);

  const searchDuas = useCallback(async (filters: {
    search?: string;
    category?: string;
    occasion?: string;
    page?: number;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        action: 'duas',
        page: (filters.page || 1).toString(),
        limit: '10',
      });

      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.occasion) params.append('occasion', filters.occasion);

      const response = await fetch(`/api/faith/hadith?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to search duas');
      }

      setDuasResults(result.data || []);
      setPagination(result.pagination || pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search duas');
      console.error('Error searching duas:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  return {
    hadithResults,
    duasResults,
    collections,
    categories,
    loading,
    error,
    pagination,
    searchHadith,
    searchDuas,
  };
}

// Azkar Hook
export function useAzkar() {
  const [azkarList, setAzkarList] = useState<Azkar[]>([]);
  const [reminders, setReminders] = useState<AzkarReminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAzkar = useCallback(async (type?: string) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        action: 'azkar',
        limit: '50',
      });

      if (type) params.append('type', type);

      const response = await fetch(`/api/faith/azkar?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch azkar');
      }

      setAzkarList(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch azkar');
      console.error('Error fetching azkar:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReminders = useCallback(async () => {
    try {
      const response = await fetch('/api/faith/azkar?action=reminders');
      const result = await response.json();

      if (response.ok) {
        setReminders(result.data || []);
      }
    } catch (err) {
      console.error('Error fetching reminders:', err);
    }
  }, []);

  const createReminder = useCallback(async (reminderData: {
    azkar_id: string;
    reminder_time: string;
    days_of_week: number[];
    is_enabled: boolean;
  }) => {
    try {
      const response = await fetch('/api/faith/azkar?action=reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reminderData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create reminder');
      }

      await fetchReminders();
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create reminder');
      console.error('Error creating reminder:', err);
      return null;
    }
  }, [fetchReminders]);

  const updateReminder = useCallback(async (reminderId: string, updates: any) => {
    try {
      const response = await fetch('/api/faith/azkar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reminder_id: reminderId,
          ...updates,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update reminder');
      }

      await fetchReminders();
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update reminder');
      console.error('Error updating reminder:', err);
      return null;
    }
  }, [fetchReminders]);

  const deleteReminder = useCallback(async (reminderId: string) => {
    try {
      const response = await fetch('/api/faith/azkar', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminder_id: reminderId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete reminder');
      }

      await fetchReminders();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete reminder');
      console.error('Error deleting reminder:', err);
      return false;
    }
  }, [fetchReminders]);

  useEffect(() => {
    fetchAzkar();
    fetchReminders();
  }, [fetchAzkar, fetchReminders]);

  return {
    azkarList,
    reminders,
    loading,
    error,
    fetchAzkar,
    createReminder,
    updateReminder,
    deleteReminder,
  };
}
