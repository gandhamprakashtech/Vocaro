import { useCallback, useEffect, useState } from "react";
import { supabase } from "../services/supabase.ts";
import type { User } from "@supabase/supabase-js";

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
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReminders = useCallback(async () => {
    if (!user) {
      setReminders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("reminders")
        .select("*")
        .eq("user_id", user.id)
        .order("reminder_date", { ascending: true })
        .order("reminder_time", { ascending: true });

      if (err) {
        setError(err.message);
      } else {
        // Automatically check and transition past pending/snoozed reminders to missed status
        const now = new Date();
        const updatedData = (data as Reminder[]).map((r) => {
          if ((r.status === "pending" || r.status === "snoozed")) {
            const reminderDateTime = new Date(`${r.reminder_date}T${r.reminder_time}`);
            if (reminderDateTime < now) {
              r.status = "missed";
              // We'll update the database asynchronously
              supabase
                .from("reminders")
                .update({ status: "missed" })
                .eq("id", r.id)
                .then();
            }
          }
          return r;
        });
        setReminders(updatedData);
      }
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const addReminder = async (
    reminderData: Omit<Reminder, "id" | "user_id" | "created_at" | "status"> & { status?: Reminder["status"] }
  ): Promise<{ data: Reminder | null; error: string | null }> => {
    if (!user) return { data: null, error: "Not authenticated" };
    try {
      const { data, error: err } = await supabase
        .from("reminders")
        .insert([
          {
            ...reminderData,
            user_id: user.id,
            status: reminderData.status || "pending",
          },
        ])
        .select()
        .single();

      if (err) return { data: null, error: err.message };
      await fetchReminders();
      return { data: data as Reminder, error: null };
    } catch (e: any) {
      return { data: null, error: e.message || "Insert failed" };
    }
  };

  const updateReminder = async (
    id: string,
    updates: Partial<Reminder>
  ): Promise<string | null> => {
    try {
      const { error: err } = await supabase
        .from("reminders")
        .update(updates)
        .eq("id", id);

      if (err) return err.message;
      await fetchReminders();
      return null;
    } catch (e: any) {
      return e.message || "Update failed";
    }
  };

  const deleteReminder = async (id: string): Promise<string | null> => {
    try {
      const { error: err } = await supabase
        .from("reminders")
        .delete()
        .eq("id", id);

      if (err) return err.message;
      await fetchReminders();
      return null;
    } catch (e: any) {
      return e.message || "Delete failed";
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

  const getAnalytics = (): ReminderAnalytics => {
    const total = reminders.length;
    const completed = reminders.filter((r) => r.status === "completed").length;
    const pending = reminders.filter((r) => r.status === "pending").length;
    const missed = reminders.filter((r) => r.status === "missed").length;
    const snoozed = reminders.filter((r) => r.status === "snoozed").length;
    const highPriority = reminders.filter((r) => r.priority === "high" && r.status !== "completed").length;

    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Calculate Streak (completed consecutive days)
    const completedDates = [
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
  };

  return {
    reminders,
    loading,
    error,
    addReminder,
    updateReminder,
    deleteReminder,
    completeReminder,
    snoozeReminder,
    getAnalytics,
    refresh: fetchReminders,
  };
}
