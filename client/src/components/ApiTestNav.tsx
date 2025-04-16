import React from 'react';
import { Link } from 'wouter';

/**
 * Simple navigation component for API testing
 */
const ApiTestNav: React.FC = () => {
  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <span className="font-bold text-xl">API Test Suite</span>
        </div>
        <div className="flex space-x-4">
          <Link href="/api-test">
            <a className="hover:text-blue-300 transition-colors">API Tester</a>
          </Link>
          <Link href="/">
            <a className="hover:text-blue-300 transition-colors">Main App</a>
          </Link>
          <Link href="/auth">
            <a className="hover:text-blue-300 transition-colors">Authentication</a>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default ApiTestNav;