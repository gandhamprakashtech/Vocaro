import { memo } from "react";
import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sublabel?: string;
  gradient?: "primary" | "warm" | "cool";
}

function StatCardBase({
  icon: Icon,
  label,
  value,
  sublabel,
  gradient = "primary",
}: StatCardProps) {
  const gradientClasses = {
    primary: "from-indigo-500 to-purple-600",
    warm: "from-amber-500 to-red-500",
    cool: "from-cyan-500 to-indigo-500",
  };

  return (
    <div className="relative overflow-hidden rounded-2xl p-4 glass animate-scale-in group hover:shadow-lg transition-all duration-300">
      <div
        className={`absolute top-0 right-0 w-24 h-24 -translate-y-8 translate-x-8 rounded-full bg-gradient-to-br ${gradientClasses[gradient]} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}
      />
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {value}
          </p>
          {sublabel && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {sublabel}
            </p>
          )}
        </div>
        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
          <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
      </div>
    </div>
  );
}

export const StatCard = memo(StatCardBase);
