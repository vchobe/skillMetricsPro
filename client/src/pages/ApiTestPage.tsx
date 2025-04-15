import React from 'react';
import ApiTester from '../components/ApiTester';
import ApiTestNav from '../components/ApiTestNav';

/**
 * Page component for testing Java API integration
 */
const ApiTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <ApiTestNav />
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          Java Backend API Integration Testing
        </h1>
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <ApiTester />
        </div>
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>This page tests the connection to the Java backend API endpoints</p>
          <p className="mt-2">
            API base URL: <code className="bg-gray-200 px-2 py-1 rounded">
              {process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8080/api'}
            </code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApiTestPage;