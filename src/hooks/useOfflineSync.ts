import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext.tsx";
import { flushOutbox } from "../services/offlineQueue.ts";
import { queryClient } from "../lib/queryClient.ts";

export function useOfflineSync() {
  const { user } = useAuth();
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!user) return;

    let active = true;

    const sync = async () => {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      setSyncing(true);
      try {
        await flushOutbox();
        await queryClient.invalidateQueries({
          queryKey: ["vocabulary", user.id],
        });
        await queryClient.invalidateQueries({
          queryKey: ["reminders", user.id],
        });
      } finally {
        if (active) setSyncing(false);
      }
    };

    const handleOnline = () => {
      void sync();
    };

    window.addEventListener("online", handleOnline);
    void sync();

    return () => {
      active = false;
      window.removeEventListener("online", handleOnline);
    };
  }, [user?.id]);

  return { syncing };
}
