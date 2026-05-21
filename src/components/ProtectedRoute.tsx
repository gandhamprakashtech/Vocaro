import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.tsx";
import { RouteLoader } from "./RouteLoader.tsx";
import { ROUTES } from "../utils/constants.ts";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <RouteLoader />;
  }

  if (!user) {
    return (
      <Navigate
        to={ROUTES.login}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <>{children}</>;
}
