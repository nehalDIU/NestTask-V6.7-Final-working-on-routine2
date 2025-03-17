import { useState } from 'react';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import { AuthError } from './AuthError';
import { AuthInput } from './AuthInput';
import { AuthSubmitButton } from './AuthSubmitButton';
import { validateEmail } from '../../utils/authErrors';

interface ForgotPasswordFormProps {
  onSubmit: (email: string) => Promise<void>;
  onBack: () => void;
  error?: string;
}

export function ForgotPasswordForm({ onSubmit, onBack, error }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
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

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await onSubmit(email);
      setSuccess(true);
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
          Reset Password
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {success 
            ? "Check your email for a password reset link" 
            : "Enter your email to receive a password reset link"}
        </p>
      </div>
      
      {(error || localError) && <AuthError message={error || localError || ''} />}
      
      {success ? (
        <div className="space-y-5">
          <div className="p-4 bg-green-100 text-green-700 rounded-md">
            Password reset link has been sent to your email. Please check your inbox and follow the instructions to reset your password.
          </div>
          <button 
            onClick={onBack}
            className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </button>
        </div>
      ) : (
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

          <div className="flex flex-col space-y-3">
            <AuthSubmitButton 
              label={isLoading ? 'Sending...' : 'Send Reset Link'} 
              isLoading={isLoading}
              icon={isLoading ? Loader2 : undefined}
            />
            
            <button
              type="button"
              onClick={onBack}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Login
            </button>
          </div>
        </form>
      )}
    </div>
  );
} 