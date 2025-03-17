import { useState, useEffect, useCallback } from 'react';
import { supabase, testConnection } from '../lib/supabase';
import { fetchTasks, createTask, updateTask, deleteTask } from '../services/task.service';
import { useOfflineStatus } from './useOfflineStatus';
import { saveToIndexedDB, getAllFromIndexedDB, getByIdFromIndexedDB, deleteFromIndexedDB, STORES } from '../utils/offlineStorage';
import type { Task, NewTask } from '../types/task';

// Extended Task type with userId for offline storage
interface OfflineTask extends Task {
  userId: string;
  updatedAt?: string; // Add updatedAt property
}

export function useTasks(userId: string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const isOffline = useOfflineStatus();

  const loadTasks = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      if (isOffline) {
        // If offline, get tasks from IndexedDB
        console.log('Offline mode: Loading tasks from IndexedDB');
        const offlineTasks = await getAllFromIndexedDB(STORES.TASKS);
        
        // Filter tasks for current user
        const userTasks = offlineTasks.filter((task: OfflineTask) => task.userId === userId);
        setTasks(userTasks as Task[]);
      } else {
        // If online, try to get tasks from the server
        // Ensure connection is established
        const isConnected = await testConnection();
        if (!isConnected) {
          throw new Error('Unable to connect to database');
        }

        const data = await fetchTasks(userId);
        setTasks(data);
        
        // Store tasks in IndexedDB for offline use
        // Add userId to each task for offline filtering
        const tasksWithUserId = data.map(task => ({
          ...task,
          userId
        }));
        await saveToIndexedDB(STORES.TASKS, tasksWithUserId);
      }
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setError(err.message || 'Failed to load tasks');
      
      // If online but error occurred, try to load from IndexedDB as fallback
      if (!isOffline) {
        try {
          console.log('Fallback: Loading tasks from IndexedDB after online error');
          const offlineTasks = await getAllFromIndexedDB(STORES.TASKS);
          const userTasks = offlineTasks.filter((task: OfflineTask) => task.userId === userId);
          
          if (userTasks.length > 0) {
            setTasks(userTasks as Task[]);
            setError(null); // Clear error if we successfully loaded fallback data
          }
        } catch (offlineErr) {
          console.error('Error loading fallback tasks:', offlineErr);
        }
      }
      
      // Retry with exponential backoff if it's a connection error and we're online
      if (!isOffline && retryCount < 3) {
        const timeout = Math.min(1000 * Math.pow(2, retryCount), 10000);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, timeout);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, retryCount, isOffline]);

  useEffect(() => {
    if (!userId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    loadTasks();

    // Set up real-time subscription for tasks updates when online
    if (!isOffline) {
      const subscription = supabase
        .channel('tasks_channel')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${userId}`
        }, payload => {
          console.log('Real-time task update:', payload);
          loadTasks();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [userId, loadTasks, isOffline]);

  const handleCreateTask = async (newTask: NewTask) => {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    try {
      setError(null);
      let result: Task;
      
      if (isOffline) {
        // Create a temporary ID for offline mode
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const offlineTask: OfflineTask = {
          ...newTask,
          id: tempId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'my-tasks', // Using valid TaskStatus value
          isAdminTask: false,
          userId // Add userId for offline filtering
        };
        
        // Store in IndexedDB
        await saveToIndexedDB(STORES.TASKS, offlineTask);
        
        // Update local state
        setTasks(prev => [...prev, offlineTask]);
        
        result = offlineTask;
      } else {
        // Create task online
        result = await createTask(userId, newTask);
        
        // Update local state
        setTasks(prev => [...prev, result]);
        
        // Update IndexedDB with userId
        const taskWithUserId: OfflineTask = {
          ...result,
          userId
        };
        await saveToIndexedDB(STORES.TASKS, taskWithUserId);
      }
      
      return result;
    } catch (err: any) {
      console.error('Error creating task:', err);
      setError(err.message || 'Failed to create task');
      throw err;
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      setError(null);
      
      if (isOffline) {
        // Get the current task from IndexedDB
        const existingTask = await getByIdFromIndexedDB(STORES.TASKS, taskId) as OfflineTask;
        
        if (!existingTask) {
          throw new Error('Task not found');
        }
        
        // Update task locally
        const updatedTask: OfflineTask = {
          ...existingTask,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        
        // Store in IndexedDB
        await saveToIndexedDB(STORES.TASKS, updatedTask);
        
        // Update local state
        setTasks(prev => prev.map(task => task.id === taskId ? updatedTask : task));
        
        return updatedTask as Task;
      } else {
        // Update task online
        const result = await updateTask(taskId, updates);
        
        // Update local state
        setTasks(prev => prev.map(task => task.id === taskId ? result : task));
        
        // Update IndexedDB with userId
        const taskWithUserId: OfflineTask = {
          ...result,
          userId: userId || ''
        };
        await saveToIndexedDB(STORES.TASKS, taskWithUserId);
        
        return result;
      }
    } catch (err: any) {
      console.error('Error updating task:', err);
      setError(err.message || 'Failed to update task');
      throw err;
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      setError(null);
      
      if (isOffline) {
        // Remove from IndexedDB
        await deleteFromIndexedDB(STORES.TASKS, taskId);
        
        // Update local state
        setTasks(prev => prev.filter(task => task.id !== taskId));
      } else {
        // Delete from server
        await deleteTask(taskId);
        
        // Update local state
        setTasks(prev => prev.filter(task => task.id !== taskId));
        
        // Remove from IndexedDB
        await deleteFromIndexedDB(STORES.TASKS, taskId);
      }
      
      return true;
    } catch (err: any) {
      console.error('Error deleting task:', err);
      setError(err.message || 'Failed to delete task');
      throw err;
    }
  };

  // Add a function to sync offline changes when coming back online
  const syncOfflineChanges = async () => {
    // This would be called when the app detects it's back online
    // It would process any offline tasks changes and sync them to the server
    // For simplicity, we're not implementing the full sync logic here
    loadTasks();
  };

  return {
    tasks,
    loading,
    error,
    createTask: handleCreateTask,
    updateTask: handleUpdateTask,
    deleteTask: handleDeleteTask,
    refreshTasks: loadTasks,
    isOffline,
    syncOfflineChanges
  };
}