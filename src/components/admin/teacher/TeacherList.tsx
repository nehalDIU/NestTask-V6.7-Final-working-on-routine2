import { useState } from 'react';
import { Search, Trash2, Edit2, Phone, Mail, Building, GraduationCap } from 'lucide-react';
import { TeacherEditModal } from './TeacherEditModal';
import type { Teacher } from '../../../types/teacher';
import type { Course } from '../../../types/course';

interface TeacherListProps {
  teachers: Teacher[];
  courses: Course[];
  onDeleteTeacher: (id: string) => Promise<void>;
  onUpdateTeacher: (id: string, updates: Partial<Teacher>, courseIds: string[]) => Promise<void>;
}

export function TeacherList({ 
  teachers, 
  courses,
  onDeleteTeacher, 
  onUpdateTeacher 
}: TeacherListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  const filteredTeachers = teachers.filter(teacher => 
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.courses?.some(course => 
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden mt-6">
        <div className="p-6">
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Search teachers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>

          <div className="space-y-4">
            {filteredTeachers.map((teacher) => (
              <div
                key={teacher.id}
                className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-200 group hover:shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-grow space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {teacher.name}
                      </h3>
                      {teacher.department && (
                        <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                          {teacher.department}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{teacher.phone}</span>
                      </div>
                      {teacher.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span>{teacher.email}</span>
                        </div>
                      )}
                      {teacher.department && (
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          <span>{teacher.department}</span>
                        </div>
                      )}
                    </div>

                    {teacher.courses && teacher.courses.length > 0 && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-gray-400" />
                        <div className="flex flex-wrap gap-2">
                          {teacher.courses.map(course => (
                            <span
                              key={course.id}
                              className="px-2 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                            >
                              {course.code}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center gap-2">
                    <button
                      onClick={() => setEditingTeacher(teacher)}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Edit teacher"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteTeacher(teacher.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete teacher"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredTeachers.length === 0 && (
              <div className="text-center py-12">
                <GraduationCap className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">No teachers found</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  {searchTerm ? 'Try a different search term' : 'Add your first teacher above'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {editingTeacher && (
        <TeacherEditModal
          teacher={editingTeacher}
          courses={courses}
          onClose={() => setEditingTeacher(null)}
          onUpdate={(updates, courseIds) => {
            onUpdateTeacher(editingTeacher.id, updates, courseIds);
            setEditingTeacher(null);
          }}
        />
      )}
    </>
  );
}