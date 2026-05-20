import { RouteSkeleton } from "./skeletons/RouteSkeleton.tsx";

interface RouteLoaderProps {
  padded?: boolean;
}

export function RouteLoader({ padded = true }: RouteLoaderProps) {
  return (
    <div className={padded ? "py-2" : ""}>
      <RouteSkeleton />
    </div>
  );
}
