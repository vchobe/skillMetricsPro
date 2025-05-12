import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Simple direct render to avoid Vite chunk loading issues
createRoot(document.getElementById("root")!).render(<App />);
