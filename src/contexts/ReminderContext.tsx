import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext.tsx";
import { useReminders, type Reminder } from "../hooks/useReminders.ts";
import { showToast } from "../components/Toast.tsx";
import { Bell, Clock, CheckCircle2, X } from "lucide-react";

interface ReminderContextType {
  activeDueReminders: Reminder[];
  permission: NotificationPermission;
  requestPermission: () => Promise<boolean>;
  snoozeReminderLocal: (id: string, minutes: number) => Promise<void>;
  completeReminderLocal: (reminder: Reminder) => Promise<void>;
  dismissActiveReminder: (id: string) => void;
  playNotificationChime: () => void;
}

const ReminderContext = createContext<ReminderContextType | undefined>(undefined);

export function ReminderProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const {
    reminders,
    snoozeReminder,
    completeReminder,
    refresh,
  } = useReminders(user);

  const [activeDueReminders, setActiveDueReminders] = useState<Reminder[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [notifiedIds, setNotifiedIds] = useState<Set<string>>(new Set());

  // 1. Sync and request browser notification permission status
  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!("Notification" in window)) {
      showToast("Notifications not supported in this browser", "warning");
      return false;
    }
    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      if (res === "granted") {
        showToast("Reminders and alerts enabled!", "success");
        playNotificationChime();
        return true;
      }
      return false;
    } catch (e) {
      console.error("Error requesting notification permission:", e);
      return false;
    }
  };

  // 2. Soothing Audio Synthesis using the Web Audio API
  const playNotificationChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Elegant gentle sine wave
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);

        // Exponential decay envelope
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.12, start + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + duration);
      };

      // Play a beautiful, emotionally calm arpeggio (C5 -> E5 -> G5 -> C6)
      playTone(523.25, now, 1.2);       // C5
      playTone(659.25, now + 0.12, 1.2); // E5
      playTone(783.99, now + 0.24, 1.5); // G5
      playTone(1046.50, now + 0.36, 2.0); // C6
    } catch (err) {
      console.warn("Unable to play synthesized notification audio:", err);
    }
  }, []);

  // 3. Real-time background scheduling checker
  useEffect(() => {
    if (!user || reminders.length === 0) return;

    const checkInterval = setInterval(() => {
      const now = new Date();
      const due: Reminder[] = [];

      reminders.forEach((r) => {
        if ((r.status === "pending" || r.status === "snoozed") && !notifiedIds.has(r.id)) {
          // Combine date and time to create exact Date object
          const reminderDateTime = new Date(`${r.reminder_date}T${r.reminder_time}`);
          
          // Trigger when scheduled time has arrived or passed (within the past 2 hours to avoid spamming old tasks)
          const diffMs = now.getTime() - reminderDateTime.getTime();
          if (diffMs >= 0 && diffMs < 1000 * 60 * 120) {
            due.push(r);
          }
        }
      });

      if (due.length > 0) {
        // Trigger alert systems
        due.forEach((r) => {
          // Add to system notifications
          if (permission === "granted") {
            try {
              new Notification(`Reminder: ${r.title}`, {
                body: `${r.priority.toUpperCase()} priority • ${r.description || "Active memory assistance alert"}`,
                icon: "/favicon.svg",
                tag: r.id,
                requireInteraction: true,
              });
            } catch (e) {
              console.warn("Failed to fire system Notification API directly:", e);
            }
          }
          // Add to local notified list
          setNotifiedIds((prev) => {
            const next = new Set(prev);
            next.add(r.id);
            return next;
          });
        });

        // Trigger in-app UI & play sound
        setActiveDueReminders((prev) => {
          const combined = [...prev];
          due.forEach((d) => {
            if (!combined.some((item) => item.id === d.id)) {
              combined.push(d);
            }
          });
          return combined;
        });

        playNotificationChime();
      }
    }, 15000); // Check every 15 seconds

    return () => clearInterval(checkInterval);
  }, [user, reminders, notifiedIds, permission, playNotificationChime]);

  // 4. Action Handlers
  const snoozeReminderLocal = async (id: string, minutes: number) => {
    const err = await snoozeReminder(id, minutes);
    if (err) {
      showToast(`Could not snooze: ${err}`, "error");
    } else {
      showToast(`Snoozed for ${minutes} minutes`, "success");
      // Remove from active list
      setActiveDueReminders((prev) => prev.filter((r) => r.id !== id));
      // Remove from notified IDs so it triggers again when the snooze is up
      setNotifiedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await refresh();
    }
  };

  const completeReminderLocal = async (reminder: Reminder) => {
    const err = await completeReminder(reminder);
    if (err) {
      showToast(`Could not complete: ${err}`, "error");
    } else {
      showToast("Task completed! Excellent job.", "success");
      setActiveDueReminders((prev) => prev.filter((r) => r.id !== reminder.id));
      await refresh();
    }
  };

  const dismissActiveReminder = (id: string) => {
    setActiveDueReminders((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <ReminderContext.Provider
      value={{
        activeDueReminders,
        permission,
        requestPermission,
        snoozeReminderLocal,
        completeReminderLocal,
        dismissActiveReminder,
        playNotificationChime,
      }}
    >
      {children}

      {/* Global High-Fidelity Glassmorphic In-App Alert Modal Overlay */}
      {activeDueReminders.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-950/40 dark:bg-gray-950/60 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-3xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden animate-scale-in border border-white/20 dark:border-white/10">
            {/* Ambient Background Aura */}
            <div className="absolute top-0 right-0 w-32 h-32 -translate-y-8 translate-x-8 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 translate-y-8 -translate-x-8 rounded-full bg-purple-500/20 blur-2xl pointer-events-none" />

            {/* Alert Header */}
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 animate-pulse">
                  <Bell className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase">
                  Companion Alert
                </span>
              </div>
              <button
                onClick={() => dismissActiveReminder(activeDueReminders[0].id)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Active Reminder Content */}
            <div className="mb-6 relative z-10">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1 leading-snug">
                {activeDueReminders[0].title}
              </h3>
              {activeDueReminders[0].description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
                  {activeDueReminders[0].description}
                </p>
              )}
              <div className="flex flex-wrap gap-2 items-center text-xs mt-2">
                <span
                  className={`px-2 py-0.5 rounded-full font-semibold ${
                    activeDueReminders[0].priority === "high"
                      ? "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400"
                      : activeDueReminders[0].priority === "medium"
                      ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
                      : "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400"
                  }`}
                >
                  {activeDueReminders[0].priority.toUpperCase()} priority
                </span>
                <span className="text-gray-400 dark:text-gray-500">
                  Scheduled for {activeDueReminders[0].reminder_time.slice(0, 5)}
                </span>
              </div>
            </div>

            {/* Interactive Actions Grid */}
            <div className="grid grid-cols-1 gap-2 relative z-10">
              <button
                onClick={() => completeReminderLocal(activeDueReminders[0])}
                className="w-full h-12 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all"
              >
                <CheckCircle2 className="w-5 h-5" />
                Mark as Completed
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => snoozeReminderLocal(activeDueReminders[0].id, 10)}
                  className="h-11 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl flex items-center justify-center gap-1.5 hover:bg-gray-100 dark:hover:bg-gray-900 active:scale-[0.98] transition-all text-sm"
                >
                  <Clock className="w-4 h-4" />
                  Snooze 10m
                </button>
                <button
                  onClick={() => snoozeReminderLocal(activeDueReminders[0].id, 60)}
                  className="h-11 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl flex items-center justify-center gap-1.5 hover:bg-gray-100 dark:hover:bg-gray-900 active:scale-[0.98] transition-all text-sm"
                >
                  <Clock className="w-4 h-4" />
                  Snooze 1h
                </button>
              </div>

              {activeDueReminders.length > 1 && (
                <p className="text-[10px] text-center text-gray-400 dark:text-gray-500 mt-2">
                  + {activeDueReminders.length - 1} more reminders waiting
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </ReminderContext.Provider>
  );
}

export function useReminderContext() {
  const ctx = useContext(ReminderContext);
  if (!ctx) throw new Error("useReminderContext must be used within ReminderProvider");
  return ctx;
}
