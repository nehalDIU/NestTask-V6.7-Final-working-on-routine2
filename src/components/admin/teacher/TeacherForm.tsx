import { useState } from 'react';
import { User, Mail, Phone, Building, GraduationCap, Plus } from 'lucide-react';
import type { NewTeacher } from '../../../types/teacher';
import type { Course } from '../../../types/course';

interface TeacherFormProps {
  courses: Course[];
  onSubmit: (teacher: NewTeacher, courseIds: string[]) => Promise<void>;
}

export function TeacherForm({ courses, onSubmit }: TeacherFormProps) {
  const [teacher, setTeacher] = useState<NewTeacher>({
    name: '',
    email: '',
    phone: '',
    department: ''
  });
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(teacher, selectedCourses);
      setTeacher({
        name: '',
        email: '',
        phone: '',
        department: ''
      });
      setSelectedCourses([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Teacher</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Create a new teacher profile</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Teacher Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Teacher Name
          </label>
          <div className="relative">
            <input
              type="text"
              value={teacher.name}
              onChange={(e) => setTeacher(prev => ({ ...prev, name: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Phone Number
          </label>
          <div className="relative">
            <input
              type="tel"
              value={teacher.phone}
              onChange={(e) => setTeacher(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email (Optional)
          </label>
          <div className="relative">
            <input
              type="email"
              value={teacher.email}
              onChange={(e) => setTeacher(prev => ({ ...prev, email: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>

        {/* Department */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Department (Optional)
          </label>
          <div className="relative">
            <input
              type="text"
              value={teacher.department}
              onChange={(e) => setTeacher(prev => ({ ...prev, department: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>

        {/* Assigned Courses */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Assigned Courses
          </label>
          <div className="relative">
            <select
              multiple
              value={selectedCourses}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => option.value);
                setSelectedCourses(values);
              }}
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white min-h-[120px]"
            >
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
            <GraduationCap className="absolute left-3 top-4 text-gray-400 w-5 h-5" />
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Hold Ctrl/Cmd to select multiple courses
          </p>
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
        {isSubmitting ? 'Creating Teacher...' : 'Create Teacher'}
      </button>
    </form>
  );
}