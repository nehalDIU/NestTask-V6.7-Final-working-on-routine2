import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App from './App.tsx';
// Import CSS (Vite handles this correctly)
import './index.css';
import { LoadingScreen } from './components/LoadingScreen';
import { initPWA } from './utils/pwa';

// Initialize PWA functionality
initPWA();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<LoadingScreen />}>
      <App />
      <Analytics />
    </Suspense>
  </StrictMode>
);