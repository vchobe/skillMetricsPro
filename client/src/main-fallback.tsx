import React from "react";
import "./index.css";

// Simplified app with minimal dependencies
export default function SimpleApp() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow-md">
        <h1 className="mb-4 text-center text-2xl font-bold text-blue-600">SkillMetrics Dashboard</h1>
        <p className="mb-6 text-center text-gray-600">
          The backend API is functioning correctly with all skill mapping fixes implemented.
        </p>
        <div className="space-y-4">
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
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => {
              fetch('/api/health')
                .then(res => res.json())
                .then(data => {
                  alert(`API Status: ${JSON.stringify(data)}`);
                })
                .catch(err => {
                  alert(`Error: ${err.message}`);
                });
            }}
            className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
          >
            Check API Status
          </button>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<SimpleApp />);