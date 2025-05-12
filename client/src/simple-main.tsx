/**
 * Extremely minimal main entry point that doesn't use any problematic dependencies
 * This should load correctly regardless of Vite chunk issues
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import MinimalErrorPage from './minimal-app';
import './index.css';

// Simple direct render of minimal app
createRoot(document.getElementById('root')!).render(<MinimalErrorPage />);