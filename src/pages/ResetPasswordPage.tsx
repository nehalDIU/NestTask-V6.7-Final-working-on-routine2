import { useState, useEffect } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuthError } from '../components/auth/AuthError';
import { AuthInput } from '../components/auth/AuthInput';
import { AuthSubmitButton } from '../components/auth/AuthSubmitButton';
import { validatePassword } from '../utils/authErrors';

export function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState({ password: false, confirmPassword: false });

  // Check for auth session on component mount
  useEffect(() => {
    const checkSession = async () => {
      // This ensures we're working with a valid session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No active session found for password reset');
        setError('Invalid password reset session. Please request a new password reset link.');
      } else {
        console.log('Valid session found for password reset');
      }
    };
    
    checkSession();
  }, []);

  const validateForm = () => {
    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      console.log('Attempting to update password');
      
      // Update the user's password
      const { error } = await supabase.auth.updateUser({ 
        password 
      });
      
      if (error) {
        console.error('Password update error:', error);
        throw error;
      }
      
      console.log('Password updated successfully');
      setSuccess(true);
      
      // Clear the recovery hash from URL
      if (window.history.pushState) {
        window.history.pushState("", "", '/');
      }
      
      // Redirect to login after a delay
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'An error occurred while resetting your password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: 'password' | 'confirmPassword', value: string) => {
    if (field === 'password') {
      setPassword(value);
    } else {
      setConfirmPassword(value);
    }
    setTouched(prev => ({ ...prev, [field]: true }));
    setError(null);
  };

  // Handle going back to login
  const handleBackToLogin = () => {
    // Clear the recovery hash from URL
    if (window.history.pushState) {
      window.history.pushState("", "", '/');
    }
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-gray-900 mb-8">
          NestTask
        </h1>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl backdrop-blur-lg border border-gray-100 dark:border-gray-700">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Reset Password
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Enter your new password
            </p>
          </div>
          
          {error && <AuthError message={error} />}
          
          {success && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg">
              Your password has been successfully reset. Redirecting to login...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <AuthInput
              type="password"
              value={password}
              onChange={(value) => handleInputChange('password', value)}
              label="New Password"
              placeholder="Enter your new password"
              icon={Lock}
              error={touched.password && !validatePassword(password) ? 'Password must be at least 6 characters' : ''}
            />

            <AuthInput
              type="password"
              value={confirmPassword}
              onChange={(value) => handleInputChange('confirmPassword', value)}
              label="Confirm Password"
              placeholder="Confirm your new password"
              icon={Lock}
              error={touched.confirmPassword && password !== confirmPassword ? 'Passwords do not match' : ''}
            />

            <AuthSubmitButton 
              label={isLoading ? 'Resetting...' : 'Reset Password'} 
              isLoading={isLoading}
              icon={isLoading ? Loader2 : undefined}
            />
          </form>

          {error && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleBackToLogin}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 