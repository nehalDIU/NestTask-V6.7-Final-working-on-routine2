import { Loader2 } from 'lucide-react';

export function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="text-center animate-scale-in">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">Loading your tasks...</p>
      </div>
    </div>
  );
}