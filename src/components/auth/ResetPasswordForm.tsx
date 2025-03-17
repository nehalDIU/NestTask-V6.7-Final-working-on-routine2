import { useState, useEffect } from 'react';
import { Lock, Loader2, CheckCircle } from 'lucide-react';
import { AuthError } from './AuthError';
import { AuthInput } from './AuthInput';
import { AuthSubmitButton } from './AuthSubmitButton';
import { validatePassword } from '../../utils/authErrors';

interface ResetPasswordFormProps {
  onSubmit: (password: string) => Promise<void>;
  error?: string;
}

export function ResetPasswordForm({ onSubmit, error }: ResetPasswordFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [touched, setTouched] = useState({ password: false, confirmPassword: false });

  // Manage countdown timer after successful reset
  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [success, countdown]);

  const validateForm = () => {
    if (!validatePassword(password)) {
      setLocalError('Password must be at least 6 characters long');
      return false;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await onSubmit(password);
      setSuccess(true);
    } catch (err: any) {
      setLocalError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl backdrop-blur-lg border border-gray-100 dark:border-gray-700">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Reset Password
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {success 
            ? "Your password has been reset successfully" 
            : "Enter your new password below"}
        </p>
      </div>
      
      {(error || localError) && <AuthError message={error || localError || ''} />}
      
      {success ? (
        <div className="space-y-5">
          <div className="p-6 bg-green-50 rounded-xl text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-green-800 mb-1">Password Reset Successful!</h3>
            <p className="text-green-700">
              Your password has been reset successfully. You can now login with your new password.
            </p>
            <div className="mt-4 text-sm text-green-600">
              Redirecting to login in {countdown} seconds...
            </div>
          </div>
          <a 
            href="/auth"
            className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Login Now
          </a>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <AuthInput
            type="password"
            value={password}
            onChange={setPassword}
            label="New Password"
            placeholder="Enter your new password"
            icon={Lock}
            error={touched.password && !validatePassword(password) ? 'Password must be at least 6 characters' : ''}
            onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
          />

          <AuthInput
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            label="Confirm Password"
            placeholder="Confirm your new password"
            icon={Lock}
            error={touched.confirmPassword && password !== confirmPassword ? 'Passwords do not match' : ''}
            onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))}
          />

          <AuthSubmitButton 
            label={isLoading ? 'Resetting...' : 'Reset Password'} 
            isLoading={isLoading}
            icon={isLoading ? Loader2 : undefined}
          />
        </form>
      )}
    </div>
  );
} 