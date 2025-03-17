import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { loginUser, signupUser, logoutUser, resetPassword } from '../services/auth.service';
import type { User, LoginCredentials, SignupCredentials } from '../types/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await updateUserState(session.user);
      }
    } catch (err) {
      console.error('Session check error:', err);
      setError('Failed to check authentication status');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthChange = async (_event: string, session: any) => {
    if (session?.user) {
      await updateUserState(session.user);
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  const updateUserState = async (authUser: any) => {
    try {
      setUser({
        id: authUser.id,
        email: authUser.email!,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || '',
        role: authUser.user_metadata?.role || 'user',
        createdAt: authUser.created_at,
      });
    } catch (err) {
      console.error('Error updating user state:', err);
      setError('Failed to update user information');
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setError(null);
      const user = await loginUser(credentials);
      setUser(user);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const signup = async (credentials: SignupCredentials) => {
    try {
      setError(null);
      const user = await signupUser(credentials);
      setUser(user);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await logoutUser();
      setUser(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      setError(null);
      await resetPassword(email);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    forgotPassword,
  };
}
