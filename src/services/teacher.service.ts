import { supabase } from '../lib/supabase';
import type { Teacher, NewTeacher } from '../types/teacher';

export async function fetchTeachers(): Promise<Teacher[]> {
  try {
    const { data: teachers, error: teachersError } = await supabase
      .from('teachers')
      .select(`
        *,
        courses:teacher_courses(
          course:courses(
            id,
            name,
            code
          )
        )
      `)
      .order('name');

    if (teachersError) throw teachersError;

    return teachers.map(teacher => {
      // Process courses properly
      const processedCourses = teacher.courses
        ? teacher.courses
            .filter(c => c.course) // Filter out any null courses
            .map(c => c.course)
        : [];
      
      return {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        department: teacher.department,
        createdAt: teacher.created_at,
        createdBy: teacher.created_by,
        courses: processedCourses
      };
    });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    throw error;
  }
}

export async function createTeacher(teacher: NewTeacher, courseIds: string[]): Promise<Teacher> {
  try {
    // First create the teacher
    const { data: newTeacher, error: teacherError } = await supabase
      .from('teachers')
      .insert({
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        department: teacher.department
      })
      .select()
      .single();

    if (teacherError) throw teacherError;

    // Then create the course associations
    if (courseIds.length > 0) {
      const { error: coursesError } = await supabase
        .from('teacher_courses')
        .insert(
          courseIds.map(courseId => ({
            teacher_id: newTeacher.id,
            course_id: courseId
          }))
        );

      if (coursesError) throw coursesError;
    }

    return {
      id: newTeacher.id,
      name: newTeacher.name,
      email: newTeacher.email,
      phone: newTeacher.phone,
      department: newTeacher.department,
      createdAt: newTeacher.created_at,
      createdBy: newTeacher.created_by,
      courses: []
    };
  } catch (error) {
    console.error('Error creating teacher:', error);
    throw error;
  }
}

export async function updateTeacher(
  id: string, 
  updates: Partial<Teacher>, 
  courseIds: string[]
): Promise<void> {
  try {
    // Update teacher details
    const { error: teacherError } = await supabase
      .from('teachers')
      .update({
        name: updates.name,
        email: updates.email,
        phone: updates.phone,
        department: updates.department
      })
      .eq('id', id);

    if (teacherError) throw teacherError;

    // Delete existing course associations
    const { error: deleteError } = await supabase
      .from('teacher_courses')
      .delete()
      .eq('teacher_id', id);

    if (deleteError) throw deleteError;

    // Create new course associations
    if (courseIds.length > 0) {
      const { error: coursesError } = await supabase
        .from('teacher_courses')
        .insert(
          courseIds.map(courseId => ({
            teacher_id: id,
            course_id: courseId
          }))
        );

      if (coursesError) throw coursesError;
    }
  } catch (error) {
    console.error('Error updating teacher:', error);
    throw error;
  }
}

export async function deleteTeacher(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('teachers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting teacher:', error);
    throw error;
  }
}