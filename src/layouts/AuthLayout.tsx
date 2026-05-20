import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.tsx";
import { ROUTES } from "../utils/constants.ts";
import { BookOpen } from "lucide-react";
import { RouteLoader } from "../components/RouteLoader.tsx";

export function AuthLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <RouteLoader />;
  }

  if (user) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="mb-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            WordVault
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Build your vocabulary, one word at a time
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
