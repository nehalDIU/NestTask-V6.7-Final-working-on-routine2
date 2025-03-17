import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  fetchRoutines,
  createRoutine as createRoutineService,
  updateRoutine as updateRoutineService,
  deleteRoutine as deleteRoutineService,
  addRoutineSlot as addRoutineSlotService,
  updateRoutineSlot as updateRoutineSlotService,
  deleteRoutineSlot as deleteRoutineSlotService,
  activateRoutine as activateRoutineService,
  deactivateRoutine as deactivateRoutineService
} from '../services/routine.service';
import type { Routine, RoutineSlot } from '../types/routine';
import { useOfflineStatus } from './useOfflineStatus';
import { saveToIndexedDB, getAllFromIndexedDB, STORES } from '../utils/offlineStorage';

export function useRoutines() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isOffline = useOfflineStatus();

  useEffect(() => {
    loadRoutines();

    // Only subscribe to changes when online
    if (!isOffline) {
      const subscription = supabase
        .channel('routines')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'routines'
          },
          () => {
            loadRoutines();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [isOffline]);

  const loadRoutines = async () => {
    try {
      setLoading(true);
      
      if (isOffline) {
        // When offline, get routines from IndexedDB
        console.log('Offline mode: Loading routines from IndexedDB');
        const offlineRoutines = await getAllFromIndexedDB(STORES.ROUTINES);
        if (offlineRoutines && offlineRoutines.length > 0) {
          console.log('Found offline routines:', offlineRoutines.length);
          setRoutines(offlineRoutines);
        } else {
          console.log('No offline routines found');
          setRoutines([]);
        }
      } else {
        // When online, fetch from API and save to IndexedDB
        const data = await fetchRoutines();
        setRoutines(data);
        
        // Store routines in IndexedDB for offline use
        if (data && data.length > 0) {
          await saveToIndexedDB(STORES.ROUTINES, data);
          console.log('Saved routines to IndexedDB for offline use');
        }
      }
    } catch (err: any) {
      console.error('Error loading routines:', err);
      setError(err.message);
      
      // If online fetch failed, try to load from IndexedDB as fallback
      if (!isOffline) {
        try {
          const offlineRoutines = await getAllFromIndexedDB(STORES.ROUTINES);
          if (offlineRoutines && offlineRoutines.length > 0) {
            console.log('Using cached routines due to fetch error');
            setRoutines(offlineRoutines);
          }
        } catch (offlineErr) {
          console.error('Error loading fallback routines:', offlineErr);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const createRoutine = async (routine: Omit<Routine, 'id' | 'createdAt'>) => {
    try {
      setError(null);
      
      if (isOffline) {
        // In offline mode, create a temporary ID and store locally
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const offlineRoutine: Routine = {
          ...routine,
          id: tempId,
          createdAt: new Date().toISOString(),
          slots: [],
          _isOffline: true // Mark as created offline for sync later
        };
        
        await saveToIndexedDB(STORES.ROUTINES, offlineRoutine);
        setRoutines(prev => [offlineRoutine, ...prev]);
        return offlineRoutine;
      } else {
        // Online mode - create on server
        const newRoutine = await createRoutineService(routine);
        setRoutines(prev => [newRoutine, ...prev]);
        
        // Update in IndexedDB
        await saveToIndexedDB(STORES.ROUTINES, newRoutine);
        
        return newRoutine;
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateRoutine = async (id: string, updates: Partial<Routine>) => {
    try {
      setError(null);
      
      if (isOffline) {
        // In offline mode, update local copy
        const existingRoutines = await getAllFromIndexedDB(STORES.ROUTINES);
        const routineToUpdate = existingRoutines.find((r: Routine) => r.id === id);
        
        if (routineToUpdate) {
          const updatedRoutine = { ...routineToUpdate, ...updates, _isOfflineUpdated: true };
          await saveToIndexedDB(STORES.ROUTINES, updatedRoutine);
          
          setRoutines(prev =>
            prev.map(routine =>
              routine.id === id ? { ...routine, ...updates } : routine
            )
          );
        }
      } else {
        // Online mode - update on server
        await updateRoutineService(id, updates);
        
        setRoutines(prev =>
          prev.map(routine =>
            routine.id === id ? { ...routine, ...updates } : routine
          )
        );
        
        // Update in IndexedDB
        const existingRoutines = await getAllFromIndexedDB(STORES.ROUTINES);
        const routineToUpdate = existingRoutines.find((r: Routine) => r.id === id);
        
        if (routineToUpdate) {
          const updatedRoutine = { ...routineToUpdate, ...updates };
          await saveToIndexedDB(STORES.ROUTINES, updatedRoutine);
        }
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteRoutine = async (id: string) => {
    try {
      setError(null);
      
      if (isOffline) {
        // In offline mode, mark for deletion but don't remove from IndexedDB yet
        // Instead, we'll add a flag to delete it when back online
        const existingRoutines = await getAllFromIndexedDB(STORES.ROUTINES);
        const routineToDelete = existingRoutines.find((r: Routine) => r.id === id);
        
        if (routineToDelete) {
          const markedRoutine = { ...routineToDelete, _isOfflineDeleted: true };
          await saveToIndexedDB(STORES.ROUTINES, markedRoutine);
        }
        
        // Remove from state
        setRoutines(prev => prev.filter(routine => routine.id !== id));
      } else {
        // Online mode - delete from server
        await deleteRoutineService(id);
        setRoutines(prev => prev.filter(routine => routine.id !== id));
        
        // Also delete from IndexedDB
        try {
          const existingRoutines = await getAllFromIndexedDB(STORES.ROUTINES);
          const updatedRoutines = existingRoutines.filter((r: Routine) => r.id !== id);
          await saveToIndexedDB(STORES.ROUTINES, updatedRoutines);
        } catch (dbErr) {
          console.error('Error updating IndexedDB after deletion:', dbErr);
        }
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const addRoutineSlot = async (routineId: string, slot: Omit<RoutineSlot, 'id' | 'routineId' | 'createdAt'>) => {
    try {
      setError(null);
      console.log('Adding routine slot:', { routineId, slot }); // Debug log
      
      if (isOffline) {
        // In offline mode, create temporary slot
        const tempId = `temp-slot-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const newSlot: RoutineSlot = {
          ...slot,
          id: tempId,
          routineId,
          createdAt: new Date().toISOString(),
          _isOffline: true // Mark as created offline
        };
        
        // Update routine in state and IndexedDB
        const updatedRoutines = await getAllFromIndexedDB(STORES.ROUTINES);
        const routineIndex = updatedRoutines.findIndex((r: Routine) => r.id === routineId);
        
        if (routineIndex >= 0) {
          const routine = updatedRoutines[routineIndex];
          const updatedRoutine = {
            ...routine,
            slots: [...(routine.slots || []), newSlot]
          };
          
          updatedRoutines[routineIndex] = updatedRoutine;
          await saveToIndexedDB(STORES.ROUTINES, updatedRoutines);
          
          setRoutines(prev =>
            prev.map(r =>
              r.id === routineId
                ? {
                    ...r,
                    slots: [...(r.slots || []), newSlot]
                  }
                : r
            )
          );
          
          return newSlot;
        } else {
          throw new Error('Routine not found');
        }
      } else {
        // Online mode - add slot on server
        const newSlot = await addRoutineSlotService(routineId, slot);
        console.log('New slot created:', newSlot); // Debug log
        
        // Update routine in state
        setRoutines(prev =>
          prev.map(r =>
            r.id === routineId
              ? {
                  ...r,
                  slots: [...(r.slots || []), newSlot]
                }
              : r
          )
        );
        
        // Update in IndexedDB
        try {
          const existingRoutines = await getAllFromIndexedDB(STORES.ROUTINES);
          const routineToUpdate = existingRoutines.find((r: Routine) => r.id === routineId);
          
          if (routineToUpdate) {
            const updatedRoutine = {
              ...routineToUpdate,
              slots: [...(routineToUpdate.slots || []), newSlot]
            };
            await saveToIndexedDB(STORES.ROUTINES, updatedRoutine);
          }
        } catch (dbErr) {
          console.error('Error updating IndexedDB after adding slot:', dbErr);
        }
        
        return newSlot;
      }
    } catch (err: any) {
      console.error('Error adding routine slot:', err);
      setError(err.message);
      throw err;
    }
  };

  const updateRoutineSlot = async (routineId: string, slotId: string, updates: Partial<RoutineSlot>) => {
    try {
      setError(null);
      
      if (isOffline) {
        // In offline mode, update locally
        const existingRoutines = await getAllFromIndexedDB(STORES.ROUTINES);
        const routineIndex = existingRoutines.findIndex((r: Routine) => r.id === routineId);
        
        if (routineIndex >= 0) {
          const routine = existingRoutines[routineIndex];
          const updatedRoutine = {
            ...routine,
            slots: routine.slots?.map(slot =>
              slot.id === slotId 
                ? { ...slot, ...updates, _isOfflineUpdated: true } 
                : slot
            )
          };
          
          existingRoutines[routineIndex] = updatedRoutine;
          await saveToIndexedDB(STORES.ROUTINES, existingRoutines);
          
          setRoutines(prev =>
            prev.map(r =>
              r.id === routineId
                ? {
                    ...r,
                    slots: r.slots?.map(slot =>
                      slot.id === slotId ? { ...slot, ...updates } : slot
                    )
                  }
                : r
            )
          );
        }
      } else {
        // Online mode
        await updateRoutineSlotService(routineId, slotId, updates);
        
        setRoutines(prev =>
          prev.map(routine =>
            routine.id === routineId
              ? {
                  ...routine,
                  slots: routine.slots?.map(slot =>
                    slot.id === slotId ? { ...slot, ...updates } : slot
                  )
                }
              : routine
          )
        );
        
        // Update in IndexedDB
        try {
          const existingRoutines = await getAllFromIndexedDB(STORES.ROUTINES);
          const routineIndex = existingRoutines.findIndex((r: Routine) => r.id === routineId);
          
          if (routineIndex >= 0) {
            const routine = existingRoutines[routineIndex];
            const updatedRoutine = {
              ...routine,
              slots: routine.slots?.map(slot =>
                slot.id === slotId ? { ...slot, ...updates } : slot
              )
            };
            
            existingRoutines[routineIndex] = updatedRoutine;
            await saveToIndexedDB(STORES.ROUTINES, existingRoutines);
          }
        } catch (dbErr) {
          console.error('Error updating IndexedDB after slot update:', dbErr);
        }
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteRoutineSlot = async (routineId: string, slotId: string) => {
    try {
      setError(null);
      
      if (isOffline) {
        // Mark slot for deletion in offline mode
        const existingRoutines = await getAllFromIndexedDB(STORES.ROUTINES);
        const routineIndex = existingRoutines.findIndex((r: Routine) => r.id === routineId);
        
        if (routineIndex >= 0) {
          const routine = existingRoutines[routineIndex];
          
          // If it's a temp slot (created offline), remove it entirely 
          // Otherwise mark it for deletion with a flag
          const updatedSlots = routine.slots?.map(slot => 
            slot.id === slotId ? { ...slot, _isOfflineDeleted: true } : slot
          ).filter(slot => 
            !(slot.id === slotId && slot._isOffline) // Remove temporary slots immediately
          );
          
          const updatedRoutine = {
            ...routine,
            slots: updatedSlots
          };
          
          existingRoutines[routineIndex] = updatedRoutine;
          await saveToIndexedDB(STORES.ROUTINES, existingRoutines);
        }
        
        // Update state
        setRoutines(prev =>
          prev.map(routine =>
            routine.id === routineId
              ? {
                  ...routine,
                  slots: routine.slots?.filter(slot => slot.id !== slotId)
                }
              : routine
          )
        );
      } else {
        // Online mode
        await deleteRoutineSlotService(routineId, slotId);
        
        setRoutines(prev =>
          prev.map(routine =>
            routine.id === routineId
              ? {
                  ...routine,
                  slots: routine.slots?.filter(slot => slot.id !== slotId)
                }
              : routine
          )
        );
        
        // Update in IndexedDB
        try {
          const existingRoutines = await getAllFromIndexedDB(STORES.ROUTINES);
          const routineIndex = existingRoutines.findIndex((r: Routine) => r.id === routineId);
          
          if (routineIndex >= 0) {
            const routine = existingRoutines[routineIndex];
            const updatedRoutine = {
              ...routine,
              slots: routine.slots?.filter(slot => slot.id !== slotId)
            };
            
            existingRoutines[routineIndex] = updatedRoutine;
            await saveToIndexedDB(STORES.ROUTINES, existingRoutines);
          }
        } catch (dbErr) {
          console.error('Error updating IndexedDB after slot deletion:', dbErr);
        }
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Sync offline changes when back online
  const syncOfflineChanges = async () => {
    if (isOffline) return; // Only sync when online
    
    try {
      const offlineRoutines = await getAllFromIndexedDB(STORES.ROUTINES);
      let syncedRoutines = [...offlineRoutines];
      let hasChanges = false;
      
      // Process each routine for offline changes
      for (const routine of offlineRoutines) {
        // Handle routine deletions
        if (routine._isOfflineDeleted) {
          try {
            await deleteRoutineService(routine.id);
            syncedRoutines = syncedRoutines.filter(r => r.id !== routine.id);
            hasChanges = true;
          } catch (err) {
            console.error(`Failed to sync delete for routine ${routine.id}:`, err);
          }
          continue;
        }
        
        // Handle new routines created offline
        if (routine._isOffline) {
          try {
            // Remove offline flags
            const { _isOffline, ...routineData } = routine;
            const newRoutine = await createRoutineService(routineData);
            
            // Replace the temp routine with the server one
            syncedRoutines = syncedRoutines.filter(r => r.id !== routine.id);
            syncedRoutines.push(newRoutine);
            hasChanges = true;
          } catch (err) {
            console.error(`Failed to sync new routine ${routine.id}:`, err);
          }
          continue;
        }
        
        // Handle routine updates
        if (routine._isOfflineUpdated) {
          try {
            const { _isOfflineUpdated, ...routineData } = routine;
            await updateRoutineService(routine.id, routineData);
            
            // Update the synced version
            const index = syncedRoutines.findIndex(r => r.id === routine.id);
            if (index >= 0) {
              syncedRoutines[index] = { ...routineData };
              hasChanges = true;
            }
          } catch (err) {
            console.error(`Failed to sync routine update ${routine.id}:`, err);
          }
        }
        
        // Handle slot changes
        if (routine.slots && routine.slots.length > 0) {
          let slotsChanged = false;
          const syncedSlots = [...routine.slots];
          
          for (const slot of routine.slots) {
            // Handle slot deletions
            if (slot._isOfflineDeleted) {
              try {
                await deleteRoutineSlotService(routine.id, slot.id);
                const slotIndex = syncedSlots.findIndex(s => s.id === slot.id);
                if (slotIndex >= 0) {
                  syncedSlots.splice(slotIndex, 1);
                  slotsChanged = true;
                }
              } catch (err) {
                console.error(`Failed to sync slot deletion ${slot.id}:`, err);
              }
              continue;
            }
            
            // Handle new slots
            if (slot._isOffline) {
              try {
                const { _isOffline, id, routineId, createdAt, ...slotData } = slot;
                const newSlot = await addRoutineSlotService(routine.id, slotData);
                
                // Replace temp slot with server one
                const slotIndex = syncedSlots.findIndex(s => s.id === slot.id);
                if (slotIndex >= 0) {
                  syncedSlots[slotIndex] = newSlot;
                  slotsChanged = true;
                }
              } catch (err) {
                console.error(`Failed to sync new slot ${slot.id}:`, err);
              }
              continue;
            }
            
            // Handle slot updates
            if (slot._isOfflineUpdated) {
              try {
                const { _isOfflineUpdated, ...slotData } = slot;
                await updateRoutineSlotService(routine.id, slot.id, slotData);
                
                // Update slot in synced version
                const slotIndex = syncedSlots.findIndex(s => s.id === slot.id);
                if (slotIndex >= 0) {
                  syncedSlots[slotIndex] = { ...slotData, id: slot.id, routineId: routine.id };
                  slotsChanged = true;
                }
              } catch (err) {
                console.error(`Failed to sync slot update ${slot.id}:`, err);
              }
            }
          }
          
          // Update routine with synced slots
          if (slotsChanged) {
            const routineIndex = syncedRoutines.findIndex(r => r.id === routine.id);
            if (routineIndex >= 0) {
              syncedRoutines[routineIndex] = {
                ...syncedRoutines[routineIndex],
                slots: syncedSlots
              };
              hasChanges = true;
            }
          }
        }
      }
      
      // Save synced routines back to IndexedDB and update state
      if (hasChanges) {
        await saveToIndexedDB(STORES.ROUTINES, syncedRoutines);
        setRoutines(syncedRoutines);
        console.log('Offline routine changes synced successfully');
      }
      
    } catch (err) {
      console.error('Error syncing offline routine changes:', err);
      setError('Failed to sync offline changes');
    }
  };

  return {
    routines,
    loading,
    error,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    addRoutineSlot,
    updateRoutineSlot,
    deleteRoutineSlot,
    activateRoutine: async (routineId: string) => {
      try {
        setError(null);
        
        if (isOffline) {
          // When offline, just update state but mark for syncing later
          setRoutines(prev => 
            prev.map(routine => ({
              ...routine,
              isActive: routine.id === routineId,
              _needsActivationSync: routine.id === routineId ? true : undefined
            }))
          );
          
          // Update IndexedDB
          const existingRoutines = await getAllFromIndexedDB(STORES.ROUTINES);
          const updatedRoutines = existingRoutines.map((routine: Routine) => ({
            ...routine,
            isActive: routine.id === routineId,
            _needsActivationSync: routine.id === routineId ? true : undefined
          }));
          
          await saveToIndexedDB(STORES.ROUTINES, updatedRoutines);
        } else {
          // Online mode, use the service
          await activateRoutineService(routineId);
          
          // Update state
          setRoutines(prev => 
            prev.map(routine => ({
              ...routine,
              isActive: routine.id === routineId
            }))
          );
          
          // Update in IndexedDB
          const existingRoutines = await getAllFromIndexedDB(STORES.ROUTINES);
          const updatedRoutines = existingRoutines.map((routine: Routine) => ({
            ...routine,
            isActive: routine.id === routineId
          }));
          
          await saveToIndexedDB(STORES.ROUTINES, updatedRoutines);
        }
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    deactivateRoutine: async (routineId: string) => {
      try {
        setError(null);
        
        if (isOffline) {
          // When offline, just update state but mark for syncing later
          setRoutines(prev => 
            prev.map(routine => ({
              ...routine,
              isActive: routine.id === routineId ? false : routine.isActive,
              _needsDeactivationSync: routine.id === routineId ? true : undefined
            }))
          );
          
          // Update IndexedDB
          const existingRoutines = await getAllFromIndexedDB(STORES.ROUTINES);
          const updatedRoutines = existingRoutines.map((routine: Routine) => ({
            ...routine,
            isActive: routine.id === routineId ? false : routine.isActive,
            _needsDeactivationSync: routine.id === routineId ? true : undefined
          }));
          
          await saveToIndexedDB(STORES.ROUTINES, updatedRoutines);
        } else {
          // Online mode, use the service
          await deactivateRoutineService(routineId);
          
          // Update state
          setRoutines(prev => 
            prev.map(routine => ({
              ...routine,
              isActive: routine.id === routineId ? false : routine.isActive
            }))
          );
          
          // Update in IndexedDB
          const existingRoutines = await getAllFromIndexedDB(STORES.ROUTINES);
          const updatedRoutines = existingRoutines.map((routine: Routine) => ({
            ...routine,
            isActive: routine.id === routineId ? false : routine.isActive
          }));
          
          await saveToIndexedDB(STORES.ROUTINES, updatedRoutines);
        }
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    syncOfflineChanges,
    isOffline
  };
}