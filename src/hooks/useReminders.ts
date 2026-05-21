import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../services/supabase.ts";
import { queryClient } from "../lib/queryClient.ts";
import { readCache, writeCache } from "../services/localDb.ts";
import { enqueueAction } from "../services/offlineQueue.ts";
import { createId } from "../utils/id.ts";

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high";
  reminder_date: string; // YYYY-MM-DD
  reminder_time: string; // HH:MM (or HH:MM:SS)
  notification_enabled: boolean;
  repeat_type: "none" | "daily" | "weekly" | "monthly";
  status: "pending" | "completed" | "missed" | "snoozed";
  created_at: string;
}

interface ReminderAnalytics {
  completedCount: number;
  pendingCount: number;
  missedCount: number;
  snoozedCount: number;
  totalCount: number;
  completionRate: number;
  highPriorityCount: number;
  streak: number;
  weeklyStats: { day: string; completed: number; missed: number }[];
}

interface UseRemindersReturn {
  reminders: Reminder[];
  loading: boolean;
  error: string | null;
  addReminder: (
    reminder: Omit<Reminder, "id" | "user_id" | "created_at" | "status"> & { status?: Reminder["status"] }
  ) => Promise<{ data: Reminder | null; error: string | null }>;
  updateReminder: (id: string, updates: Partial<Reminder>) => Promise<string | null>;
  deleteReminder: (id: string) => Promise<string | null>;
  completeReminder: (reminder: Reminder) => Promise<string | null>;
  snoozeReminder: (id: string, minutes: number) => Promise<string | null>;
  getAnalytics: () => ReminderAnalytics;
  refresh: () => Promise<void>;
}

export function useReminders(user: User | null): UseRemindersReturn {
  type AddPayload = {
    data: Omit<Reminder, "id" | "user_id" | "created_at" | "status"> & {
      status?: Reminder["status"];
    };
    clientId: string;
    createdAt: string;
  };

  type UpdatePayload = { id: string; updates: Partial<Reminder> };
  type DeletePayload = { id: string };
  type MutationContext = { previous: Reminder[] };

  const queryKey = useMemo(() => ["reminders", user?.id], [user?.id]);
  const cacheKey = user?.id ? `reminders:${user.id}` : "";
  const [isBootstrapped, setIsBootstrapped] = useState(() => !user?.id);

  const normalizeReminders = useCallback((data: Reminder[]): Reminder[] => {
    const now = new Date();
    return data.map((r) => {
      if (r.status === "pending" || r.status === "snoozed") {
        const reminderDateTime = new Date(
          `${r.reminder_date}T${r.reminder_time}`
        );
        if (reminderDateTime < now) {
          void supabase
            .from("reminders")
            .update({ status: "missed" })
            .eq("id", r.id);
          return { ...r, status: "missed" };
        }
      }
      return r;
    });
  }, []);

  const fetchReminders = useCallback(async (): Promise<Reminder[]> => {
    if (!user?.id) return [] as Reminder[];
    const { data, error: err } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", user.id)
      .order("reminder_date", { ascending: true })
      .order("reminder_time", { ascending: true });

    if (err) throw err;
    return normalizeReminders((data || []) as Reminder[]);
  }, [normalizeReminders, user?.id]);

  const {
    data: reminders = [],
    isPending,
    error,
  } = useQuery<Reminder[], Error>({
    queryKey,
    queryFn: fetchReminders,
    enabled: !!user?.id,
  });

  useEffect(() => {
    setIsBootstrapped(!user?.id);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    readCache<Reminder[]>(cacheKey).then((cached) => {
      if (!active) return;
      if (cached) {
        queryClient.setQueryData(queryKey, cached);
      }
      setIsBootstrapped(true);
    });
    return () => {
      active = false;
    };
  }, [cacheKey, queryKey, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    if (!isPending || error) {
      setIsBootstrapped(true);
    }
  }, [user?.id, isPending, error]);

  useEffect(() => {
    if (!user?.id) return;
    writeCache(cacheKey, reminders);
  }, [cacheKey, reminders, user?.id]);

  const addMutation = useMutation<
    { offline: boolean; record: Reminder },
    Error,
    AddPayload,
    MutationContext
  >({
    mutationFn: async (payload) => {
      if (!user?.id) throw new Error("Not authenticated");

      const resolvedStatus: Reminder["status"] =
        payload.data.status ?? "pending";

      const record: Reminder = {
        id: payload.clientId,
        user_id: user.id,
        title: payload.data.title,
        description: payload.data.description ?? null,
        priority: payload.data.priority,
        reminder_date: payload.data.reminder_date,
        reminder_time: payload.data.reminder_time,
        notification_enabled: payload.data.notification_enabled,
        repeat_type: payload.data.repeat_type,
        status: resolvedStatus,
        created_at: payload.createdAt,
      };

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        await enqueueAction({ type: "reminders:add", payload: record });
        return { offline: true, record };
      }

      const { error: err } = await supabase.from("reminders").insert([record]);
      if (err) throw err;
      return { offline: false, record };
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previous =
        (queryClient.getQueryData<Reminder[]>(queryKey) as
          | Reminder[]
          | undefined) || [];

      const optimisticStatus: Reminder["status"] =
        payload.data.status ?? "pending";

      const optimistic: Reminder = {
        id: payload.clientId,
        user_id: user?.id || "",
        title: payload.data.title,
        description: payload.data.description ?? null,
        priority: payload.data.priority,
        reminder_date: payload.data.reminder_date,
        reminder_time: payload.data.reminder_time,
        notification_enabled: payload.data.notification_enabled,
        repeat_type: payload.data.repeat_type,
        status: optimisticStatus,
        created_at: payload.createdAt,
      };

      const next = [...previous, optimistic].sort((a, b) => {
        const timeA = new Date(
          `${a.reminder_date}T${a.reminder_time}`
        ).getTime();
        const timeB = new Date(
          `${b.reminder_date}T${b.reminder_time}`
        ).getTime();
        return timeA - timeB;
      });

      queryClient.setQueryData(queryKey, next);
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      if (ctx?.previous) {
        queryClient.setQueryData(queryKey, ctx.previous);
      }
    },
    onSettled: () => {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateMutation = useMutation<
    { offline: boolean },
    Error,
    UpdatePayload,
    MutationContext
  >({
    mutationFn: async (payload) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        await enqueueAction({ type: "reminders:update", payload });
        return { offline: true };
      }
      const { error: err } = await supabase
        .from("reminders")
        .update(payload.updates)
        .eq("id", payload.id);
      if (err) throw err;
      return { offline: false };
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previous =
        (queryClient.getQueryData<Reminder[]>(queryKey) as
          | Reminder[]
          | undefined) || [];

      const next = previous.map((reminder) =>
        reminder.id === payload.id
          ? { ...reminder, ...payload.updates }
          : reminder
      );

      queryClient.setQueryData(queryKey, next);
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      if (ctx?.previous) {
        queryClient.setQueryData(queryKey, ctx.previous);
      }
    },
    onSettled: () => {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = useMutation<
    { offline: boolean },
    Error,
    DeletePayload,
    MutationContext
  >({
    mutationFn: async (payload) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        await enqueueAction({ type: "reminders:delete", payload });
        return { offline: true };
      }
      const { error: err } = await supabase
        .from("reminders")
        .delete()
        .eq("id", payload.id);
      if (err) throw err;
      return { offline: false };
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previous =
        (queryClient.getQueryData<Reminder[]>(queryKey) as
          | Reminder[]
          | undefined) || [];
      queryClient.setQueryData(
        queryKey,
        previous.filter((reminder) => reminder.id !== payload.id)
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      if (ctx?.previous) {
        queryClient.setQueryData(queryKey, ctx.previous);
      }
    },
    onSettled: () => {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const addReminder = async (
    reminderData: Omit<Reminder, "id" | "user_id" | "created_at" | "status"> & { status?: Reminder["status"] }
  ): Promise<{ data: Reminder | null; error: string | null }> => {
    if (!user?.id) return { data: null, error: "Not authenticated" };
    const clientId = createId();
    const createdAt = new Date().toISOString();
    const resolvedStatus: Reminder["status"] =
      reminderData.status ?? "pending";
    try {
      await addMutation.mutateAsync({
        data: reminderData,
        clientId,
        createdAt,
      });
      return {
        data: {
          id: clientId,
          user_id: user.id,
          title: reminderData.title,
          description: reminderData.description ?? null,
          priority: reminderData.priority,
          reminder_date: reminderData.reminder_date,
          reminder_time: reminderData.reminder_time,
          notification_enabled: reminderData.notification_enabled,
          repeat_type: reminderData.repeat_type,
          status: resolvedStatus,
          created_at: createdAt,
        },
        error: null,
      };
    } catch (e: unknown) {
      return {
        data: null,
        error: e instanceof Error ? e.message : "Insert failed",
      };
    }
  };

  const updateReminder = async (
    id: string,
    updates: Partial<Reminder>
  ): Promise<string | null> => {
    try {
      await updateMutation.mutateAsync({ id, updates });
      return null;
    } catch (e: unknown) {
      return e instanceof Error ? e.message : "Update failed";
    }
  };

  const deleteReminder = async (id: string): Promise<string | null> => {
    try {
      await deleteMutation.mutateAsync({ id });
      return null;
    } catch (e: unknown) {
      return e instanceof Error ? e.message : "Delete failed";
    }
  };

  const completeReminder = async (reminder: Reminder): Promise<string | null> => {
    if (reminder.repeat_type !== "none") {
      // Calculate next scheduled date for recurring reminders
      const current = new Date(`${reminder.reminder_date}T${reminder.reminder_time}`);
      const next = new Date(current);

      if (reminder.repeat_type === "daily") {
        next.setDate(next.getDate() + 1);
      } else if (reminder.repeat_type === "weekly") {
        next.setDate(next.getDate() + 7);
      } else if (reminder.repeat_type === "monthly") {
        next.setMonth(next.getMonth() + 1);
      }

      const yyyy = next.getFullYear();
      const mm = String(next.getMonth() + 1).padStart(2, "0");
      const dd = String(next.getDate()).padStart(2, "0");

      // Auto reschedule recurring tasks and set status back to pending
      return updateReminder(reminder.id, {
        reminder_date: `${yyyy}-${mm}-${dd}`,
        status: "pending",
      });
    } else {
      return updateReminder(reminder.id, { status: "completed" });
    }
  };

  const snoozeReminder = async (id: string, minutes: number): Promise<string | null> => {
    const target = new Date();
    target.setMinutes(target.getMinutes() + minutes);

    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, "0");
    const dd = String(target.getDate()).padStart(2, "0");
    const padH = String(target.getHours()).padStart(2, "0");
    const padM = String(target.getMinutes()).padStart(2, "0");

    return updateReminder(id, {
      reminder_date: `${yyyy}-${mm}-${dd}`,
      reminder_time: `${padH}:${padM}`,
      status: "snoozed",
    });
  };

  const getAnalytics = useCallback((): ReminderAnalytics => {
    const total = reminders.length;
    const completed = reminders.filter((r) => r.status === "completed").length;
    const pending = reminders.filter((r) => r.status === "pending").length;
    const missed = reminders.filter((r) => r.status === "missed").length;
    const snoozed = reminders.filter((r) => r.status === "snoozed").length;
    const highPriority = reminders.filter((r) => r.priority === "high" && r.status !== "completed").length;

    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Calculate Streak (completed consecutive days)
    const completedDates: string[] = [
      ...new Set(
        reminders
          .filter((r) => r.status === "completed")
          .map((r) => new Date(r.reminder_date).toDateString())
      ),
    ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let streak = 0;
    if (completedDates.length > 0) {
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      
      if (completedDates[0] === today || completedDates[0] === yesterday) {
        streak = 1;
        for (let i = 1; i < completedDates.length; i++) {
          const prev = new Date(completedDates[i - 1]);
          const curr = new Date(completedDates[i]);
          const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
          if (diff <= 1.1) { // 1 day difference (accounting for minor timezone drift)
            streak++;
          } else {
            break;
          }
        }
      }
    }

    // Weekly Distribution (Last 7 Days)
    const daysName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyStats = Array.from({ length: 7 })
      .map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayLabel = daysName[d.getDay()];
        const dateStr = d.toISOString().split("T")[0];

        const dayReminders = reminders.filter((r) => r.reminder_date === dateStr);
        const comp = dayReminders.filter((r) => r.status === "completed").length;
        const miss = dayReminders.filter((r) => r.status === "missed").length;

        return { day: dayLabel, completed: comp, missed: miss, date: dateStr };
      })
      .reverse();

    return {
      completedCount: completed,
      pendingCount: pending,
      missedCount: missed,
      snoozedCount: snoozed,
      totalCount: total,
      completionRate: rate,
      highPriorityCount: highPriority,
      streak,
      weeklyStats,
    };
  }, [reminders]);

  return {
    reminders,
    loading: !isBootstrapped,
    error: error instanceof Error ? error.message : null,
    addReminder,
    updateReminder,
    deleteReminder,
    completeReminder,
    snoozeReminder,
    getAnalytics,
    refresh: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  };
}
