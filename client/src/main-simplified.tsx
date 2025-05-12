/**
 * Simplified application bootstrap
 * This file provides a minimal bootstrap for the application
 * that avoids Vite's dynamic import chunking that was causing issues.
 */

// First import the preloader which handles dependencies
import './lib/pre-load.js';

// Basic React imports
import React from 'react';
import { createRoot } from 'react-dom/client';

// Import styles
import './index.css';

// Simple error boundary component
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md mt-10">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
          <p className="mb-4">We encountered an error when loading the application.</p>
          <pre className="bg-gray-100 p-3 rounded overflow-auto text-sm">
            {this.state.error && this.state.error.toString()}
          </pre>
          <button 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Create a minimal loading component
const AppLoading = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin mx-auto"></div>
      <p className="mt-4 text-lg">Loading application...</p>
    </div>
  </div>
);

// Bootstrap app with lazy loading and error boundary
const AppBootstrap = () => {
  const [AppComponent, setAppComponent] = React.useState<React.ComponentType | null>(null);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    // Import the App component dynamically after the page has loaded
    const loadApp = async () => {
      try {
        // Directly import the module without code splitting
        const App = (await import('./App')).default;
        setAppComponent(() => App);
      } catch (err) {
        console.error('Failed to load App component:', err);
        setError(err instanceof Error ? err : new Error('Failed to load application'));
      }
    };
    
    loadApp();
  }, []);

  if (error) {
    return (
      <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md mt-10">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Application Error</h1>
        <p className="mb-4">Failed to load the application:</p>
        <pre className="bg-gray-100 p-3 rounded overflow-auto text-sm">
          {error.message}
        </pre>
        <button 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => window.location.reload()}
        >
          Reload Application
        </button>
      </div>
    );
  }

  // Show loading state while App is being loaded
  if (!AppComponent) {
    return <AppLoading />;
  }

  // Render the App component once it's loaded
  return <AppComponent />;
};

// Render the app with error boundary
createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <AppBootstrap />
  </ErrorBoundary>
);