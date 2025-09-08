'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn, formatDate } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  assignee?: string;
  tags?: string[];
  project?: string;
}

interface KanbanColumnProps {
  title: string;
  status: Task['status'];
  tasks: Task[];
  onTaskMove: (taskId: string, newStatus: Task['status']) => void;
  onTaskClick: (task: Task) => void;
}

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Design new landing page',
    description: 'Create wireframes and mockups for the new landing page',
    status: 'todo',
    priority: 'high',
    due_date: '2024-01-15',
    assignee: 'John Doe',
    tags: ['design', 'ui/ux'],
    project: 'Website Redesign'
  },
  {
    id: '2',
    title: 'Implement user authentication',
    description: 'Set up login, registration, and password reset functionality',
    status: 'in_progress',
    priority: 'urgent',
    due_date: '2024-01-12',
    assignee: 'Jane Smith',
    tags: ['backend', 'security'],
    project: 'User Management'
  },
  {
    id: '3',
    title: 'Write API documentation',
    description: 'Document all API endpoints with examples',
    status: 'review',
    priority: 'medium',
    due_date: '2024-01-20',
    assignee: 'Bob Johnson',
    tags: ['documentation', 'api'],
    project: 'Documentation'
  },
  {
    id: '4',
    title: 'Set up CI/CD pipeline',
    description: 'Configure automated testing and deployment',
    status: 'done',
    priority: 'high',
    assignee: 'Alice Brown',
    tags: ['devops', 'automation'],
    project: 'Infrastructure'
  },
  {
    id: '5',
    title: 'Optimize database queries',
    description: 'Improve performance of slow queries',
    status: 'todo',
    priority: 'medium',
    due_date: '2024-01-18',
    assignee: 'Charlie Wilson',
    tags: ['database', 'performance'],
    project: 'Performance'
  }
];

const columns = [
  { title: 'To Do', status: 'todo' as const, color: 'bg-gray-100' },
  { title: 'In Progress', status: 'in_progress' as const, color: 'bg-blue-100' },
  { title: 'Review', status: 'review' as const, color: 'bg-yellow-100' },
  { title: 'Done', status: 'done' as const, color: 'bg-green-100' }
];

function TaskCard({ task, onTaskClick }: { task: Task; onTaskClick: (task: Task) => void }) {
  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date();

  return (
    <Card 
      className="kanban-card cursor-pointer mb-3 hover:shadow-md transition-shadow"
      onClick={() => onTaskClick(task)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
          <div className={cn("w-2 h-2 rounded-full", getPriorityColor(task.priority))} />
        </div>
        
        {task.description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {task.description}
          </p>
        )}
        
        <div className="space-y-2">
          {task.due_date && (
            <div className="flex items-center text-xs">
              <span className="mr-1">📅</span>
              <span className={cn(isOverdue && "text-red-600 font-medium")}>
                {formatDate(task.due_date)}
              </span>
            </div>
          )}
          
          {task.assignee && (
            <div className="flex items-center text-xs text-muted-foreground">
              <span className="mr-1">👤</span>
              <span>{task.assignee}</span>
            </div>
          )}
          
          {task.project && (
            <div className="flex items-center text-xs text-muted-foreground">
              <span className="mr-1">📁</span>
              <span>{task.project}</span>
            </div>
          )}
          
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                  {tag}
                </Badge>
              ))}
              {task.tags.length > 2 && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  +{task.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function KanbanColumn({ title, status, tasks, onTaskMove, onTaskClick }: KanbanColumnProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const taskId = e.dataTransfer.getData('text/plain');
    onTaskMove(taskId, status);
  };

  const handleTaskDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  return (
    <div className="kanban-column flex-1 min-w-80">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{title}</h3>
          <Badge variant="outline" className="text-xs">
            {tasks.length}
          </Badge>
        </div>
      </div>
      
      <div
        className={cn(
          "min-h-96 p-2 rounded-lg transition-colors",
          dragOver ? "bg-primary/10 border-2 border-primary border-dashed" : "bg-muted/30"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {tasks.map((task) => (
          <div
            key={task.id}
            draggable
            onDragStart={(e) => handleTaskDragStart(e, task.id)}
          >
            <TaskCard task={task} onTaskClick={onTaskClick} />
          </div>
        ))}
        
        {tasks.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            No tasks in {title.toLowerCase()}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TasksKanban() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleTaskMove = (taskId: string, newStatus: Task['status']) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter(task => task.status === status);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tasks Kanban</h2>
          <p className="text-muted-foreground">Drag and drop tasks between columns</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <span className="mr-2">🔍</span>
            Filter
          </Button>
          <Button size="sm">
            <span className="mr-2">➕</span>
            Add Task
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-6 overflow-x-auto pb-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.status}
            title={column.title}
            status={column.status}
            tasks={getTasksByStatus(column.status)}
            onTaskMove={handleTaskMove}
            onTaskClick={handleTaskClick}
          />
        ))}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedTask(null)}
          />
          <Card className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedTask.title}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setSelectedTask(null)}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-muted-foreground">
                    {selectedTask.description || 'No description provided'}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Status</h4>
                    <Badge>{selectedTask.status.replace('_', ' ')}</Badge>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Priority</h4>
                    <Badge variant="outline">{selectedTask.priority}</Badge>
                  </div>
                </div>
                
                {selectedTask.due_date && (
                  <div>
                    <h4 className="font-medium mb-2">Due Date</h4>
                    <p className="text-muted-foreground">{formatDate(selectedTask.due_date)}</p>
                  </div>
                )}
                
                {selectedTask.assignee && (
                  <div>
                    <h4 className="font-medium mb-2">Assignee</h4>
                    <p className="text-muted-foreground">{selectedTask.assignee}</p>
                  </div>
                )}
                
                {selectedTask.project && (
                  <div>
                    <h4 className="font-medium mb-2">Project</h4>
                    <p className="text-muted-foreground">{selectedTask.project}</p>
                  </div>
                )}
                
                {selectedTask.tags && selectedTask.tags.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTask.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
