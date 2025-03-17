import { supabase } from '../lib/supabase';
import type { Routine, RoutineSlot } from '../types/routine';

export async function fetchRoutines(): Promise<Routine[]> {
  try {
    const { data: routines, error: routinesError } = await supabase
      .from('routines')
      .select(`
        *,
        slots:routine_slots (
          id,
          day_of_week,
          start_time,
          end_time,
          room_number,
          section,
          course_id,
          teacher_id,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    if (routinesError) throw routinesError;

    return routines.map(routine => ({
      id: routine.id,
      name: routine.name,
      description: routine.description,
      semester: routine.semester,
      isActive: routine.is_active,
      createdAt: routine.created_at,
      createdBy: routine.created_by,
      slots: routine.slots?.map(slot => ({
        id: slot.id,
        routineId: routine.id,
        courseId: slot.course_id,
        teacherId: slot.teacher_id,
        courseName: '',
        teacherName: '',
        dayOfWeek: slot.day_of_week,
        startTime: slot.start_time,
        endTime: slot.end_time,
        roomNumber: slot.room_number,
        section: slot.section,
        createdAt: slot.created_at
      }))
    }));
  } catch (error) {
    console.error('Error fetching routines:', error);
    throw error;
  }
}

export async function createRoutine(routine: Omit<Routine, 'id' | 'createdAt' | 'createdBy'>): Promise<Routine> {
  try {
    const { data, error } = await supabase
      .from('routines')
      .insert({
        name: routine.name,
        description: routine.description,
        semester: routine.semester,
        is_active: routine.isActive
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      semester: data.semester,
      isActive: data.is_active,
      createdAt: data.created_at,
      createdBy: data.created_by,
      slots: []
    };
  } catch (error) {
    console.error('Error creating routine:', error);
    throw error;
  }
}

export async function updateRoutine(id: string, updates: Partial<Routine>): Promise<void> {
  try {
    const { error } = await supabase
      .from('routines')
      .update({
        name: updates.name,
        description: updates.description,
        semester: updates.semester,
        is_active: updates.isActive
      })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating routine:', error);
    throw error;
  }
}

export async function deleteRoutine(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('routines')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting routine:', error);
    throw error;
  }
}

export async function addRoutineSlot(
  routineId: string,
  slot: Omit<RoutineSlot, 'id' | 'routineId' | 'createdAt'>
): Promise<RoutineSlot> {
  try {
    console.log('Service: Adding routine slot', { routineId, slot });

    if (!routineId) {
      console.error('Missing routineId');
      throw new Error('Missing routine ID');
    }
    
    if (!slot) {
      console.error('Missing slot data');
      throw new Error('Missing slot data');
    }
    
    if (!slot.dayOfWeek) {
      console.error('Missing dayOfWeek');
      throw new Error('Day of week is required');
    }
    
    if (!slot.startTime) {
      console.error('Missing startTime');
      throw new Error('Start time is required');
    }
    
    if (!slot.endTime) {
      console.error('Missing endTime');
      throw new Error('End time is required');
    }

    const { data, error } = await supabase
      .from('routine_slots')
      .insert({
        routine_id: routineId,
        day_of_week: slot.dayOfWeek,
        start_time: slot.startTime,
        end_time: slot.endTime,
        room_number: slot.roomNumber || null,
        section: slot.section || null,
        course_id: slot.courseId || null,
        teacher_id: slot.teacherId || null
      })
      .select('*')
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Failed to add routine slot: ${error.message}`);
    }

    if (!data) {
      console.error('No data returned from database');
      throw new Error('No data returned from database');
    }

    const result = {
      id: data.id,
      routineId: data.routine_id,
      courseId: data.course_id,
      teacherId: data.teacher_id,
      courseName: slot.courseName || '',
      teacherName: slot.teacherName || '',
      dayOfWeek: data.day_of_week,
      startTime: data.start_time,
      endTime: data.end_time,
      roomNumber: data.room_number,
      section: data.section,
      createdAt: data.created_at
    };
    
    console.log('Service: Successfully added routine slot', result);
    
    return result;
  } catch (error: any) {
    console.error('Error adding routine slot:', error);
    throw new Error(error.message || 'Failed to add routine slot');
  }
}

export async function updateRoutineSlot(
  routineId: string,
  slotId: string,
  updates: Partial<RoutineSlot>
): Promise<void> {
  try {
    console.log('Updating routine slot:', { routineId, slotId, updates });
    
    const { error } = await supabase
      .from('routine_slots')
      .update({
        course_id: updates.courseId,
        teacher_id: updates.teacherId,
        day_of_week: updates.dayOfWeek,
        start_time: updates.startTime,
        end_time: updates.endTime,
        room_number: updates.roomNumber,
        section: updates.section
      })
      .eq('id', slotId)
      .eq('routine_id', routineId);

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log('Successfully updated routine slot');
  } catch (error) {
    console.error('Error updating routine slot:', error);
    throw error;
  }
}

export async function deleteRoutineSlot(routineId: string, slotId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('routine_slots')
      .delete()
      .eq('id', slotId)
      .eq('routine_id', routineId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting routine slot:', error);
    throw error;
  }
}

/**
 * Activates a specific routine and deactivates all others
 * @param routineId The ID of the routine to activate
 * @returns Promise that resolves when the routine is activated
 */
export async function activateRoutine(routineId: string): Promise<void> {
  try {
    // Get all routines
    const routines = await fetchRoutines();
    
    // Deactivate all routines
    for (const routine of routines) {
      if (routine.isActive && routine.id !== routineId) {
        await updateRoutine(routine.id, { isActive: false });
      }
    }
    
    // Activate the selected routine
    await updateRoutine(routineId, { isActive: true });
    
  } catch (error) {
    console.error('Error activating routine:', error);
    throw error;
  }
}

/**
 * Deactivates a specific routine without activating others
 * @param routineId The ID of the routine to deactivate
 * @returns Promise that resolves when the routine is deactivated
 */
export async function deactivateRoutine(routineId: string): Promise<void> {
  try {
    await updateRoutine(routineId, { isActive: false });
  } catch (error) {
    console.error('Error deactivating routine:', error);
    throw error;
  }
}