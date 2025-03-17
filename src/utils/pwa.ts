// Check if the app can be installed
export function checkInstallability() {
  if ('BeforeInstallPromptEvent' in window) {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      // Store the event for later use
      (window as any).deferredPrompt = e;
    });
  }
}

// Request to install the PWA
export async function installPWA() {
  const deferredPrompt = (window as any).deferredPrompt;
  if (!deferredPrompt) return false;

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  
  // Clear the stored prompt
  (window as any).deferredPrompt = null;
  
  return outcome === 'accepted';
}

// Register for push notifications
export async function registerPushNotifications() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.VITE_VAPID_PUBLIC_KEY || '')
    });
    
    return subscription;
  } catch (error) {
    console.error('Failed to register push notifications:', error);
    return null;
  }
}

// Register service worker for offline support
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      });
      
      console.log('Service Worker registered with scope:', registration.scope);
      
      // Set up service worker update handling
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, show update notification if desired
              console.log('New version available! Refresh to update.');
            }
          });
        }
      });
      
      // Handle service worker errors
      if (registration.installing) {
        registration.installing.addEventListener('statechange', (event) => {
          if ((event.target as ServiceWorker).state === 'redundant') {
            console.error('Service Worker installation failed. Trying again...');
            // Re-register after a delay
            setTimeout(() => {
              registerServiceWorker();
            }, 5000);
          }
        });
      }
      
      // Automatically update service worker when a new version is detected
      if (registration.active) {
        // Check for updates every hour
        setInterval(() => {
          registration.update()
            .catch(err => console.error('Error updating service worker:', err));
        }, 60 * 60 * 1000);
      }
      
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      
      // Try to unregister any existing service workers and retry registration
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
        console.log('Unregistered existing service workers. Retrying registration...');
        
        // Retry registration after a delay
        setTimeout(() => {
          registerServiceWorker();
        }, 3000);
      } catch (unregisterError) {
        console.error('Error unregistering service workers:', unregisterError);
      }
      
      return null;
    }
  }
  
  return null;
}

// Initialize PWA features
export async function initPWA() {
  checkInstallability();
  await registerServiceWorker();
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}