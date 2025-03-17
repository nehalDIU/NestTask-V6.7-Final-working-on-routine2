import { supabase } from '../lib/supabase';
import type { Course, NewCourse, StudyMaterial, NewStudyMaterial } from '../types/course';

// Course functions
export async function fetchCourses(): Promise<Course[]> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        study_materials (
          id
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ? data.map(course => ({
      ...mapCourseFromDB(course),
      materialCount: course.study_materials?.length || 0
    })) : [];
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
}

export async function createCourse(course: NewCourse): Promise<Course> {
  try {
    // Format class times into a string
    const formattedClassTimes = course.classTimes
      .map(ct => `${ct.day} at ${ct.time}${ct.classroom ? ` in ${ct.classroom}` : ''}`)
      .join(', ');

    const { data, error } = await supabase
      .from('courses')
      .insert({
        name: course.name,
        code: course.code,
        teacher: course.teacher,
        class_time: formattedClassTimes,
        telegram_group: course.telegramGroup,
        blc_link: course.blcLink,
        blc_enroll_key: course.blcEnrollKey
      })
      .select()
      .single();

    if (error) throw error;
    return mapCourseFromDB(data);
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
}

export async function updateCourse(id: string, updates: Partial<Course>): Promise<Course> {
  try {
    // Format class times if they're being updated
    const formattedClassTimes = updates.classTimes
      ? updates.classTimes.map(ct => 
          `${ct.day} at ${ct.time}${ct.classroom ? ` in ${ct.classroom}` : ''}`
        ).join(', ')
      : undefined;

    const { data, error } = await supabase
      .from('courses')
      .update({
        name: updates.name,
        code: updates.code,
        teacher: updates.teacher,
        class_time: formattedClassTimes,
        telegram_group: updates.telegramGroup,
        blc_link: updates.blcLink,
        blc_enroll_key: updates.blcEnrollKey
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapCourseFromDB(data);
  } catch (error) {
    console.error('Error updating course:', error);
    throw error;
  }
}

export async function deleteCourse(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting course:', error);
    throw error;
  }
}

// Study Materials functions
export async function fetchStudyMaterials(): Promise<StudyMaterial[]> {
  try {
    const { data: materials, error: materialsError } = await supabase
      .from('study_materials')
      .select(`
        *,
        course:courses (
          id,
          name,
          code,
          teacher,
          class_time,
          telegram_group,
          blc_link,
          blc_enroll_key,
          created_at,
          created_by
        )
      `)
      .order('created_at', { ascending: false });

    if (materialsError) throw materialsError;

    return materials.map(material => ({
      id: material.id,
      title: material.title,
      description: material.description,
      courseid: material.course_id,
      category: material.category,
      fileUrls: material.file_urls || [],
      originalFileNames: material.original_file_names || [],
      createdAt: material.created_at,
      createdBy: material.created_by,
      course: material.course ? mapCourseFromDB(material.course) : undefined
    }));
  } catch (error) {
    console.error('Error fetching study materials:', error);
    throw error;
  }
}

export async function createStudyMaterial(material: NewStudyMaterial): Promise<StudyMaterial> {
  try {
    console.log('Creating study material with data:', material); // Debug log

    const { data, error } = await supabase
      .from('study_materials')
      .insert({
        title: material.title,
        description: material.description,
        course_id: material.courseId, // Changed from courseid to courseId
        category: material.category,
        file_urls: material.fileUrls,
        original_file_names: material.originalFileNames
      })
      .select(`
        *,
        course:courses (
          id,
          name,
          code,
          teacher,
          class_time,
          telegram_group,
          blc_link,
          blc_enroll_key,
          created_at,
          created_by
        )
      `)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to create study material: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from database after creating study material');
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      courseid: data.course_id,
      category: data.category,
      fileUrls: data.file_urls || [],
      originalFileNames: data.original_file_names || [],
      createdAt: data.created_at,
      createdBy: data.created_by,
      course: data.course ? mapCourseFromDB(data.course) : undefined
    };
  } catch (error) {
    console.error('Error creating study material:', error);
    throw error;
  }
}

export async function updateStudyMaterial(id: string, updates: Partial<StudyMaterial>): Promise<StudyMaterial> {
  try {
    const { data, error } = await supabase
      .from('study_materials')
      .update({
        title: updates.title,
        description: updates.description,
        course_id: updates.courseid,
        category: updates.category,
        file_urls: updates.fileUrls,
        original_file_names: updates.originalFileNames
      })
      .eq('id', id)
      .select(`
        *,
        course:courses (
          id,
          name,
          code,
          teacher,
          class_time,
          telegram_group,
          blc_link,
          blc_enroll_key,
          created_at,
          created_by
        )
      `)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      courseid: data.course_id,
      category: data.category,
      fileUrls: data.file_urls || [],
      originalFileNames: data.original_file_names || [],
      createdAt: data.created_at,
      createdBy: data.created_by,
      course: data.course ? mapCourseFromDB(data.course) : undefined
    };
  } catch (error) {
    console.error('Error updating study material:', error);
    throw error;
  }
}

export async function deleteStudyMaterial(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('study_materials')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting study material:', error);
    throw error;
  }
}

// Helper function to map database fields to camelCase
function mapCourseFromDB(data: any): Course {
  // Parse class times from the string format back to array
  const classTimes = data.class_time.split(', ').map((timeStr: string) => {
    // Check if the time string includes classroom information
    const hasClassroom = timeStr.includes(' in ');
    if (hasClassroom) {
      const [timeInfo, classroom] = timeStr.split(' in ');
      const [day, time] = timeInfo.split(' at ');
      return { day, time, classroom };
    } else {
      const [day, time] = timeStr.split(' at ');
      return { day, time };
    }
  });

  return {
    id: data.id,
    name: data.name,
    code: data.code,
    teacher: data.teacher,
    classTimes,
    telegramGroup: data.telegram_group,
    blcLink: data.blc_link,
    blcEnrollKey: data.blc_enroll_key,
    createdAt: data.created_at,
    createdBy: data.created_by
  };
}