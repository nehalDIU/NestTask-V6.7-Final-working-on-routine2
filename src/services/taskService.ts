import { supabase } from '../lib/supabase';
import type { Task, NewTask, TaskCategory, TaskStatus } from '../types/task';
import { sendTaskNotification } from './telegram.service';

export async function fetchUserRole(userId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.user_metadata?.role === 'admin';
  } catch (error) {
    console.error('Error fetching user role:', error);
    return false;
  }
}

export async function fetchTasks(userId: string) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .or(`user_id.eq.${userId},is_admin_task.eq.true`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapTaskFromDB);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
}

export async function createTask(userId: string, task: NewTask, isAdmin: boolean) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        name: task.name,
        category: task.category,
        due_date: task.dueDate,
        description: task.description,
        status: task.status,
        user_id: userId,
        is_admin_task: isAdmin
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      throw new Error('Failed to create task');
    }

    const newTask = mapTaskFromDB(data);
    
    // Send notification to Telegram if it's an admin task
    if (isAdmin) {
      try {
        await sendTaskNotification(newTask);
      } catch (notificationError) {
        console.error('Error sending Telegram notification:', notificationError);
        // Don't throw error, so task creation still succeeds even if notification fails
      }
    }

    return newTask;
  } catch (error) {
    console.error('Error creating task:', error);
    throw new Error('Failed to create task');
  }
}

export async function updateTask(taskId: string, updates: Partial<Task>) {
  try {
    const { error } = await supabase
      .from('tasks')
      .update({
        name: updates.name,
        category: updates.category,
        due_date: updates.dueDate,
        description: updates.description,
        status: updates.status,
      })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task:', error);
      throw new Error('Failed to update task');
    }
  } catch (error) {
    console.error('Error updating task:', error);
    throw new Error('Failed to update task');
  }
}

export async function deleteTask(taskId: string) {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      throw new Error('Failed to delete task');
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    throw new Error('Failed to delete task');
  }
}

function mapTaskFromDB(data: any): Task {
  return {
    id: data.id,
    name: data.name,
    category: data.category,
    dueDate: data.due_date,
    description: data.description,
    status: data.status,
    createdAt: data.created_at,
    isAdminTask: data.is_admin_task
  };
}
