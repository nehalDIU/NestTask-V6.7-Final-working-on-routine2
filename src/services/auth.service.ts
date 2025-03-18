import { supabase } from '../lib/supabase';
import { getAuthErrorMessage } from '../utils/authErrors';
import type { LoginCredentials, SignupCredentials, User } from '../types/auth';

// Check if "Remember me" is enabled
const isRememberMeEnabled = () => localStorage.getItem('nesttask_remember_me') === 'true';

export async function loginUser({ email, password }: LoginCredentials): Promise<User> {
  try {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Check if "Remember me" is enabled from localStorage
    const rememberMe = localStorage.getItem('nesttask_remember_me') === 'true';
    console.log('Logging in with remember me:', rememberMe);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });
    
    if (authError) throw authError;
    if (!authData?.user) throw new Error('No user data received');

    // Wait briefly for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get user profile data
    const { data: profiles, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id);

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      throw new Error('Failed to fetch user profile');
    }

    const profile = profiles?.[0];
    if (!profile) {
      // Create profile if it doesn't exist
      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email!,
          name: authData.user.user_metadata?.name || authData.user.email?.split('@')[0],
          role: authData.user.user_metadata?.role || 'user',
          phone: authData.user.user_metadata?.phone,
          student_id: authData.user.user_metadata?.studentId
        })
        .select()
        .single();

      if (createError) {
        throw new Error('Failed to create user profile');
      }

      return {
        id: newProfile.id,
        email: newProfile.email,
        name: newProfile.name,
        phone: newProfile.phone,
        studentId: newProfile.student_id,
        role: newProfile.role,
        createdAt: newProfile.created_at
      };
    }

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      phone: profile.phone,
      studentId: profile.student_id,
      role: profile.role,
      createdAt: profile.created_at
    };
  } catch (error: any) {
    console.error('Login error:', error);
    throw new Error(getAuthErrorMessage(error));
  }
}

export async function signupUser({ email, password, name, phone, studentId }: SignupCredentials): Promise<User> {
  try {
    if (!email || !password || !name || !phone || !studentId) {
      throw new Error('All fields are required');
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: 'user',
          phone,
          studentId
        },
      },
    });
    
    if (authError) throw authError;
    if (!authData?.user) throw new Error('No user data received');

    // Wait for the trigger to create the user profile
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get or create the user profile
    const { data: profiles, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id);

    if (profileError) {
      throw new Error('Failed to fetch user profile');
    }

    const profile = profiles?.[0];
    if (!profile) {
      // Create profile if it doesn't exist
      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email!,
          name,
          role: 'user',
          phone,
          student_id: studentId
        })
        .select()
        .single();

      if (createError) {
        await supabase.auth.signOut();
        throw new Error('Failed to create user profile');
      }

      return {
        id: newProfile.id,
        email: newProfile.email,
        name: newProfile.name,
        phone: newProfile.phone,
        studentId: newProfile.student_id,
        role: newProfile.role,
        createdAt: newProfile.created_at
      };
    }

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      phone: profile.phone,
      studentId: profile.student_id,
      role: profile.role,
      createdAt: profile.created_at
    };
  } catch (error: any) {
    console.error('Signup error:', error);
    if (error.message?.includes('duplicate key') || 
        error.message?.includes('already registered')) {
      throw new Error('Email already registered');
    }
    throw new Error(getAuthErrorMessage(error));
  }
}

export async function logoutUser(): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    localStorage.removeItem('supabase.auth.token');
  } catch (error: any) {
    console.error('Logout error:', error);
    throw new Error('Failed to sign out. Please try again.');
  }
}

export async function resetPassword(email: string): Promise<void> {
  try {
    if (!email) {
      throw new Error('Email is required');
    }
    
    console.log('Sending password reset email to:', email);
    
    // The redirectTo URL must be added to the "Additional Redirect URLs" in the Supabase Dashboard
    // under Authentication -> URL Configuration
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // Add the hash fragment to force our app to show the reset password UI
      redirectTo: `${window.location.origin}/#auth/recovery`,
    });
    
    if (error) {
      console.error('Supabase resetPasswordForEmail error:', error);
      throw error;
    }
    
    console.log('Password reset email sent successfully');
  } catch (error: any) {
    console.error('Password reset error:', error);
    throw new Error(getAuthErrorMessage(error) || 'Failed to send password reset email. Please try again.');
  }
}