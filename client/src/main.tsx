import './chunk-fix';  // Fix Vite chunk loading issues
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Simple direct render
createRoot(document.getElementById("root")!).render(<App />);
