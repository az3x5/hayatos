'use client';

import React, { useState, useEffect, useRef } from 'react';

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
  quran_surahs: {
    name_arabic: string;
    name_english: string;
    name_dhivehi?: string;
  };
}

interface ReadingSession {
  surah_id: number;
  start_verse: number;
  end_verse: number;
  duration_minutes?: number;
  notes?: string;
}

export default function QuranReader() {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [translation, setTranslation] = useState<'english' | 'dhivehi' | 'both'>('english');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Verse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [playingVerse, setPlayingVerse] = useState<string | null>(null);
  const [readingSession, setReadingSession] = useState<ReadingSession | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchSurahs();
  }, []);

  useEffect(() => {
    if (selectedSurah) {
      fetchVerses();
    }
  }, [selectedSurah, currentPage, translation]);

  const fetchSurahs = async () => {
    try {
      const response = await fetch('/api/faith/quran?action=surahs');
      const result = await response.json();

      if (response.ok) {
        setSurahs(result.data || []);
      } else {
        console.error('Error fetching surahs:', result.error);
      }
    } catch (error) {
      console.error('Error fetching surahs:', error);
    }
  };

  const fetchVerses = async () => {
    if (!selectedSurah) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        action: 'verses',
        surah_id: selectedSurah.id.toString(),
        translation: translation,
        include_audio: 'true',
        page: currentPage.toString(),
        limit: '10',
      });

      const response = await fetch(`/api/faith/quran?${params.toString()}`);
      const result = await response.json();

      if (response.ok) {
        setVerses(result.data || []);
        setTotalPages(result.pagination?.total_pages || 1);
      } else {
        console.error('Error fetching verses:', result.error);
      }
    } catch (error) {
      console.error('Error fetching verses:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchVerses = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const params = new URLSearchParams({
        action: 'search',
        search: searchQuery,
        translation: translation,
        include_audio: 'true',
        limit: '20',
      });

      const response = await fetch(`/api/faith/quran?${params.toString()}`);
      const result = await response.json();

      if (response.ok) {
        setSearchResults(result.data || []);
      } else {
        console.error('Error searching verses:', result.error);
      }
    } catch (error) {
      console.error('Error searching verses:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const playAudio = async (verse: Verse) => {
    if (!verse.audio_url) {
      alert('Audio not available for this verse');
      return;
    }

    // Stop current audio if playing
    if (currentAudio) {
      currentAudio.pause();
      setPlayingVerse(null);
    }

    // Create new audio element
    const audio = new Audio(verse.audio_url);
    setCurrentAudio(audio);
    setPlayingVerse(verse.id);

    audio.onended = () => {
      setPlayingVerse(null);
      setCurrentAudio(null);
    };

    audio.onerror = () => {
      alert('Error playing audio');
      setPlayingVerse(null);
      setCurrentAudio(null);
    };

    try {
      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      alert('Error playing audio');
      setPlayingVerse(null);
      setCurrentAudio(null);
    }
  };

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
      setPlayingVerse(null);
    }
  };

  const startReadingSession = () => {
    if (!selectedSurah) return;

    const firstVerse = verses[0]?.verse_number || 1;
    const lastVerse = verses[verses.length - 1]?.verse_number || selectedSurah.verse_count;

    setReadingSession({
      surah_id: selectedSurah.id,
      start_verse: firstVerse,
      end_verse: lastVerse,
    });
    setSessionStartTime(new Date());
  };

  const endReadingSession = async () => {
    if (!readingSession || !sessionStartTime) return;

    const duration = Math.round((new Date().getTime() - sessionStartTime.getTime()) / 60000);

    try {
      const response = await fetch('/api/faith/quran?action=reading_session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...readingSession,
          duration_minutes: duration,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Reading session logged: ${duration} minutes`);
      } else {
        console.error('Error logging session:', result.error);
      }
    } catch (error) {
      console.error('Error logging session:', error);
    }

    setReadingSession(null);
    setSessionStartTime(null);
  };

  const bookmarkVerse = async (verse: Verse) => {
    try {
      const response = await fetch('/api/faith/quran?action=bookmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verse_id: verse.id,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Verse bookmarked successfully');
      } else {
        console.error('Error bookmarking verse:', result.error);
        alert('Error bookmarking verse: ' + result.error);
      }
    } catch (error) {
      console.error('Error bookmarking verse:', error);
      alert('Error bookmarking verse');
    }
  };

  const renderVerse = (verse: Verse) => (
    <div key={verse.id} className="bg-white rounded-lg border p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-2">
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
            {verse.verse_number}
          </span>
          {verse.quran_surahs && (
            <span className="text-sm text-gray-600">
              {verse.quran_surahs.name_english}
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          {verse.audio_url && (
            <button
              onClick={() => playingVerse === verse.id ? stopAudio() : playAudio(verse)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title={playingVerse === verse.id ? 'Stop audio' : 'Play audio'}
            >
              {playingVerse === verse.id ? '⏹️' : '🔊'}
            </button>
          )}
          <button
            onClick={() => bookmarkVerse(verse)}
            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
            title="Bookmark verse"
          >
            🔖
          </button>
        </div>
      </div>

      {/* Arabic Text */}
      <div className="text-right">
        <p className="text-2xl leading-loose font-arabic text-gray-900" dir="rtl">
          {verse.text_arabic}
        </p>
      </div>

      {/* Transliteration */}
      {verse.transliteration && (
        <div className="text-gray-600 italic">
          <p>{verse.transliteration}</p>
        </div>
      )}

      {/* Translations */}
      <div className="space-y-2">
        {(translation === 'english' || translation === 'both') && verse.text_english && (
          <div className="text-gray-800">
            <p className="leading-relaxed">{verse.text_english}</p>
          </div>
        )}
        
        {(translation === 'dhivehi' || translation === 'both') && verse.text_dhivehi && (
          <div className="text-gray-800">
            <p className="leading-relaxed" dir="rtl">{verse.text_dhivehi}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Quran Reader</h2>
          <p className="text-gray-600">Read the Holy Quran with translations and audio</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Translation selector */}
          <select
            value={translation}
            onChange={(e) => setTranslation(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="english">English</option>
            <option value="dhivehi">Dhivehi</option>
            <option value="both">Both</option>
          </select>

          {/* Reading session controls */}
          {readingSession ? (
            <button
              onClick={endReadingSession}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              End Session
            </button>
          ) : (
            selectedSurah && (
              <button
                onClick={startReadingSession}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Start Reading
              </button>
            )
          )}
        </div>
      </div>

      {/* Reading session indicator */}
      {readingSession && sessionStartTime && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-green-900">📖 Reading Session Active</h4>
              <p className="text-sm text-green-800">
                Started at {sessionStartTime.toLocaleTimeString()}
              </p>
            </div>
            <div className="text-green-700 font-medium">
              {Math.round((new Date().getTime() - sessionStartTime.getTime()) / 60000)} min
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex space-x-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search verses..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            onKeyPress={(e) => e.key === 'Enter' && searchVerses()}
          />
          <button
            onClick={searchVerses}
            disabled={isSearching}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
                setIsSearching(false);
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Search Results ({searchResults.length})
          </h3>
          {searchResults.map(renderVerse)}
        </div>
      )}

      {/* Surah Selection */}
      {!searchQuery && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Surahs List */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Surahs</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {surahs.map((surah) => (
                <button
                  key={surah.id}
                  onClick={() => {
                    setSelectedSurah(surah);
                    setCurrentPage(1);
                  }}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedSurah?.id === surah.id
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{surah.order_number}. {surah.name_english}</div>
                  <div className="text-sm text-gray-600 text-right" dir="rtl">{surah.name_arabic}</div>
                  <div className="text-xs text-gray-500">
                    {surah.verse_count} verses • {surah.revelation_place}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Verses */}
          <div className="lg:col-span-3 space-y-4">
            {selectedSurah && (
              <div className="bg-white rounded-lg border p-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedSurah.name_english}
                    </h3>
                    <p className="text-sm text-gray-600" dir="rtl">
                      {selectedSurah.name_arabic}
                    </p>
                  </div>
                  <div className="text-sm text-gray-600">
                    {selectedSurah.verse_count} verses
                  </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center space-x-2 mb-4">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Verses Display */}
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading verses...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {verses.map(renderVerse)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audio Controls Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">🎵 Audio Features</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Click the speaker icon to play verse recitation</li>
          <li>• Audio will stop automatically when verse ends</li>
          <li>• Click the bookmark icon to save verses for later</li>
          <li>• Start a reading session to track your progress</li>
        </ul>
      </div>
    </div>
  );
}
