import { useState } from 'react';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { AuthError } from './AuthError';
import { AuthInput } from './AuthInput';
import { AuthSubmitButton } from './AuthSubmitButton';
import { validateEmail, validatePassword } from '../../utils/authErrors';
import type { LoginCredentials } from '../../types/auth';

interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => Promise<void>;
  onSwitchToSignup: () => void;
  onForgotPassword: () => void;
  error?: string;
}

export function LoginForm({ onSubmit, onSwitchToSignup, onForgotPassword, error }: LoginFormProps) {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ email: false, password: false });

  const validateForm = () => {
    if (!validateEmail(credentials.email)) {
      setLocalError('Please enter a valid email address');
      return false;
    }
    if (!validatePassword(credentials.password)) {
      setLocalError('Password must be at least 6 characters long');
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
      await onSubmit(credentials);
    } catch (err: any) {
      setLocalError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    setLocalError(null);
  };

  return (
    <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl backdrop-blur-lg border border-gray-100 dark:border-gray-700">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Welcome Back
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Sign in to continue managing your tasks
        </p>
      </div>
      
      {(error || localError) && <AuthError message={error || localError || ''} />}

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthInput
          type="email"
          value={credentials.email}
          onChange={(value) => handleInputChange('email', value)}
          label="Email"
          placeholder="Enter your email"
          icon={Mail}
          error={touched.email && !validateEmail(credentials.email) ? 'Please enter a valid email' : ''}
        />

        <AuthInput
          type="password"
          value={credentials.password}
          onChange={(value) => handleInputChange('password', value)}
          label="Password"
          placeholder="Enter your password"
          icon={Lock}
          error={touched.password && !validatePassword(credentials.password) ? 'Password must be at least 6 characters' : ''}
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center">
            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Remember me</span>
          </label>
          <button 
            type="button" 
            onClick={onForgotPassword}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            Forgot password?
          </button>
        </div>

        <AuthSubmitButton 
          label={isLoading ? 'Signing in...' : 'Sign in'} 
          isLoading={isLoading}
          icon={isLoading ? Loader2 : undefined}
        />
      </form>

      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
        >
          Sign up
        </button>
      </p>
    </div>
  );
}