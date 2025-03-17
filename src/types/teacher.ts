export interface Teacher {
  id: string;
  name: string;
  email?: string;
  phone: string;
  department?: string;
  createdAt: string;
  createdBy: string;
  courses?: Course[];
}

export type NewTeacher = Omit<Teacher, 'id' | 'createdAt' | 'createdBy' | 'courses'>;

export interface TeacherCourse {
  teacherId: string;
  courseId: string;
  createdAt: string;
}