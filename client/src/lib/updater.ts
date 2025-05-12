/**
 * Updater utility that allows us to restore the original application
 * after displaying the minimal error page.
 * 
 * This file provides a safe way to recover from a failed app load.
 */

// Cache control utility to force reloading of resources
export const clearResourceCache = () => {
  // Add a cache-busting query parameter to the main.tsx script
  const mainScript = document.querySelector('script[src*="main.tsx"]');
  if (mainScript) {
    // Update the script source with a new timestamp
    const originalSrc = mainScript.getAttribute('src')?.split('?')[0] || '';
    mainScript.setAttribute('src', `${originalSrc}?t=${Date.now()}`);
  }
  
  // Clear any stored module information
  try {
    // Try to clear session storage caches that Vite might use
    sessionStorage.clear();
    
    // Attempt to clear just the Vite-related items
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes('vite') || key.includes('HMR') || key.includes('chunk')) {
        sessionStorage.removeItem(key);
      }
    });
  } catch (e) {
    console.warn('Failed to clear session storage', e);
  }
};

// Attempt to restore the main application
export const tryLoadMainApp = () => {
  // Clear caches first
  clearResourceCache();
  
  // Create an update flag in localStorage to indicate we're trying
  localStorage.setItem('app_restore_attempt', Date.now().toString());
  
  // Hard reload the page to ensure all resources are freshly loaded
  window.location.reload();
};

// Function that will update index.html to use the original main.tsx
export const restoreMainEntrypoint = () => {
  // This would need server-side access, so we reload instead
  window.location.href = '/?restore=1';
};

export default {
  clearResourceCache,
  tryLoadMainApp,
  restoreMainEntrypoint
};