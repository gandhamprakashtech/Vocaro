import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { ThemeProvider } from "./contexts/ThemeContext.tsx";
import { ReminderProvider } from "./contexts/ReminderContext.tsx";
import App from "./App.tsx";
import { queryClient } from "./lib/queryClient.ts";
import "./styles/index.css";

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <ReminderProvider>
              <App />
            </ReminderProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);

// Auto-reload the application when a new PWA version is pushed
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  const reloadFlagKey = "wordvault:sw-reload";
  let refreshing = false;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;

    try {
      if (sessionStorage.getItem(reloadFlagKey)) return;
      sessionStorage.setItem(reloadFlagKey, "1");
    } catch {
      // If storage is unavailable, proceed with a single reload per page load.
    }

    refreshing = true;
    window.location.reload();
  });
}
