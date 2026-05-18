import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";
import { classNames } from "../utils/helpers.ts";

interface ToastData {
  message: string;
  type: "success" | "error" | "warning" | "info";
}

let showToastFn: ((data: ToastData) => void) | null = null;

export function showToast(message: string, type: ToastData["type"] = "info") {
  showToastFn?.({ message, type });
}

export function Toast() {
  const [toast, setToast] = useState<ToastData | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    showToastFn = (data: ToastData) => {
      setToast(data);
      setVisible(true);
      setTimeout(() => {
        setVisible(false);
        setTimeout(() => setToast(null), 300);
      }, 3000);
    };
    return () => {
      showToastFn = null;
    };
  }, []);

  if (!toast) return null;

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  };

  const colors = {
    success:
      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300",
    error:
      "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300",
    warning:
      "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300",
    info:
      "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300",
  };

  const Icon = icons[toast.type];

  return (
    <div
      className={classNames(
        "fixed top-4 left-4 right-4 z-[100] max-w-sm mx-auto transition-all duration-300",
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      )}
    >
      <div
        className={classNames(
          "flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg backdrop-blur-md",
          colors[toast.type]
        )}
      >
        <Icon className="w-5 h-5 shrink-0" />
        <p className="text-sm font-medium flex-1">{toast.message}</p>
        <button
          onClick={() => setVisible(false)}
          className="shrink-0 opacity-60 hover:opacity-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
