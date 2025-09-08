'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface Prayer {
  name: string;
  time: string;
  completed: boolean;
}

interface QuranProgress {
  currentSurah: string;
  currentAyah: number;
  totalAyahs: number;
  pagesRead: number;
  streak: number;
}

interface Dua {
  id: string;
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
  category: string;
}

const mockPrayers: Prayer[] = [
  { name: 'Fajr', time: '5:30 AM', completed: true },
  { name: 'Dhuhr', time: '12:30 PM', completed: true },
  { name: 'Asr', time: '3:45 PM', completed: false },
  { name: 'Maghrib', time: '6:15 PM', completed: false },
  { name: 'Isha', time: '7:45 PM', completed: false },
];

const mockQuranProgress: QuranProgress = {
  currentSurah: 'Al-Baqarah',
  currentAyah: 45,
  totalAyahs: 286,
  pagesRead: 125,
  streak: 7
};

const mockDuas: Dua[] = [
  {
    id: '1',
    title: 'Before Eating',
    arabic: 'بِسْمِ اللَّهِ',
    transliteration: 'Bismillah',
    translation: 'In the name of Allah',
    category: 'Daily'
  },
  {
    id: '2',
    title: 'After Eating',
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ',
    transliteration: 'Alhamdu lillahil-ladhi at\'amani hadha wa razaqanihi min ghayri hawlin minni wa la quwwah',
    translation: 'Praise be to Allah Who has fed me this food and provided it for me without any might or power on my part',
    category: 'Daily'
  },
  {
    id: '3',
    title: 'Before Sleep',
    arabic: 'اللَّهُمَّ بِاسْمِكَ أَمُوتُ وَأَحْيَا',
    transliteration: 'Allahumma bismika amutu wa ahya',
    translation: 'O Allah, in Your name I die and I live',
    category: 'Daily'
  }
];

function PrayerTracker() {
  const [prayers, setPrayers] = useState<Prayer[]>(mockPrayers);

  const togglePrayer = (index: number) => {
    setPrayers(prev => prev.map((prayer, i) => 
      i === index ? { ...prayer, completed: !prayer.completed } : prayer
    ));
  };

  const completedPrayers = prayers.filter(p => p.completed).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <span>🕌</span>
            <span>Prayer Tracker</span>
          </span>
          <Badge variant="outline">
            {completedPrayers}/{prayers.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {prayers.map((prayer, index) => (
            <div 
              key={prayer.name}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => togglePrayer(index)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    prayer.completed 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : 'border-gray-300 hover:border-green-500'
                  }`}
                >
                  {prayer.completed && '✓'}
                </button>
                <div>
                  <div className="font-medium">{prayer.name}</div>
                  <div className="text-sm text-muted-foreground">{prayer.time}</div>
                </div>
              </div>
              {prayer.completed && (
                <Badge variant="default" className="text-xs">
                  Completed
                </Badge>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{completedPrayers}/5</div>
            <div className="text-sm text-green-700">Prayers completed today</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuranReader() {
  const [progress] = useState<QuranProgress>(mockQuranProgress);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>📖</span>
          <span>Quran Progress</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-lg font-semibold">{progress.currentSurah}</div>
            <div className="text-sm text-muted-foreground">
              Ayah {progress.currentAyah} of {progress.totalAyahs}
            </div>
          </div>
          
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="h-2 bg-green-500 rounded-full transition-all"
              style={{ width: `${(progress.currentAyah / progress.totalAyahs) * 100}%` }}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{progress.pagesRead}</div>
              <div className="text-xs text-muted-foreground">Pages Read</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{progress.streak}</div>
              <div className="text-xs text-muted-foreground">Day Streak</div>
            </div>
          </div>
          
          <Button className="w-full">
            Continue Reading
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DuaLibrary() {
  const [duas] = useState<Dua[]>(mockDuas);
  const [selectedDua, setSelectedDua] = useState<Dua | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDuas = duas.filter(dua =>
    dua.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dua.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>🤲</span>
          <span>Dua Library</span>
        </CardTitle>
        <Input
          placeholder="Search duas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </CardHeader>
      <CardContent>
        {selectedDua ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{selectedDua.title}</h3>
              <Button variant="ghost" size="icon" onClick={() => setSelectedDua(null)}>
                ✕
              </Button>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Arabic</div>
                <div className="text-right text-lg leading-relaxed" style={{ fontFamily: "'Amiri', 'Times New Roman', serif" }}>
                  {selectedDua.arabic}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Transliteration</div>
                <div className="text-sm italic">{selectedDua.transliteration}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Translation</div>
                <div className="text-sm">{selectedDua.translation}</div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                🔊 Listen
              </Button>
              <Button variant="outline" size="sm">
                📋 Copy
              </Button>
              <Button variant="outline" size="sm">
                ⭐ Favorite
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDuas.map((dua) => (
              <div
                key={dua.id}
                onClick={() => setSelectedDua(dua)}
                className="p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{dua.title}</div>
                    <div className="text-sm text-muted-foreground">{dua.category}</div>
                  </div>
                  <Badge variant="secondary">{dua.category}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function IslamicCalendar() {
  const islamicDate = "15 Rajab 1445";
  const gregorianDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const upcomingEvents = [
    { name: 'Laylat al-Miraj', date: '27 Rajab', days: 12 },
    { name: 'Ramadan Begins', date: '1 Ramadan', days: 45 },
    { name: 'Laylat al-Qadr', date: '27 Ramadan', days: 71 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>📅</span>
          <span>Islamic Calendar</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-lg font-semibold">{islamicDate}</div>
            <div className="text-sm text-muted-foreground">{gregorianDate}</div>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">Upcoming Events</h4>
            <div className="space-y-2">
              {upcomingEvents.map((event, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div>
                    <div className="font-medium text-sm">{event.name}</div>
                    <div className="text-xs text-muted-foreground">{event.date}</div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {event.days} days
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FaithDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Faith Dashboard</h2>
        <p className="text-muted-foreground">Track your Islamic practices and spiritual journey</p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PrayerTracker />
        <QuranReader />
        <DuaLibrary />
        <IslamicCalendar />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <span className="text-2xl">🕌</span>
              <span className="text-sm">Qibla Direction</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <span className="text-2xl">📿</span>
              <span className="text-sm">Tasbih Counter</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <span className="text-2xl">🎧</span>
              <span className="text-sm">Audio Quran</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <span className="text-2xl">📚</span>
              <span className="text-sm">Hadith Collection</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
