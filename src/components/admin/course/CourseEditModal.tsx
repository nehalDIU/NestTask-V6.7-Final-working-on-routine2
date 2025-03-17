import { useState } from 'react';
import { X, Clock, GitBranch as BrandTelegram } from 'lucide-react';
import type { Course } from '../../../types/course';

interface CourseEditModalProps {
  course: Course;
  onClose: () => void;
  onUpdate: (updates: Partial<Course>) => void;
}

export function CourseEditModal({ course, onClose, onUpdate }: CourseEditModalProps) {
  const [formData, setFormData] = useState({
    name: course.name,
    code: course.code,
    teacher: course.teacher,
    classTime: course.classTime,
    telegramGroup: course.telegramGroup || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <div className="fixed inset-x-4 top-[5%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl z-50 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Edit Course
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="space-y-6">
            {/* Course Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Course Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            {/* Course Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Course Code
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            {/* Teacher */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Teacher
              </label>
              <input
                type="text"
                value={formData.teacher}
                onChange={(e) => setFormData(prev => ({ ...prev, teacher: e.target.value }))}
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            {/* Class Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Class Time
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.classTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, classTime: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>

            {/* Telegram Group */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Telegram Group (Optional)
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={formData.telegramGroup}
                  onChange={(e) => setFormData(prev => ({ ...prev, telegramGroup: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <BrandTelegram className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}