import { CourseForm } from './CourseForm';
import { CourseList } from './CourseList';
import type { Course, NewCourse } from '../../../types/course';
import type { Teacher } from '../../../types/teacher';

interface CourseManagerProps {
  courses: Course[];
  teachers: Teacher[];
  onCreateCourse: (course: NewCourse) => Promise<void>;
  onUpdateCourse: (id: string, updates: Partial<Course>) => Promise<void>;
  onDeleteCourse: (id: string) => Promise<void>;
}

export function CourseManager({
  courses,
  teachers,
  onCreateCourse,
  onUpdateCourse,
  onDeleteCourse
}: CourseManagerProps) {
  return (
    <div>
      <CourseForm 
        teachers={teachers}
        onSubmit={onCreateCourse}
      />
      <CourseList 
        courses={courses}
        onDeleteCourse={onDeleteCourse}
        onUpdateCourse={onUpdateCourse}
      />
    </div>
  );
}