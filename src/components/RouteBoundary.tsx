import { useLocation, useNavigate } from "react-router-dom";
import { ErrorBoundary } from "./ErrorBoundary.tsx";
import { ROUTES } from "../utils/constants.ts";

function RouteErrorFallback() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        This section had a hiccup
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
        Try reloading or return to the dashboard.
      </p>
      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Reload
        </button>
        <button
          onClick={() => navigate(ROUTES.dashboard, { replace: true })}
          className="px-4 py-2 rounded-xl glass text-gray-700 dark:text-gray-300 text-sm font-medium"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}

export function RouteBoundary({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <ErrorBoundary key={location.pathname} fallback={<RouteErrorFallback />}>
      {children}
    </ErrorBoundary>
  );
}
