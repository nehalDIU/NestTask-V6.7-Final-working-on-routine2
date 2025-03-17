import { useState } from 'react';
import { 
  Book, 
  Code, 
  User, 
  Clock, 
  GitBranch as BrandTelegram, 
  Plus, 
  Lock, 
  Link,
  MapPin,
  X,
  GraduationCap
} from 'lucide-react';
import type { NewCourse, ClassTime } from '../../../types/course';
import type { Teacher } from '../../../types/teacher';

interface CourseFormProps {
  onSubmit: (course: NewCourse) => Promise<void>;
  teachers: Teacher[];
}

export function CourseForm({ onSubmit, teachers }: CourseFormProps) {
  const [course, setCourse] = useState<NewCourse>({
    name: '',
    code: '',
    teacher: '',
    classTimes: [],
    telegramGroup: '',
    blcLink: '',
    blcEnrollKey: '',
    teacherId: undefined
  });
  const [newClassTime, setNewClassTime] = useState<ClassTime>({ 
    day: 'Monday', 
    time: '',
    classroom: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // If a teacher is selected, use their name as the teacher field
      const selectedTeacher = teachers.find(t => t.id === course.teacherId);
      await onSubmit({
        ...course,
        teacher: selectedTeacher ? selectedTeacher.name : course.teacher
      });
      setCourse({
        name: '',
        code: '',
        teacher: '',
        classTimes: [],
        telegramGroup: '',
        blcLink: '',
        blcEnrollKey: '',
        teacherId: undefined
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addClassTime = () => {
    if (newClassTime.time) {
      setCourse(prev => ({
        ...prev,
        classTimes: [...prev.classTimes, newClassTime]
      }));
      setNewClassTime({ day: 'Monday', time: '', classroom: '' });
    }
  };

  const removeClassTime = (index: number) => {
    setCourse(prev => ({
      ...prev,
      classTimes: prev.classTimes.filter((_, i) => i !== index)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <Book className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Course</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Create a new course for students</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Course Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Course Name
          </label>
          <div className="relative">
            <input
              type="text"
              value={course.name}
              onChange={(e) => setCourse(prev => ({ ...prev, name: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
            <Book className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>

        {/* Course Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Course Code
          </label>
          <div className="relative">
            <input
              type="text"
              value={course.code}
              onChange={(e) => setCourse(prev => ({ ...prev, code: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
            <Code className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>

        {/* Teacher Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Teacher
          </label>
          <div className="relative">
            <select
              value={course.teacherId || ''}
              onChange={(e) => {
                const teacherId = e.target.value;
                setCourse(prev => ({
                  ...prev,
                  teacherId: teacherId || undefined,
                  teacher: teacherId ? '' : prev.teacher // Clear manual teacher name if a teacher is selected
                }));
              }}
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white appearance-none"
            >
              <option value="">Select a teacher</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name} {teacher.department ? `(${teacher.department})` : ''}
                </option>
              ))}
              <option value="other">Other (Enter manually)</option>
            </select>
            <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>

        {/* Manual Teacher Input (shown only when "Other" is selected) */}
        {course.teacherId === 'other' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Teacher Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={course.teacher}
                onChange={(e) => setCourse(prev => ({ ...prev, teacher: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>
        )}

        {/* Class Times */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Class Times & Location
          </label>
          <div className="space-y-3">
            <div className="flex gap-3">
              <select
                value={newClassTime.day}
                onChange={(e) => setNewClassTime(prev => ({ ...prev, day: e.target.value }))}
                className="pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {weekDays.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
              <div className="relative flex-1">
                <input
                  type="time"
                  value={newClassTime.time}
                  onChange={(e) => setNewClassTime(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
              <div className="relative flex-1">
                <input
                  type="text"
                  value={newClassTime.classroom || ''}
                  onChange={(e) => setNewClassTime(prev => ({ ...prev, classroom: e.target.value }))}
                  placeholder="Enter classroom"
                  className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
              <button
                type="button"
                onClick={addClassTime}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Add Time
              </button>
            </div>

            {/* Display added class times */}
            <div className="flex flex-wrap gap-2">
              {course.classTimes.map((classTime, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                >
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    {classTime.day} at {classTime.time}
                    {classTime.classroom && ` - ${classTime.classroom}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeClassTime(index)}
                    className="text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BLC Link */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            BLC Link
          </label>
          <div className="relative">
            <input
              type="url"
              value={course.blcLink}
              onChange={(e) => setCourse(prev => ({ ...prev, blcLink: e.target.value }))}
              placeholder="Enter BLC course link"
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>

        {/* BLC Enroll Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            BLC Enroll Key
          </label>
          <div className="relative">
            <input
              type="text"
              value={course.blcEnrollKey}
              onChange={(e) => setCourse(prev => ({ ...prev, blcEnrollKey: e.target.value }))}
              placeholder="Enter BLC enroll key"
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>

        {/* Telegram Group */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Telegram Group (Optional)
          </label>
          <div className="relative">
            <input
              type="url"
              value={course.telegramGroup || ''}
              onChange={(e) => setCourse(prev => ({ ...prev, telegramGroup: e.target.value }))}
              placeholder="https://t.me/your-group"
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <BrandTelegram className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
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
        {isSubmitting ? 'Creating Course...' : 'Create Course'}
      </button>
    </form>
  );
}