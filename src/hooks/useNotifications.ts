import { useCallback, useEffect, useState } from "react";

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    "default"
  );

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === "granted";
  }, []);

  const notify = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (permission === "granted") {
        new Notification(title, {
          icon: "/favicon.svg",
          ...options,
        });
      }
    },
    [permission]
  );

  const scheduleDailyReminder = useCallback(
    (hour: number = 20, minute: number = 0) => {
      const now = new Date();
      const target = new Date();
      target.setHours(hour, minute, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);

      const msUntilTarget = target.getTime() - now.getTime();
      setTimeout(() => {
        notify("WordVault Reminder", {
          body: "Did you learn a new word today?",
        });
        scheduleDailyReminder(hour, minute);
      }, msUntilTarget);
    },
    [notify]
  );

  return {
    permission,
    requestPermission,
    notify,
    scheduleDailyReminder,
  };
}
