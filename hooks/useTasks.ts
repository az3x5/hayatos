import { useState, useEffect, useCallback } from 'react';
import { Task, CreateTaskRequest, UpdateTaskRequest } from '@/types/database';
import { tasksApi } from '@/lib/api';

interface UseTasksOptions {
  status?: string;
  project_id?: string;
  priority?: string;
  due_before?: string;
  due_after?: string;
  search?: string;
  tags?: string;
  include_completed?: boolean;
  autoFetch?: boolean;
}

interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  pagination: any;
  refetch: () => Promise<void>;
  createTask: (task: CreateTaskRequest) => Promise<Task | null>;
  updateTask: (id: string, updates: Partial<UpdateTaskRequest>) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<boolean>;
  completeTask: (id: string) => Promise<Task | null>;
}

export function useTasks(options: UseTasksOptions = {}): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);

  const { autoFetch = true, ...filterOptions } = options;

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await tasksApi.getTasks(filterOptions);
      
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setTasks(result.data.data || []);
        setPagination(result.data.pagination);
      }
    } catch (err) {
      setError('Failed to fetch tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filterOptions)]);

  const createTask = useCallback(async (taskData: CreateTaskRequest): Promise<Task | null> => {
    try {
      const result = await tasksApi.createTask(taskData);
      
      if (result.error) {
        setError(result.error);
        return null;
      }
      
      if (result.data) {
        setTasks(prev => [result.data!, ...prev]);
        return result.data;
      }
      
      return null;
    } catch (err) {
      setError('Failed to create task');
      console.error('Error creating task:', err);
      return null;
    }
  }, []);

  const updateTask = useCallback(async (id: string, updates: Partial<UpdateTaskRequest>): Promise<Task | null> => {
    try {
      const result = await tasksApi.updateTask(id, updates);
      
      if (result.error) {
        setError(result.error);
        return null;
      }
      
      if (result.data) {
        setTasks(prev => prev.map(task => task.id === id ? result.data! : task));
        return result.data;
      }
      
      return null;
    } catch (err) {
      setError('Failed to update task');
      console.error('Error updating task:', err);
      return null;
    }
  }, []);

  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    try {
      const result = await tasksApi.deleteTask(id);
      
      if (result.error) {
        setError(result.error);
        return false;
      }
      
      setTasks(prev => prev.filter(task => task.id !== id));
      return true;
    } catch (err) {
      setError('Failed to delete task');
      console.error('Error deleting task:', err);
      return false;
    }
  }, []);

  const completeTask = useCallback(async (id: string): Promise<Task | null> => {
    return updateTask(id, { status: 'done' });
  }, [updateTask]);

  useEffect(() => {
    if (autoFetch) {
      fetchTasks();
    }
  }, [fetchTasks, autoFetch]);

  return {
    tasks,
    loading,
    error,
    pagination,
    refetch: fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
  };
}

// Hook for a single task
export function useTask(id: string | null) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTask = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const result = await tasksApi.getTask(id);
      
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setTask(result.data);
      }
    } catch (err) {
      setError('Failed to fetch task');
      console.error('Error fetching task:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  return {
    task,
    loading,
    error,
    refetch: fetchTask,
  };
}

// Hook for overdue tasks
export function useOverdueTasks() {
  return useTasks({
    due_before: new Date().toISOString(),
    include_completed: false,
  });
}

// Hook for tasks due today
export function useTasksDueToday() {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

  return useTasks({
    due_after: startOfDay,
    due_before: endOfDay,
    include_completed: false,
  });
}

// Hook for tasks by status
export function useTasksByStatus(status: 'inbox' | 'todo' | 'doing' | 'done') {
  return useTasks({ status });
}

// Hook for tasks by project
export function useTasksByProject(projectId: string) {
  return useTasks({ project_id: projectId });
}
