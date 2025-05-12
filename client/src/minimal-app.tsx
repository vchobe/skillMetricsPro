/**
 * Minimal application that doesn't rely on any problematic dependencies
 * Use this as a recovery point when the main application fails to load
 */

import React, { useState, useEffect } from 'react';

// Simple health check component
const HealthCheck = () => {
  const [apiStatus, setApiStatus] = useState<'loading' | 'online' | 'offline'>('loading');
  const [dbStatus, setDbStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    // Check API health
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setApiStatus('online');
        setDbStatus(data.database_connected ? 'connected' : 'error');
        setVersion(data.version || 'unknown');
      })
      .catch(() => {
        setApiStatus('offline');
      });
  }, []);

  return (
    <div style={{ marginTop: '20px', backgroundColor: '#f9fafb', padding: '10px', borderRadius: '4px' }}>
      <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>System Status</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <div>
          <span>API: </span>
          <span style={{ 
            color: apiStatus === 'online' ? '#10b981' : apiStatus === 'loading' ? '#f59e0b' : '#ef4444',
            fontWeight: 'bold'
          }}>
            {apiStatus.toUpperCase()}
          </span>
        </div>
        <div>
          <span>Database: </span>
          <span style={{ 
            color: dbStatus === 'connected' ? '#10b981' : dbStatus === 'unknown' ? '#f59e0b' : '#ef4444',
            fontWeight: 'bold'
          }}>
            {dbStatus.toUpperCase()}
          </span>
        </div>
        {version && (
          <div>
            <span>Version: </span>
            <span>{version}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Minimal error message component
export const MinimalErrorPage = () => {
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestore = () => {
    setIsRestoring(true);
    // Add a slight delay to show the loading state
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div style={{
      padding: '20px',
      maxWidth: '600px',
      margin: '40px auto',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <h1 style={{ color: '#3b82f6', marginBottom: '20px' }}>SkillMetrics Application</h1>
      
      <div style={{ padding: '15px', backgroundColor: '#f9fafb', borderRadius: '6px', marginBottom: '20px' }}>
        <h2 style={{ color: '#ef4444', marginBottom: '10px', fontSize: '18px' }}>Application Loading Error</h2>
        <p>We encountered an issue while loading the application resources. The backend API is functioning normally, but there was a problem with loading the frontend components.</p>
        <p style={{ marginTop: '10px' }}>This is usually caused by a temporary browser issue or module loading problem.</p>
      </div>
      
      <HealthCheck />
      
      <div style={{ marginTop: '20px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Troubleshooting Steps:</h3>
        <ol style={{ paddingLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}>Refresh the page to reload all application resources</li>
          <li style={{ marginBottom: '8px' }}>Clear your browser cache and cookies</li>
          <li style={{ marginBottom: '8px' }}>Try using a different web browser</li>
          <li style={{ marginBottom: '8px' }}>Contact the administrator if the problem persists</li>
        </ol>
      </div>
      
      <button 
        onClick={handleRestore}
        disabled={isRestoring}
        style={{
          marginTop: '20px',
          padding: '8px 16px',
          backgroundColor: isRestoring ? '#93c5fd' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isRestoring ? 'not-allowed' : 'pointer'
        }}
      >
        {isRestoring ? 'Reloading...' : 'Reload Application'}
      </button>
    </div>
  );
};

// Default export is the basic error page
export default MinimalErrorPage;