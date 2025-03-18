import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { 
  fetchTeachers, 
  createTeacher, 
  updateTeacher, 
  deleteTeacher 
} from '../services/teacher.service';
import type { Teacher, NewTeacher } from '../types/teacher';
import { useOfflineStatus } from './useOfflineStatus';
import { saveToIndexedDB, getAllFromIndexedDB, getByIdFromIndexedDB, STORES } from '../utils/offlineStorage';

// Define cache timestamp key
const TEACHERS_CACHE_TIMESTAMP_KEY = 'teachers_last_fetched';

export function useTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isOffline = useOfflineStatus();

  const loadTeachers = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      if (isOffline) {
        // When offline, get teachers from IndexedDB
        console.log('Offline mode: Loading teachers from IndexedDB');
        const offlineTeachers = await getAllFromIndexedDB(STORES.TEACHERS);
        if (offlineTeachers && offlineTeachers.length > 0) {
          console.log('Found offline teachers:', offlineTeachers.length);
          setTeachers(offlineTeachers);
        } else {
          console.log('No offline teachers found');
          setTeachers([]);
        }
      } else {
        // When online, check if we need to refresh cache
        const lastFetched = localStorage.getItem(TEACHERS_CACHE_TIMESTAMP_KEY);
        const cacheAge = lastFetched ? Date.now() - parseInt(lastFetched) : Infinity;
        const cacheExpired = cacheAge > 1000 * 60 * 60; // 60 minutes cache lifetime
        
        if (forceRefresh || cacheExpired) {
          // Fetch from API and save to IndexedDB
          const data = await fetchTeachers();
          setTeachers(data);
          
          // Store teachers in IndexedDB for offline use
          if (data && data.length > 0) {
            await saveToIndexedDB(STORES.TEACHERS, data);
            // Update cache timestamp
            localStorage.setItem(TEACHERS_CACHE_TIMESTAMP_KEY, Date.now().toString());
            console.log('Saved teachers to IndexedDB for offline use');
          }
        } else {
          // Use cached data for better performance
          console.log('Using cached teachers - cache age:', Math.round(cacheAge / 1000), 'seconds');
          const cachedTeachers = await getAllFromIndexedDB(STORES.TEACHERS);
          if (cachedTeachers && cachedTeachers.length > 0) {
            setTeachers(cachedTeachers);
          } else {
            // If cache is empty, force a refresh
            const data = await fetchTeachers();
            setTeachers(data);
            if (data && data.length > 0) {
              await saveToIndexedDB(STORES.TEACHERS, data);
              localStorage.setItem(TEACHERS_CACHE_TIMESTAMP_KEY, Date.now().toString());
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Error loading teachers:', err);
      setError(err.message);
      
      // If online fetch failed, try to load from IndexedDB as fallback
      if (!isOffline) {
        try {
          const offlineTeachers = await getAllFromIndexedDB(STORES.TEACHERS);
          if (offlineTeachers && offlineTeachers.length > 0) {
            console.log('Using cached teachers due to fetch error');
            setTeachers(offlineTeachers);
          }
        } catch (offlineErr) {
          console.error('Error loading fallback teachers:', offlineErr);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [isOffline]);

  useEffect(() => {
    loadTeachers();

    // Subscribe to changes when online
    if (!isOffline) {
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
            loadTeachers(true);
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [loadTeachers, isOffline]);

  const handleCreateTeacher = async (teacher: NewTeacher, courseIds: string[]) => {
    try {
      setError(null);
      
      if (isOffline) {
        // In offline mode, create a temporary teacher with an ID
        const tempId = `temp-teacher-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const offlineTeacher: Teacher = {
          ...teacher,
          id: tempId,
          createdAt: new Date().toISOString(),
          courses: courseIds.map(id => ({ id })),
          _isOffline: true // Mark as created offline
        };
        
        // Add to state and IndexedDB
        setTeachers(prev => [...prev, offlineTeacher]);
        await saveToIndexedDB(STORES.TEACHERS, offlineTeacher);
        
        return offlineTeacher;
      } else {
        // Online mode
        await createTeacher(teacher, courseIds);
        await loadTeachers(true);
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const handleUpdateTeacher = async (id: string, updates: Partial<Teacher>, courseIds: string[]) => {
    try {
      setError(null);
      
      if (isOffline) {
        // In offline mode, update locally
        const existingTeacher = await getByIdFromIndexedDB(STORES.TEACHERS, id) as Teacher;
        
        if (!existingTeacher) {
          throw new Error('Teacher not found');
        }
        
        const updatedTeacher = { 
          ...existingTeacher, 
          ...updates, 
          courses: courseIds.map(id => ({ id })),
          _isOfflineUpdated: true 
        };
        
        // Update state and IndexedDB
        setTeachers(prev => prev.map(t => t.id === id ? updatedTeacher : t));
        await saveToIndexedDB(STORES.TEACHERS, updatedTeacher);
        
        return updatedTeacher;
      } else {
        // Online mode
        await updateTeacher(id, updates, courseIds);
        await loadTeachers(true);
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    try {
      setError(null);
      
      if (isOffline) {
        // In offline mode, mark for deletion or remove if temporary
        const existingTeacher = await getByIdFromIndexedDB(STORES.TEACHERS, id) as Teacher;
        
        if (existingTeacher) {
          if (existingTeacher._isOffline) {
            // If it's a temp teacher, remove it entirely
            setTeachers(prev => prev.filter(t => t.id !== id));
            const allTeachers = await getAllFromIndexedDB(STORES.TEACHERS);
            const updatedTeachers = allTeachers.filter((t: Teacher) => t.id !== id);
            await saveToIndexedDB(STORES.TEACHERS, updatedTeachers);
          } else {
            // Otherwise mark for deletion
            const markedTeacher = { ...existingTeacher, _isOfflineDeleted: true };
            await saveToIndexedDB(STORES.TEACHERS, markedTeacher);
            setTeachers(prev => prev.filter(t => t.id !== id));
          }
        }
      } else {
        // Online mode
        await deleteTeacher(id);
        setTeachers(prev => prev.filter(t => t.id !== id));
        
        // Remove from IndexedDB
        const allTeachers = await getAllFromIndexedDB(STORES.TEACHERS);
        const updatedTeachers = allTeachers.filter((t: Teacher) => t.id !== id);
        await saveToIndexedDB(STORES.TEACHERS, updatedTeachers);
        
        // Update cache timestamp
        localStorage.setItem(TEACHERS_CACHE_TIMESTAMP_KEY, Date.now().toString());
      }
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
    refreshTeachers: () => loadTeachers(true),
    isOffline
  };
}