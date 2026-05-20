import { classNames } from "../utils/helpers.ts";

interface SkeletonProps {
  className?: string;
  rounded?: string;
}

export function Skeleton({
  className,
  rounded = "rounded-xl",
}: SkeletonProps) {
  return (
    <div
      className={classNames("skeleton", rounded, className)}
      aria-hidden="true"
    />
  );
}
