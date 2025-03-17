import { useState } from 'react';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { AuthError } from './AuthError';
import { AuthInput } from './AuthInput';
import { AuthSubmitButton } from './AuthSubmitButton';
import { validateEmail } from '../../utils/authErrors';

interface ForgotPasswordFormProps {
  onSubmit: (email: string) => Promise<void>;
  onBackToLogin: () => void;
  error?: string;
}

export function ForgotPasswordForm({ onSubmit, onBackToLogin, error }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [touched, setTouched] = useState({ email: false });

  const validateForm = () => {
    if (!validateEmail(email)) {
      setLocalError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await onSubmit(email);
      setSuccessMessage('Password reset link sent to your email');
      setEmail('');
    } catch (err: any) {
      setLocalError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setEmail(value);
    setTouched(prev => ({ ...prev, email: true }));
    setLocalError(null);
  };

  return (
    <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl backdrop-blur-lg border border-gray-100 dark:border-gray-700">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Forgot Password
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Enter your email to reset your password
        </p>
      </div>
      
      {(error || localError) && <AuthError message={error || localError || ''} />}
      
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthInput
          type="email"
          value={email}
          onChange={handleInputChange}
          label="Email"
          placeholder="Enter your email"
          icon={Mail}
          error={touched.email && !validateEmail(email) ? 'Please enter a valid email' : ''}
        />

        <AuthSubmitButton 
          label={isLoading ? 'Sending...' : 'Reset Password'} 
          isLoading={isLoading}
          icon={isLoading ? Loader2 : undefined}
        />
      </form>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={onBackToLogin}
          className="flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Login
        </button>
      </div>
    </div>
  );
} 