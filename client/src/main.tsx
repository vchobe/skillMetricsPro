// Preload critical dependencies first to avoid Vite chunk loading issues
import "./preload"; 
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// Simple direct render approach
createRoot(document.getElementById("root")!).render(<App />);
