import { LucideIcon } from 'lucide-react';

interface AuthSubmitButtonProps {
  label: string;
  isLoading?: boolean;
  icon?: LucideIcon;
}

export function AuthSubmitButton({ label, isLoading = false, icon: Icon }: AuthSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className={`
        w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-all
        ${isLoading 
          ? 'bg-blue-400 dark:bg-blue-500 cursor-not-allowed' 
          : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
        }
        text-white shadow-sm hover:shadow-md
      `}
    >
      {Icon && <Icon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />}
      {label}
    </button>
  );
}