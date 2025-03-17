import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ResetPasswordForm } from '../components/auth/ResetPasswordForm';
import { Layout } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function ResetPasswordPage() {
  const { changePassword, error: authError } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Debug the URL to see what format Supabase is using
    console.log('Current URL:', window.location.href);
    console.log('Hash:', window.location.hash);
    console.log('Search params:', window.location.search);
    
    const checkForToken = async () => {
      try {
        setIsCheckingToken(true);
        
        // Look for code in URL params (Supabase's native flow)
        const query = new URLSearchParams(window.location.search);
        const code = query.get('code');
        
        if (code) {
          console.log('Found code in URL params - this is the Supabase native reset flow');
          setIsTokenValid(true);
          return true;
        }
        
        // Check if we have a session from Supabase auth
        const { data } = await supabase.auth.getSession();
        
        if (data?.session) {
          console.log('Active session found');
          setIsTokenValid(true);
          return true;
        }
        
        // Extract type and access token from URL query parameters
        const type = query.get('type');
        const accessToken = query.get('access_token');
        
        // Check for Supabase recovery flow
        if (type === 'recovery' || accessToken) {
          console.log('Recovery flow detected in URL params');
          setIsTokenValid(true);
          return true;
        }
        
        // Check hash for token in various formats
        const hash = window.location.hash;
        
        // Debug hash content
        if (hash) {
          console.log('Hash content:', hash);
          
          if (hash.includes('access_token=')) {
            console.log('access_token found in hash');
            setIsTokenValid(true);
            return true;
          }
          
          if (hash.includes('token=')) {
            console.log('token found in hash');
            setIsTokenValid(true);
            return true;
          }
          
          // Sometimes Supabase just puts the token directly in the hash
          if (hash.length > 1) {
            console.log('Using hash as direct token');
            setIsTokenValid(true);
            return true;
          }
        }
        
        console.log('No valid token format found');
        return false;
      } catch (err) {
        console.error('Error checking token:', err);
        return false;
      } finally {
        setIsCheckingToken(false);
      }
    };
    
    checkForToken().then(valid => {
      if (!valid) {
        setError('Invalid or expired password reset link. Please request a new one.');
      }
    });
  }, [location]);

  const handleResetPassword = async (password: string) => {
    try {
      await changePassword(password);
      // Success - wait 3 seconds and redirect to login
      setTimeout(() => {
        navigate('/auth');
      }, 3000);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.message);
      throw err;
    }
  };

  if (isCheckingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 animate-fade-in">
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=2070')] bg-cover bg-center opacity-5" />
        </div>
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="flex justify-center items-center mb-8">
            <Layout className="w-10 h-10 text-blue-600" />
            <h1 className="text-center text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 ml-2">
              NestTask
            </h1>
          </div>
          <div className="animate-pulse text-gray-600">
            Verifying your reset link...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 animate-fade-in">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=2070')] bg-cover bg-center opacity-5" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center mb-8">
          <Layout className="w-10 h-10 text-blue-600" />
          <h1 className="text-center text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 ml-2">
            NestTask
          </h1>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-slide-up">
        {isTokenValid ? (
          <ResetPasswordForm 
            onSubmit={handleResetPassword}
            error={error || authError || ''}
          />
        ) : (
          <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl backdrop-blur-lg border border-gray-100 dark:border-gray-700">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Invalid Link
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                There's a problem with your password reset link
              </p>
            </div>
            {error && (
              <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}
            <a
              href="/auth"
              className="w-full block text-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Login
            </a>
          </div>
        )}
      </div>
    </div>
  );
} 
