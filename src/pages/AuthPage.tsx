import { useState } from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { SignupForm } from '../components/auth/SignupForm';
import { ForgotPasswordForm } from '../components/auth/ForgotPasswordForm';
import type { LoginCredentials, SignupCredentials } from '../types/auth';

interface AuthPageProps {
  onLogin: (credentials: LoginCredentials) => Promise<void>;
  onSignup: (credentials: SignupCredentials) => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
  error?: string;
}

export function AuthPage({ onLogin, onSignup, onResetPassword, error }: AuthPageProps) {
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'reset'>('login');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-gray-900 mb-8">
          NestTask
        </h1>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {authMode === 'login' && (
          <LoginForm
            onSubmit={onLogin}
            onSwitchToSignup={() => setAuthMode('signup')}
            onForgotPassword={() => setAuthMode('reset')}
            error={error}
          />
        )}
        
        {authMode === 'signup' && (
          <SignupForm
            onSubmit={onSignup}
            onSwitchToLogin={() => setAuthMode('login')}
            error={error}
          />
        )}
        
        {authMode === 'reset' && (
          <ForgotPasswordForm
            onSubmit={onResetPassword}
            onBack={() => setAuthMode('login')}
            error={error}
          />
        )}
      </div>
    </div>
  );
}