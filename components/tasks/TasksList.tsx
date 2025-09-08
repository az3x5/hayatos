'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  completed_at?: string;
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
    project: 'Infrastructure',
    completed_at: '2024-01-08'
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
  },
  {
    id: '6',
    title: 'Update user interface components',
    description: 'Modernize UI components with new design system',
    status: 'in_progress',
    priority: 'low',
    due_date: '2024-01-25',
    assignee: 'Diana Prince',
    tags: ['frontend', 'ui'],
    project: 'UI Refresh'
  }
];

type SortField = 'title' | 'priority' | 'due_date' | 'status' | 'assignee';
type SortDirection = 'asc' | 'desc';

export default function TasksList() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('due_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'todo': return 'text-gray-600 bg-gray-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'review': return 'text-yellow-600 bg-yellow-100';
      case 'done': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleTaskSelect = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTasks.size === filteredTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(filteredTasks.map(task => task.id)));
    }
  };

  const handleStatusChange = (taskId: string, newStatus: Task['status']) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            status: newStatus,
            completed_at: newStatus === 'done' ? new Date().toISOString() : undefined
          } 
        : task
    ));
  };

  const filteredTasks = tasks
    .filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           task.assignee?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      if (sortField === 'due_date') {
        aValue = aValue ? new Date(aValue).getTime() : Infinity;
        bValue = bValue ? new Date(bValue).getTime() : Infinity;
      } else if (sortField === 'priority') {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        aValue = priorityOrder[a.priority];
        bValue = priorityOrder[b.priority];
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-400">↕️</span>;
    return <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tasks List</h2>
          <p className="text-muted-foreground">Manage and track all your tasks</p>
        </div>
        <Button size="sm">
          <span className="mr-2">➕</span>
          Add Task
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background text-sm"
              >
                <option value="all">All Status</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
              
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background text-sm"
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedTasks.size > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedTasks.size} task{selectedTasks.size > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Mark as Done</Button>
                <Button variant="outline" size="sm">Change Priority</Button>
                <Button variant="destructive" size="sm">Delete</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Tasks ({filteredTasks.length})</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedTasks.size === filteredTasks.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="p-4 w-12">
                    <input
                      type="checkbox"
                      checked={selectedTasks.size === filteredTasks.length && filteredTasks.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th 
                    className="p-4 cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center gap-2">
                      Task <SortIcon field="title" />
                    </div>
                  </th>
                  <th 
                    className="p-4 cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-2">
                      Status <SortIcon field="status" />
                    </div>
                  </th>
                  <th 
                    className="p-4 cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('priority')}
                  >
                    <div className="flex items-center gap-2">
                      Priority <SortIcon field="priority" />
                    </div>
                  </th>
                  <th 
                    className="p-4 cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('assignee')}
                  >
                    <div className="flex items-center gap-2">
                      Assignee <SortIcon field="assignee" />
                    </div>
                  </th>
                  <th 
                    className="p-4 cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('due_date')}
                  >
                    <div className="flex items-center gap-2">
                      Due Date <SortIcon field="due_date" />
                    </div>
                  </th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => {
                  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
                  
                  return (
                    <tr 
                      key={task.id} 
                      className={cn(
                        "border-b hover:bg-muted/50 transition-colors",
                        selectedTasks.has(task.id) && "bg-muted/30"
                      )}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedTasks.has(task.id)}
                          onChange={() => handleTaskSelect(task.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{task.title}</div>
                          {task.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {task.description}
                            </div>
                          )}
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {task.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {task.tags.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{task.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value as Task['status'])}
                          className={cn(
                            "px-2 py-1 rounded text-xs font-medium border-0",
                            getStatusColor(task.status)
                          )}
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="done">Done</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs", getPriorityColor(task.priority))}
                        >
                          {task.priority}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">{task.assignee || '-'}</div>
                        {task.project && (
                          <div className="text-xs text-muted-foreground">{task.project}</div>
                        )}
                      </td>
                      <td className="p-4">
                        {task.due_date ? (
                          <div className={cn(
                            "text-sm",
                            isOverdue && "text-red-600 font-medium"
                          )}>
                            {formatDate(task.due_date)}
                            {isOverdue && <div className="text-xs">Overdue</div>}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            ✏️
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            🗑️
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredTasks.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                <p className="text-gray-600">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
