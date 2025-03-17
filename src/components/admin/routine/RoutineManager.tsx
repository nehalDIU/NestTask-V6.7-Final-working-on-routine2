import { useState } from 'react';
import { RoutineForm } from './RoutineForm';
import { RoutineList } from './RoutineList';
import { Calendar, Plus } from 'lucide-react';
import type { Routine, RoutineSlot } from '../../../types/routine';
import type { Course } from '../../../types/course';
import type { Teacher } from '../../../types/teacher';

interface RoutineManagerProps {
  routines: Routine[];
  courses: Course[];
  teachers: Teacher[];
  onCreateRoutine: (routine: Omit<Routine, 'id' | 'createdAt'>) => Promise<Routine>;
  onUpdateRoutine: (id: string, updates: Partial<Routine>) => Promise<void>;
  onDeleteRoutine: (id: string) => Promise<void>;
  onAddSlot: (routineId: string, slot: Omit<RoutineSlot, 'id' | 'routineId' | 'createdAt'>) => Promise<RoutineSlot>;
  onUpdateSlot: (routineId: string, slotId: string, updates: Partial<RoutineSlot>) => Promise<void>;
  onDeleteSlot: (routineId: string, slotId: string) => Promise<void>;
  onActivateRoutine: (routineId: string) => Promise<void>;
  onDeactivateRoutine: (routineId: string) => Promise<void>;
}

export function RoutineManager({
  routines,
  courses,
  teachers,
  onCreateRoutine,
  onUpdateRoutine,
  onDeleteRoutine,
  onAddSlot,
  onUpdateSlot,
  onDeleteSlot,
  onActivateRoutine,
  onDeactivateRoutine
}: RoutineManagerProps) {
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Routine Management</h2>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          {showForm ? 'Hide Form' : 'Create New Routine'}
        </button>
      </div>

      {showForm && <RoutineForm onSubmit={onCreateRoutine} />}
      
      <RoutineList 
        routines={routines}
        courses={courses}
        teachers={teachers}
        selectedRoutine={selectedRoutine}
        onSelectRoutine={setSelectedRoutine}
        onUpdateRoutine={onUpdateRoutine}
        onDeleteRoutine={onDeleteRoutine}
        onAddSlot={onAddSlot}
        onUpdateSlot={onUpdateSlot}
        onDeleteSlot={onDeleteSlot}
        onActivateRoutine={onActivateRoutine}
        onDeactivateRoutine={onDeactivateRoutine}
      />
    </div>
  );
}