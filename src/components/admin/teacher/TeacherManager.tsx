import { TeacherForm } from './TeacherForm';
import { TeacherList } from './TeacherList';
import type { Teacher, NewTeacher } from '../../../types/teacher';
import type { Course } from '../../../types/course';

interface TeacherManagerProps {
  teachers: Teacher[];
  courses: Course[];
  onCreateTeacher: (teacher: NewTeacher, courseIds: string[]) => Promise<void>;
  onUpdateTeacher: (id: string, updates: Partial<Teacher>, courseIds: string[]) => Promise<void>;
  onDeleteTeacher: (id: string) => Promise<void>;
}

export function TeacherManager({
  teachers,
  courses,
  onCreateTeacher,
  onUpdateTeacher,
  onDeleteTeacher
}: TeacherManagerProps) {
  return (
    <div>
      <TeacherForm 
        courses={courses}
        onSubmit={onCreateTeacher}
      />
      <TeacherList 
        teachers={teachers}
        courses={courses}
        onDeleteTeacher={onDeleteTeacher}
        onUpdateTeacher={onUpdateTeacher}
      />
    </div>
  );
}