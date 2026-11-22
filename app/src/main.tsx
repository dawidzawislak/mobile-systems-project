import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { RouteProvider } from "./context/RouteProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <RouteProvider>
    <App />
  </RouteProvider>
);
