'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';

interface SummaryCardProps {
  title: string;
  icon: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: React.ReactNode;
}

function SummaryCard({ title, icon, value, subtitle, trend, action, children }: SummaryCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <span className="text-2xl">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            <Badge 
              variant={trend.isPositive ? 'default' : 'destructive'}
              className="text-xs"
            >
              {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
            </Badge>
            <span className="text-xs text-muted-foreground ml-2">vs last week</span>
          </div>
        )}
        {action && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={action.onClick}
            className="mt-3 w-full"
          >
            {action.label}
          </Button>
        )}
        {children}
      </CardContent>
    </Card>
  );
}

export default function DashboardSummary() {
  const today = new Date();
  
  // Mock data - replace with real data from your API
  const summaryData = {
    tasks: {
      total: 12,
      completed: 8,
      pending: 4,
      overdue: 1
    },
    habits: {
      streak: 15,
      todayCompleted: 3,
      todayTotal: 5
    },
    finance: {
      balance: 2450.75,
      monthlySpent: 1250.30,
      monthlyBudget: 2000
    },
    quran: {
      pagesRead: 45,
      currentSurah: 'Al-Baqarah',
      streak: 7
    },
    prayers: {
      todayCompleted: 3,
      todayTotal: 5,
      weeklyAverage: 4.2
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-2">Good morning! 🌅</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Today is {formatDate(today)}. Here's your daily overview.
        </p>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {/* Tasks Summary */}
        <SummaryCard
          title="Today's Tasks"
          icon="✅"
          value={summaryData.tasks.pending}
          subtitle={`${summaryData.tasks.completed} completed, ${summaryData.tasks.overdue} overdue`}
          trend={{ value: 12, isPositive: true }}
          action={{
            label: "View Tasks",
            onClick: () => window.location.href = '/tasks'
          }}
        />

        {/* Habits Summary */}
        <SummaryCard
          title="Habit Streak"
          icon="🔥"
          value={`${summaryData.habits.streak} days`}
          subtitle={`${summaryData.habits.todayCompleted}/${summaryData.habits.todayTotal} completed today`}
          trend={{ value: 8, isPositive: true }}
          action={{
            label: "Check In",
            onClick: () => window.location.href = '/habits'
          }}
        />

        {/* Finance Summary */}
        <SummaryCard
          title="Account Balance"
          icon="💰"
          value={formatCurrency(summaryData.finance.balance)}
          subtitle={`${formatCurrency(summaryData.finance.monthlySpent)} spent this month`}
          trend={{ value: 5, isPositive: false }}
          action={{
            label: "View Finance",
            onClick: () => window.location.href = '/finance'
          }}
        />

        {/* Quran Progress */}
        <SummaryCard
          title="Quran Progress"
          icon="📖"
          value={`${summaryData.quran.pagesRead} pages`}
          subtitle={`Currently reading ${summaryData.quran.currentSurah}`}
          trend={{ value: 15, isPositive: true }}
          action={{
            label: "Continue Reading",
            onClick: () => window.location.href = '/faith'
          }}
        />
      </div>

      {/* Detailed Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>📅</span>
              <span>Today's Schedule</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🕌</span>
                  <div>
                    <div className="font-medium">Fajr Prayer</div>
                    <div className="text-sm text-muted-foreground">5:30 AM</div>
                  </div>
                </div>
                <Badge variant="outline">Completed</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">💼</span>
                  <div>
                    <div className="font-medium">Team Meeting</div>
                    <div className="text-sm text-muted-foreground">10:00 AM</div>
                  </div>
                </div>
                <Badge>Upcoming</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🏃</span>
                  <div>
                    <div className="font-medium">Exercise</div>
                    <div className="text-sm text-muted-foreground">6:00 PM</div>
                  </div>
                </div>
                <Badge variant="secondary">Habit</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>📊</span>
              <span>Quick Stats</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Prayer Stats */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🕌</span>
                  <span className="font-medium">Prayers Today</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-muted-foreground">
                    {summaryData.prayers.todayCompleted}/{summaryData.prayers.todayTotal}
                  </div>
                  <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all"
                      style={{ 
                        width: `${(summaryData.prayers.todayCompleted / summaryData.prayers.todayTotal) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Budget Progress */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">💳</span>
                  <span className="font-medium">Monthly Budget</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-muted-foreground">
                    {Math.round((summaryData.finance.monthlySpent / summaryData.finance.monthlyBudget) * 100)}%
                  </div>
                  <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-500 transition-all"
                      style={{ 
                        width: `${(summaryData.finance.monthlySpent / summaryData.finance.monthlyBudget) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Habit Completion */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🎯</span>
                  <span className="font-medium">Daily Habits</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-muted-foreground">
                    {summaryData.habits.todayCompleted}/{summaryData.habits.todayTotal}
                  </div>
                  <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all"
                      style={{ 
                        width: `${(summaryData.habits.todayCompleted / summaryData.habits.todayTotal) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>⚡</span>
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <span className="text-lg">✅</span>
              <div className="flex-1">
                <div className="font-medium">Completed "Review project proposal"</div>
                <div className="text-sm text-muted-foreground">2 minutes ago</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <span className="text-lg">💰</span>
              <div className="flex-1">
                <div className="font-medium">Added expense: Lunch - $12.50</div>
                <div className="text-sm text-muted-foreground">1 hour ago</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <span className="text-lg">🔄</span>
              <div className="flex-1">
                <div className="font-medium">Completed habit: Morning meditation</div>
                <div className="text-sm text-muted-foreground">3 hours ago</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
