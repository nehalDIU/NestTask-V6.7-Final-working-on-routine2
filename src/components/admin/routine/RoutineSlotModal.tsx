import { useState, useEffect } from 'react';
import { X, Clock, BookOpen, User, MapPin, Users } from 'lucide-react';
import type { RoutineSlot } from '../../../types/routine';
import type { Course } from '../../../types/course';
import type { Teacher } from '../../../types/teacher';

interface RoutineSlotModalProps {
  routineId: string;
  slot: RoutineSlot | null;
  courses: Course[];
  teachers: Teacher[];
  onClose: () => void;
  onSubmit: ((routineId: string, slot: Omit<RoutineSlot, 'id' | 'routineId' | 'createdAt'>) => Promise<RoutineSlot>) | 
            ((routineId: string, slotId: string, updates: Partial<RoutineSlot>) => Promise<void>);
}

export function RoutineSlotModal({
  routineId,
  slot,
  courses,
  teachers,
  onClose,
  onSubmit
}: RoutineSlotModalProps) {
  const [formData, setFormData] = useState<Omit<RoutineSlot, 'id' | 'routineId' | 'createdAt'>>({
    dayOfWeek: slot?.dayOfWeek || 'Sunday',
    startTime: slot?.startTime || '08:00',
    endTime: slot?.endTime || '09:30',
    roomNumber: slot?.roomNumber || '',
    section: slot?.section || '',
    courseId: slot?.courseId || '',
    teacherId: slot?.teacherId || '',
    courseName: slot?.courseName || '',
    teacherName: slot?.teacherName || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{type: 'error' | 'success'; message: string} | null>(null);

  useEffect(() => {
    console.log('RoutineSlotModal opened with routineId:', routineId);
    console.log('Initial form data:', formData);
    
    // Update courseName when courseId changes
    if (formData.courseId) {
      const selectedCourse = courses.find(c => c.id === formData.courseId);
      if (selectedCourse) {
        setFormData(prev => ({
          ...prev,
          courseName: selectedCourse.name
        }));
      }
    } else {
      // Clear courseName if no courseId is selected
      setFormData(prev => ({
        ...prev,
        courseName: ''
      }));
    }

    // Update teacherName when teacherId changes
    if (formData.teacherId) {
      const selectedTeacher = teachers.find(t => t.id === formData.teacherId);
      if (selectedTeacher) {
        setFormData(prev => ({
          ...prev,
          teacherName: selectedTeacher.name
        }));
      }
    } else {
      // Clear teacherName if no teacherId is selected
      setFormData(prev => ({
        ...prev,
        teacherName: ''
      }));
    }
  }, [formData.courseId, formData.teacherId, courses, teachers, routineId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);
    
    try {
      console.log('Submitting form data:', { routineId, formData }); // Add logging to debug
      
      // Ensure course and teacher names are correctly set
      let submissionData = { ...formData };
      
      // Double-check courseName from courseId
      if (submissionData.courseId) {
        const selectedCourse = courses.find(c => c.id === submissionData.courseId);
        if (selectedCourse) {
          submissionData.courseName = selectedCourse.name;
        }
      }
      
      // Double-check teacherName from teacherId
      if (submissionData.teacherId) {
        const selectedTeacher = teachers.find(t => t.id === submissionData.teacherId);
        if (selectedTeacher) {
          submissionData.teacherName = selectedTeacher.name;
        }
      }
      
      if (slot) {
        // Edit existing slot - need to use the 3-parameter version
        const updateFn = onSubmit as (routineId: string, slotId: string, updates: Partial<RoutineSlot>) => Promise<void>;
        await updateFn(routineId, slot.id, submissionData);
      } else {
        // Create new slot - need to use the 2-parameter version
        const createFn = onSubmit as (routineId: string, slot: Omit<RoutineSlot, 'id' | 'routineId' | 'createdAt'>) => Promise<RoutineSlot>;
        // Ensure all required fields are present
        if (!submissionData.dayOfWeek || !submissionData.startTime || !submissionData.endTime) {
          console.error('Missing required fields:', { 
            dayOfWeek: submissionData.dayOfWeek, 
            startTime: submissionData.startTime, 
            endTime: submissionData.endTime 
          });
          setStatusMessage({
            type: 'error', 
            message: 'Please fill in all required fields: Day, Start Time, and End Time'
          });
          throw new Error('Missing required fields');
        }
        
        if (!routineId) {
          console.error('Missing routineId');
          setStatusMessage({
            type: 'error', 
            message: 'No routine selected. Please try again.'
          });
          throw new Error('No routine selected');
        }
        
        await createFn(routineId, submissionData);
        setStatusMessage({
          type: 'success', 
          message: 'Time slot created successfully!'
        });
      }
      // Short delay before closing to show success message
      setTimeout(() => onClose(), 1000);
    } catch (error) {
      console.error('Error saving routine slot:', error);
      if (!statusMessage) {
        setStatusMessage({
          type: 'error', 
          message: 'Failed to save time slot. Please try again.'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {slot ? 'Edit Time Slot' : 'Add Time Slot'}
            </h3>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-500 rounded-full"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {statusMessage && (
              <div className={`p-3 rounded-lg ${
                statusMessage.type === 'error' 
                ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' 
                : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
              }`}>
                {statusMessage.message}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Day of Week
              </label>
              <select
                value={formData.dayOfWeek}
                onChange={(e) => setFormData(prev => ({ ...prev, dayOfWeek: e.target.value }))}
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              >
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Time
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Time
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Course
              </label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData(prev => ({ ...prev, courseId: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Teacher
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData(prev => ({ ...prev, teacherId: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a teacher</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Room Number
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, roomNumber: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g. 302, Lab-1"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Section
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g. A, B, C"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`
                  px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors 
                  ${isSubmitting 
                    ? 'bg-blue-400 dark:bg-blue-500 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                  }
                `}
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}