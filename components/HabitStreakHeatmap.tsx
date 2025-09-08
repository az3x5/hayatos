'use client';

import React, { useMemo } from 'react';

interface HeatmapData {
  date: string;
  completed: boolean;
  value: number;
  target: number;
}

interface HabitStreakHeatmapProps {
  data: HeatmapData[];
  title?: string;
  className?: string;
}

export default function HabitStreakHeatmap({ data, title, className = '' }: HabitStreakHeatmapProps) {
  const { weeks, monthLabels, stats } = useMemo(() => {
    if (!data || data.length === 0) {
      return { weeks: [], monthLabels: [], stats: { total: 0, completed: 0, streak: 0 } };
    }

    // Sort data by date
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Group data into weeks
    const weeks: HeatmapData[][] = [];
    let currentWeek: HeatmapData[] = [];
    let currentWeekStart: Date | null = null;

    sortedData.forEach((item) => {
      const date = new Date(item.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)

      if (!currentWeekStart || weekStart.getTime() !== currentWeekStart.getTime()) {
        if (currentWeek.length > 0) {
          weeks.push([...currentWeek]);
        }
        currentWeek = [];
        currentWeekStart = weekStart;
      }

      currentWeek.push(item);
    });

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    // Generate month labels
    const monthLabels: { month: string; weekIndex: number }[] = [];
    weeks.forEach((week, index) => {
      if (week.length > 0) {
        const firstDate = new Date(week[0].date);
        const monthName = firstDate.toLocaleDateString('en-US', { month: 'short' });
        
        // Add label if it's the first week or if month changed
        if (index === 0 || 
            (index > 0 && weeks[index - 1].length > 0 && 
             new Date(weeks[index - 1][0].date).getMonth() !== firstDate.getMonth())) {
          monthLabels.push({ month: monthName, weekIndex: index });
        }
      }
    });

    // Calculate statistics
    const total = sortedData.length;
    const completed = sortedData.filter(item => item.completed).length;
    
    // Calculate current streak
    let streak = 0;
    for (let i = sortedData.length - 1; i >= 0; i--) {
      if (sortedData[i].completed) {
        streak++;
      } else {
        break;
      }
    }

    return {
      weeks,
      monthLabels,
      stats: { total, completed, streak }
    };
  }, [data]);

  const getIntensityClass = (item: HeatmapData) => {
    if (!item.completed) {
      return 'bg-gray-100 border-gray-200';
    }
    
    const intensity = item.target > 0 ? item.value / item.target : 1;
    
    if (intensity >= 1) {
      return 'bg-green-500 border-green-600'; // Fully completed
    } else if (intensity >= 0.75) {
      return 'bg-green-400 border-green-500'; // Mostly completed
    } else if (intensity >= 0.5) {
      return 'bg-green-300 border-green-400'; // Partially completed
    } else if (intensity > 0) {
      return 'bg-green-200 border-green-300'; // Minimally completed
    }
    
    return 'bg-gray-100 border-gray-200';
  };

  const formatTooltip = (item: HeatmapData) => {
    const date = new Date(item.date).toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    
    if (item.completed) {
      return `${date}: ${item.value}/${item.target} completed`;
    } else {
      return `${date}: Not completed`;
    }
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={`bg-white rounded-lg border p-6 ${className}`}>
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
            <span>{stats.total} days tracked</span>
            <span>{stats.completed} days completed</span>
            <span>{stats.streak} day current streak</span>
            <span>{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% completion rate</span>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex mb-2">
            <div className="w-8"></div> {/* Space for day labels */}
            {monthLabels.map((label, index) => (
              <div
                key={index}
                className="text-xs text-gray-500 font-medium"
                style={{ marginLeft: `${label.weekIndex * 14}px` }}
              >
                {label.month}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="flex">
            {/* Day labels */}
            <div className="flex flex-col mr-2">
              {dayLabels.map((day, index) => (
                <div
                  key={day}
                  className="h-3 flex items-center text-xs text-gray-500 mb-1"
                  style={{ opacity: index % 2 === 0 ? 1 : 0 }} // Show only every other day label
                >
                  {index % 2 === 0 ? day : ''}
                </div>
              ))}
            </div>

            {/* Heatmap cells */}
            <div className="flex">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col mr-1">
                  {Array.from({ length: 7 }, (_, dayIndex) => {
                    const item = week.find(item => new Date(item.date).getDay() === dayIndex);
                    
                    if (!item) {
                      return (
                        <div
                          key={dayIndex}
                          className="w-3 h-3 mb-1 bg-gray-50 border border-gray-100 rounded-sm"
                        />
                      );
                    }

                    return (
                      <div
                        key={dayIndex}
                        className={`w-3 h-3 mb-1 border rounded-sm cursor-pointer transition-all hover:scale-110 ${getIntensityClass(item)}`}
                        title={formatTooltip(item)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>Less</span>
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded-sm" />
                <div className="w-3 h-3 bg-green-200 border border-green-300 rounded-sm" />
                <div className="w-3 h-3 bg-green-300 border border-green-400 rounded-sm" />
                <div className="w-3 h-3 bg-green-400 border border-green-500 rounded-sm" />
                <div className="w-3 h-3 bg-green-500 border border-green-600 rounded-sm" />
              </div>
              <span>More</span>
            </div>
            
            <div className="text-xs text-gray-500">
              {data.length > 0 && (
                <>
                  {new Date(data[0]?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {' '}
                  {new Date(data[data.length - 1]?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
