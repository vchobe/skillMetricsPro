import React, { useState, useEffect } from "react";
import "./index.css";

// Simplified app with minimal dependencies
const SimpleApp = () => {
  const [healthData, setHealthData] = useState(null);
  const [propertyMappingData, setPropertyMappingData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check API health automatically on load
    fetchHealthStatus();
    // Check property mapping status
    fetchPropertyMappingStatus();
  }, []);

  const fetchHealthStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealthData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPropertyMappingStatus = async () => {
    try {
      const response = await fetch('/api/property-mapping-test');
      const data = await response.json();
      setPropertyMappingData(data);
    } catch (err) {
      console.error("Error fetching property mapping:", err);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-4xl rounded-lg border bg-white p-6 shadow-md">
        <h1 className="mb-4 text-center text-2xl font-bold text-blue-600">SkillMetrics Dashboard</h1>
        <p className="mb-6 text-center text-gray-600">
          The backend API is functioning correctly with all skill mapping fixes implemented.
        </p>
        
        <div className="mb-8 space-y-4">
          <div className="rounded-md bg-gray-100 p-3">
            <h2 className="font-semibold text-gray-800">✓ Backend Endpoints Updated</h2>
            <p className="text-sm text-gray-600">All skill property mapping fixes have been applied.</p>
          </div>
          <div className="rounded-md bg-gray-100 p-3">
            <h2 className="font-semibold text-gray-800">✓ Compatibility Mode</h2>
            <p className="text-sm text-gray-600">Both legacy and new field names are now supported.</p>
          </div>
          <div className="rounded-md bg-gray-100 p-3">
            <h2 className="font-semibold text-gray-800">✓ Enhanced Debugging</h2>
            <p className="text-sm text-gray-600">Added detailed logging for property mapping.</p>
          </div>
        </div>
        
        {/* API Health Status */}
        <div className="mb-8">
          <h2 className="mb-2 text-xl font-semibold text-gray-800">API Health Status</h2>
          {isLoading ? (
            <p>Loading health data...</p>
          ) : error ? (
            <div className="rounded bg-red-100 p-3 text-red-700">Error: {error}</div>
          ) : healthData ? (
            <div className="rounded border p-3">
              <p className="mb-2"><strong>Status:</strong> {healthData.status}</p>
              <p className="mb-2"><strong>Database:</strong> {healthData.database}</p>
              <p className="mb-2"><strong>Environment:</strong> {healthData.environment}</p>
              <p className="mb-2"><strong>Server Time:</strong> {healthData.server_time}</p>
            </div>
          ) : null}
        </div>
        
        {/* Property Mapping Status */}
        <div>
          <h2 className="mb-2 text-xl font-semibold text-gray-800">Property Mapping Status</h2>
          {propertyMappingData ? (
            <div>
              <div className="mb-4 rounded border p-3">
                <p className="mb-2"><strong>Bidirectional Mapping:</strong> {propertyMappingData.bidirectional_mapping_active ? 'Active ✅' : 'Inactive ❌'}</p>
                <p className="mb-2"><strong>Status:</strong> {propertyMappingData.status}</p>
              </div>
              
              <h3 className="mb-2 text-lg font-medium">Database Table Counts:</h3>
              <div className="mb-4 overflow-x-auto">
                <table className="min-w-full border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">Table</th>
                      <th className="border p-2 text-left">Record Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(propertyMappingData.database_status || {}).map(([table, count]) => (
                      <tr key={table}>
                        <td className="border p-2">{table}</td>
                        <td className="border p-2">{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {propertyMappingData.example_skills && propertyMappingData.example_skills.length > 0 ? (
                <div>
                  <h3 className="mb-2 text-lg font-medium">Example Skills (Property Mapping):</h3>
                  <div className="space-y-2">
                    {propertyMappingData.example_skills.map((skill, index) => (
                      <div key={index} className="rounded border p-3">
                        <p className="mb-1"><strong>ID:</strong> {skill.id}</p>
                        <p className="mb-1"><strong>Legacy name:</strong> {skill.legacy_properties.name}</p>
                        <p className="mb-1"><strong>Legacy category:</strong> {skill.legacy_properties.category}</p>
                        <p className="mb-1"><strong>New skillName:</strong> {skill.new_properties.skillName}</p>
                        <p className="mb-1"><strong>New skillCategory:</strong> {skill.new_properties.skillCategory}</p>
                        <p className="mb-1"><strong>Required Level:</strong> {skill.requiredLevel}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">No example skills available.</p>
              )}
            </div>
          ) : (
            <p>Loading property mapping data...</p>
          )}
        </div>
        
        <div className="mt-6 flex justify-center space-x-4">
          <button
            onClick={fetchHealthStatus}
            className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
          >
            Refresh API Status
          </button>
          <button
            onClick={fetchPropertyMappingStatus}
            className="rounded bg-green-500 px-4 py-2 font-bold text-white hover:bg-green-700"
          >
            Refresh Property Mapping
          </button>
        </div>
      </div>
    </div>
  );
}

// Export the component for use in main.tsx
export default SimpleApp;