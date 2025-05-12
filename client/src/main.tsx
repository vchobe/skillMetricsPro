import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// Simple direct render approach - more stable with Vite
try {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    createRoot(rootElement).render(<App />);
  } else {
    console.error("Root element not found");
    window.location.href = "/fallback"; // Redirect to static fallback
  }
} catch (error) {
  console.error("Critical error rendering app:", error);
  // Redirect to fallback page
  window.location.href = "/fallback";
}
