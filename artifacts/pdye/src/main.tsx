import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if (window.location.hash.startsWith("#/")) {
  const target = window.location.hash.slice(1) + window.location.search;
  window.history.replaceState(null, "", target);
}

createRoot(document.getElementById("root")!).render(<App />);
