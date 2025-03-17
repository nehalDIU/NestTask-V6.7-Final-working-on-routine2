import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  fetchTeachers, 
  createTeacher, 
  updateTeacher, 
  deleteTeacher 
} from '../services/teacher.service';
import type { Teacher, NewTeacher } from '../types/teacher';

export function useTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTeachers();

    // Subscribe to changes
    const subscription = supabase
      .channel('teachers')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teachers'
        },
        () => {
          loadTeachers();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const data = await fetchTeachers();
      setTeachers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeacher = async (teacher: NewTeacher, courseIds: string[]) => {
    try {
      setError(null);
      await createTeacher(teacher, courseIds);
      await loadTeachers();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const handleUpdateTeacher = async (id: string, updates: Partial<Teacher>, courseIds: string[]) => {
    try {
      setError(null);
      await updateTeacher(id, updates, courseIds);
      await loadTeachers();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    try {
      setError(null);
      await deleteTeacher(id);
      await loadTeachers();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    teachers,
    loading,
    error,
    createTeacher: handleCreateTeacher,
    updateTeacher: handleUpdateTeacher,
    deleteTeacher: handleDeleteTeacher,
  };
}