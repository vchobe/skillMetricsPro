import { createRoot } from "react-dom/client";
import "./index.css";

// Import App dynamically to avoid Vite chunk loading errors
const loadApp = async () => {
  try {
    const App = (await import("./App")).default;
    createRoot(document.getElementById("root")!).render(<App />);
  } catch (error) {
    console.error("Error loading main app, using fallback:", error);
    try {
      // Load simplified fallback UI if main app fails
      const SimpleFallbackApp = (await import("./main-fallback")).default;
      createRoot(document.getElementById("root")!).render(<SimpleFallbackApp />);
    } catch (fallbackError) {
      console.error("Even fallback failed:", fallbackError);
      createRoot(document.getElementById("root")!).render(
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow-md">
            <h1 className="mb-4 text-center text-2xl font-bold text-red-600">Loading Error</h1>
            <p className="text-center text-gray-600">
              Could not load the application UI. The backend API is still working correctly.
            </p>
          </div>
        </div>
      );
    }
  }
};

loadApp();
