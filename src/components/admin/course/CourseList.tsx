import { useState } from 'react';
import { Book, Trash2, Edit2, GitBranch as BrandTelegram, Calendar, User, Search, Link, Lock } from 'lucide-react';
import { CourseEditModal } from './CourseEditModal';
import type { Course } from '../../../types/course';

interface CourseListProps {
  courses: Course[];
  onDeleteCourse: (id: string) => Promise<void>;
  onUpdateCourse: (id: string, updates: Partial<Course>) => Promise<void>;
}

export function CourseList({ courses, onDeleteCourse, onUpdateCourse }: CourseListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const filteredCourses = courses.filter(course => 
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.teacher.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden mt-6">
        <div className="p-6">
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>

          <div className="space-y-4">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-200 group hover:shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-grow space-y-2 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {course.name}
                      </h3>
                      <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                        {course.code}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{course.teacher}</span>
                      </div>
                      
                      {/* Class Times */}
                      <div className="flex flex-wrap gap-2">
                        {course.classTimes.map((time, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1 px-2 py-0.5 bg-gray-50 dark:bg-gray-700 rounded-md"
                          >
                            <Calendar className="w-4 h-4" />
                            <span>{time.day} at {time.time}</span>
                          </div>
                        ))}
                      </div>

                      {/* BLC Info */}
                      {course.blcLink && (
                        <div className="flex items-center gap-2">
                          <Link className="w-4 h-4 text-blue-500" />
                          <a
                            href={course.blcLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            BLC Course
                          </a>
                          {course.blcEnrollKey && (
                            <span className="flex items-center gap-1 text-gray-500">
                              <Lock className="w-4 h-4" />
                              Key: {course.blcEnrollKey}
                            </span>
                          )}
                        </div>
                      )}

                      {course.telegramGroup && (
                        <a
                          href={course.telegramGroup}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <BrandTelegram className="w-4 h-4" />
                          <span>Join Group</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center gap-2">
                    <button
                      onClick={() => setEditingCourse(course)}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Edit course"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteCourse(course.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredCourses.length === 0 && (
              <div className="text-center py-12">
                <Book className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">No courses found</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  {searchTerm ? 'Try a different search term' : 'Add your first course above'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {editingCourse && (
        <CourseEditModal
          course={editingCourse}
          onClose={() => setEditingCourse(null)}
          onUpdate={(updates) => {
            onUpdateCourse(editingCourse.id, updates);
            setEditingCourse(null);
          }}
        />
      )}
    </>
  );
}