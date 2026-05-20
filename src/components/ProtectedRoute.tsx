import { useAuth } from "../contexts/AuthContext.tsx";
import { RouteLoader } from "./RouteLoader.tsx";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return <RouteLoader />;
  }

  return <>{children}</>;
}
