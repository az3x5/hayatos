'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn, generateCalendarDays, calculateStreak } from '@/lib/utils';

interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  target_count: number;
  current_streak: number;
  best_streak: number;
  color: string;
  icon: string;
  created_at: string;
  completions: Array<{
    date: string;
    count: number;
  }>;
}

const mockHabits: Habit[] = [
  {
    id: '1',
    name: 'Morning Exercise',
    description: '30 minutes of physical activity',
    frequency: 'daily',
    target_count: 1,
    current_streak: 7,
    best_streak: 15,
    color: 'bg-blue-500',
    icon: '🏃',
    created_at: '2024-01-01',
    completions: [
      { date: '2024-01-08', count: 1 },
      { date: '2024-01-09', count: 1 },
      { date: '2024-01-10', count: 1 },
      { date: '2024-01-11', count: 1 },
      { date: '2024-01-12', count: 1 },
      { date: '2024-01-13', count: 1 },
      { date: '2024-01-14', count: 1 },
    ]
  },
  {
    id: '2',
    name: 'Read Quran',
    description: 'Daily Quran reading and reflection',
    frequency: 'daily',
    target_count: 1,
    current_streak: 12,
    best_streak: 20,
    color: 'bg-green-500',
    icon: '📖',
    created_at: '2024-01-01',
    completions: [
      { date: '2024-01-08', count: 1 },
      { date: '2024-01-09', count: 1 },
      { date: '2024-01-10', count: 1 },
      { date: '2024-01-11', count: 1 },
      { date: '2024-01-12', count: 1 },
      { date: '2024-01-13', count: 1 },
      { date: '2024-01-14', count: 1 },
    ]
  },
  {
    id: '3',
    name: 'Drink Water',
    description: '8 glasses of water daily',
    frequency: 'daily',
    target_count: 8,
    current_streak: 5,
    best_streak: 10,
    color: 'bg-cyan-500',
    icon: '💧',
    created_at: '2024-01-01',
    completions: [
      { date: '2024-01-14', count: 6 },
      { date: '2024-01-13', count: 8 },
      { date: '2024-01-12', count: 8 },
      { date: '2024-01-11', count: 7 },
      { date: '2024-01-10', count: 8 },
    ]
  },
  {
    id: '4',
    name: 'Meditation',
    description: '10 minutes of mindfulness',
    frequency: 'daily',
    target_count: 1,
    current_streak: 3,
    best_streak: 8,
    color: 'bg-purple-500',
    icon: '🧘',
    created_at: '2024-01-01',
    completions: [
      { date: '2024-01-14', count: 1 },
      { date: '2024-01-13', count: 1 },
      { date: '2024-01-12', count: 1 },
    ]
  }
];

function HabitCard({ habit, onCheckIn }: { habit: Habit; onCheckIn: (habitId: string, count: number) => void }) {
  const [checkInCount, setCheckInCount] = useState(1);
  const today = new Date().toISOString().split('T')[0];
  const todayCompletion = habit.completions.find(c => c.date === today);
  const isCompleted = todayCompletion && todayCompletion.count >= habit.target_count;

  const handleCheckIn = () => {
    onCheckIn(habit.id, checkInCount);
    setCheckInCount(1);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white", habit.color)}>
              <span className="text-lg">{habit.icon}</span>
            </div>
            <div>
              <CardTitle className="text-lg">{habit.name}</CardTitle>
              {habit.description && (
                <p className="text-sm text-muted-foreground">{habit.description}</p>
              )}
            </div>
          </div>
          <Badge variant={isCompleted ? "default" : "outline"}>
            {isCompleted ? "✓ Done" : "Pending"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Today's Progress</span>
              <span>{todayCompletion?.count || 0} / {habit.target_count}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className={cn("h-2 rounded-full transition-all", habit.color)}
                style={{ 
                  width: `${Math.min(((todayCompletion?.count || 0) / habit.target_count) * 100, 100)}%` 
                }}
              />
            </div>
          </div>

          {/* Streaks */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-orange-600">{habit.current_streak}</div>
              <div className="text-xs text-muted-foreground">Current Streak</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{habit.best_streak}</div>
              <div className="text-xs text-muted-foreground">Best Streak</div>
            </div>
          </div>

          {/* Check-in */}
          {!isCompleted && (
            <div className="flex items-center space-x-2">
              {habit.target_count > 1 && (
                <Input
                  type="number"
                  min="1"
                  max={habit.target_count}
                  value={checkInCount}
                  onChange={(e) => setCheckInCount(parseInt(e.target.value) || 1)}
                  className="w-16 h-8"
                />
              )}
              <Button 
                onClick={handleCheckIn}
                size="sm"
                className="flex-1"
              >
                Check In
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function HabitCalendar({ habit }: { habit: Habit }) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const calendarDays = generateCalendarDays(currentYear, currentMonth);
  
  const getCompletionStatus = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const completion = habit.completions.find(c => c.date === dateStr);
    
    if (!completion) return 'none';
    if (completion.count >= habit.target_count) return 'complete';
    if (completion.count > 0) return 'partial';
    return 'none';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-500';
      case 'partial': return 'bg-yellow-500';
      default: return 'bg-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>{habit.icon}</span>
          <span>{habit.name} - Calendar</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const status = getCompletionStatus(day.date);
            return (
              <div
                key={index}
                className={cn(
                  "aspect-square flex items-center justify-center text-xs rounded",
                  day.isCurrentMonth ? "text-foreground" : "text-muted-foreground",
                  day.isToday && "ring-2 ring-primary",
                  getStatusColor(status)
                )}
              >
                {day.date.getDate()}
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center space-x-4 mt-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Complete</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Partial</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-200 rounded"></div>
            <span>None</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function HabitsTracker() {
  const [habits, setHabits] = useState<Habit[]>(mockHabits);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const handleCheckIn = (habitId: string, count: number) => {
    const today = new Date().toISOString().split('T')[0];
    
    setHabits(prev => prev.map(habit => {
      if (habit.id !== habitId) return habit;
      
      const existingCompletion = habit.completions.find(c => c.date === today);
      const newCompletions = existingCompletion
        ? habit.completions.map(c => c.date === today ? { ...c, count: c.count + count } : c)
        : [...habit.completions, { date: today, count }];
      
      // Recalculate streak
      const completionDates = newCompletions
        .filter(c => c.count >= habit.target_count)
        .map(c => new Date(c.date));
      
      const newStreak = calculateStreak(completionDates);
      
      return {
        ...habit,
        completions: newCompletions,
        current_streak: newStreak,
        best_streak: Math.max(habit.best_streak, newStreak)
      };
    }));
  };

  const totalHabits = habits.length;
  const completedToday = habits.filter(habit => {
    const today = new Date().toISOString().split('T')[0];
    const completion = habit.completions.find(c => c.date === today);
    return completion && completion.count >= habit.target_count;
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Habits Tracker</h2>
          <p className="text-muted-foreground">Build consistent daily habits</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{completedToday}/{totalHabits}</div>
            <div className="text-xs text-muted-foreground">Today</div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowCalendar(!showCalendar)}>
            {showCalendar ? '📋 List' : '📅 Calendar'}
          </Button>
          <Button size="sm">
            <span className="mr-2">➕</span>
            Add Habit
          </Button>
        </div>
      </div>

      {showCalendar ? (
        /* Calendar View */
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold">Habit Calendar</h3>
            <select 
              onChange={(e) => setSelectedHabit(habits.find(h => h.id === e.target.value) || null)}
              className="px-3 py-1 border border-input rounded-md bg-background text-sm"
            >
              <option value="">Select a habit</option>
              {habits.map((habit) => (
                <option key={habit.id} value={habit.id}>
                  {habit.icon} {habit.name}
                </option>
              ))}
            </select>
          </div>
          
          {selectedHabit ? (
            <HabitCalendar habit={selectedHabit} />
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-4xl mb-4">📅</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Habit</h3>
                <p className="text-gray-600">Choose a habit from the dropdown to view its calendar</p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* List View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onCheckIn={handleCheckIn}
            />
          ))}
        </div>
      )}

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalHabits}</div>
              <div className="text-sm text-muted-foreground">Total Habits</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completedToday}</div>
              <div className="text-sm text-muted-foreground">Completed Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round((completedToday / totalHabits) * 100) || 0}%
              </div>
              <div className="text-sm text-muted-foreground">Completion Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.max(...habits.map(h => h.current_streak))}
              </div>
              <div className="text-sm text-muted-foreground">Best Current Streak</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
