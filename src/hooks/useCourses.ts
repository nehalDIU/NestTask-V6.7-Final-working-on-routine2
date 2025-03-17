import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  fetchCourses, 
  createCourse, 
  updateCourse, 
  deleteCourse,
  fetchStudyMaterials,
  createStudyMaterial,
  updateStudyMaterial,
  deleteStudyMaterial
} from '../services/course.service';
import type { Course, NewCourse, StudyMaterial, NewStudyMaterial } from '../types/course';

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCourses();
    loadMaterials();

    // Subscribe to changes
    const coursesSubscription = supabase
      .channel('courses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, () => {
        loadCourses();
      })
      .subscribe();

    const materialsSubscription = supabase
      .channel('materials')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'study_materials' }, () => {
        loadMaterials();
      })
      .subscribe();

    return () => {
      coursesSubscription.unsubscribe();
      materialsSubscription.unsubscribe();
    };
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await fetchCourses();
      setCourses(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const data = await fetchStudyMaterials();
      setMaterials(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (course: NewCourse) => {
    try {
      await createCourse(course);
      await loadCourses();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const handleUpdateCourse = async (id: string, updates: Partial<Course>) => {
    try {
      await updateCourse(id, updates);
      await loadCourses();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const handleDeleteCourse = async (id: string) => {
    try {
      await deleteCourse(id);
      await loadCourses();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const handleCreateMaterial = async (material: NewStudyMaterial) => {
    try {
      await createStudyMaterial(material);
      await loadMaterials();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const handleUpdateMaterial = async (id: string, updates: Partial<StudyMaterial>) => {
    try {
      await updateStudyMaterial(id, updates);
      await loadMaterials();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    try {
      await deleteStudyMaterial(id);
      await loadMaterials();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    courses,
    materials,
    loading,
    error,
    createCourse: handleCreateCourse,
    updateCourse: handleUpdateCourse,
    deleteCourse: handleDeleteCourse,
    createMaterial: handleCreateMaterial,
    updateMaterial: handleUpdateMaterial,
    deleteMaterial: handleDeleteMaterial,
  };
}