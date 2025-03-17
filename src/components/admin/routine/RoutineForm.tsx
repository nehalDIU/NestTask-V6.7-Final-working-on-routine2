import { useState } from 'react';
import { CalendarDays, Plus } from 'lucide-react';
import type { Routine } from '../../../types/routine';

interface RoutineFormProps {
  onSubmit: (routine: Omit<Routine, 'id' | 'createdAt'>) => Promise<Routine>;
}

export function RoutineForm({ onSubmit }: RoutineFormProps) {
  const [routine, setRoutine] = useState({
    name: '',
    description: '',
    semester: '',
    isActive: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(routine);
      setRoutine({
        name: '',
        description: '',
        semester: '',
        isActive: false
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Routine</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Add a new class schedule</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name
          </label>
          <input
            type="text"
            value={routine.name}
            onChange={(e) => setRoutine(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            value={routine.description}
            onChange={(e) => setRoutine(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white h-32 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Semester
          </label>
          <input
            type="text"
            value={routine.semester}
            onChange={(e) => setRoutine(prev => ({ ...prev, semester: e.target.value }))}
            className="w-full px-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={routine.isActive}
            onChange={(e) => setRoutine(prev => ({ ...prev, isActive: e.target.checked }))}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
            Set as active routine
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`
          w-full mt-6 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white
          ${isSubmitting 
            ? 'bg-blue-400 dark:bg-blue-500 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
          }
          transition-colors duration-200 shadow-sm hover:shadow-md
        `}
      >
        <Plus className="w-5 h-5" />
        {isSubmitting ? 'Creating Routine...' : 'Create Routine'}
      </button>
    </form>
  );
}