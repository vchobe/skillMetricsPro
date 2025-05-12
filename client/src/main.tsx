// Load dependencies in the correct order to avoid Vite chunk issues
import { createRoot } from "react-dom/client";
import "./index.css";

// Import these first to avoid the chunk loading errors
import 'zod';
import 'drizzle-zod';
import '@tanstack/react-query';
import '@hookform/resolvers/zod';

// Import App after dependencies are loaded
import App from "./App";

// Simple direct render
createRoot(document.getElementById("root")!).render(<App />);
