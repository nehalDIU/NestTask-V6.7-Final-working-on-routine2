import { supabase } from '../lib/supabase';
import { getAuthErrorMessage } from '../utils/authErrors';
import type { LoginCredentials, SignupCredentials, User } from '../types/auth';

export async function loginUser({ email, password }: LoginCredentials): Promise<User> {
  try {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

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

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
  } catch (error: any) {
    console.error('Password reset error:', error);
    throw new Error(getAuthErrorMessage(error) || 'Failed to send password reset link. Please try again.');
  }
}

export async function updatePassword(password: string): Promise<void> {
  try {
    if (!password) {
      throw new Error('Password is required');
    }

    console.log('Starting password update process');
    
    // First check if we have an active session
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session) {
      console.log('Found active session, using it for password update');
      
      // Update password with existing session
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        console.error('Error updating password with session:', error);
        throw error;
      }
      
      console.log('Password updated successfully with existing session');
      return;
    }
    
    console.log('No active session found, looking for reset tokens');
    
    // Try to extract token from various locations
    let accessToken = '';
    let tokenType = '';
    
    // Check URL hash
    const hash = window.location.hash;
    console.log('URL hash:', hash);
    
    if (hash) {
      if (hash.includes('access_token=')) {
        console.log('Found access_token in hash');
        const hashParams = new URLSearchParams(hash.substring(1));
        accessToken = hashParams.get('access_token') || '';
        tokenType = 'access_token';
      } else if (hash.includes('token=')) {
        console.log('Found token= in hash');
        const tokenStart = hash.indexOf('token=') + 6;
        const tokenEnd = hash.indexOf('&', tokenStart);
        accessToken = tokenEnd > tokenStart 
          ? hash.substring(tokenStart, tokenEnd) 
          : hash.substring(tokenStart);
        tokenType = 'reset_token';
      } else if (hash.length > 1) {
        // Sometimes Supabase just puts the raw token in the hash
        console.log('Using raw hash as token');
        accessToken = hash.substring(1); // Remove the # symbol
        tokenType = 'unknown';
      }
    }
    
    // Check URL search parameters
    if (!accessToken) {
      const searchParams = new URLSearchParams(window.location.search);
      const type = searchParams.get('type');
      
      console.log('URL search params type:', type);
      
      if (type === 'recovery') {
        console.log('Found recovery type in search params');
        accessToken = searchParams.get('access_token') || '';
        tokenType = 'recovery';
      }
    }
    
    // If we found any token, try to use it
    if (accessToken) {
      console.log(`Found ${tokenType} token, attempting to use it`);
      
      try {
        // For 'recovery' type, we handle it differently
        if (tokenType === 'recovery') {
          // Sometimes the token is in the URL fragment
          // Use the updateUser API directly
          const { error } = await supabase.auth.updateUser({
            password
          });
          
          if (error) {
            console.error('Error updating with recovery flow:', error);
            throw error;
          }
        } else {
          // Try to set a session with the token
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: ''
          });
          
          if (sessionError) {
            console.error('Error setting session with token:', sessionError);
            throw sessionError;
          }
          
          // Now try to update the password
          const { error } = await supabase.auth.updateUser({
            password
          });
          
          if (error) {
            console.error('Error updating password after setting session:', error);
            throw error;
          }
        }
        
        console.log('Password updated successfully');
      } catch (error) {
        console.error('Error in token-based password update flow:', error);
        throw error;
      }
    } else {
      console.error('No reset token found in URL');
      throw new Error('No valid password reset token found. Please request a new password reset link.');
    }
  } catch (error: any) {
    console.error('Update password error:', error);
    throw new Error(getAuthErrorMessage(error) || 'Failed to update password. Please try again.');
  }
}