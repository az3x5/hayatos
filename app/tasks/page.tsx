'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import TasksKanban from '@/components/tasks/TasksKanban';
import TasksList from '@/components/tasks/TasksList';

type ViewMode = 'kanban' | 'list' | 'calendar';

export default function TasksPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

  const renderView = () => {
    switch (viewMode) {
      case 'kanban':
        return <TasksKanban />;
      case 'list':
        return <TasksList />;
      case 'calendar':
        return (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Calendar View</h3>
            <p className="text-gray-600">Calendar integration coming soon</p>
          </div>
        );
      default:
        return <TasksKanban />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">
            Manage your tasks with Kanban boards, lists, and calendar views
          </p>
        </div>
        
        {/* View Toggle */}
        <div className="flex items-center space-x-2 bg-muted p-1 rounded-lg">
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('kanban')}
          >
            📋 Kanban
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            📝 List
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('calendar')}
          >
            📅 Calendar
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {renderView()}
    </div>
  );
}
