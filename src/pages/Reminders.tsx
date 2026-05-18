import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext.tsx";
import { useReminders, type Reminder } from "../hooks/useReminders.ts";
import { useReminderContext } from "../contexts/ReminderContext.tsx";
import { parseNaturalLanguage } from "../utils/nlpParser.ts";
import { showToast } from "../components/Toast.tsx";
import { classNames, formatDate } from "../utils/helpers.ts";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  ListTodo,
  Brain,
  Clock,
  Trash2,
  CheckCircle2,
  AlertCircle,
  CalendarRange,
  Send,
  Flame,
  TrendingUp,
  X,
  ChevronRight,
  BellRing,
} from "lucide-react";

export default function Reminders() {
  const { user } = useAuth();
  const {
    reminders,
    loading,
    addReminder,
    updateReminder,
    deleteReminder,
    completeReminder,
    snoozeReminder,
    getAnalytics,
  } = useReminders(user);

  const { permission, requestPermission } = useReminderContext();

  // Tab State: "dashboard", "list", "calendar"
  const [activeTab, setActiveTab] = useState<"dashboard" | "list" | "calendar">("dashboard");

  // Detailed Modal Sheet Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formPriority, setFormPriority] = useState<Reminder["priority"]>("medium");
  const [formNotification, setFormNotification] = useState(true);
  const [formRepeat, setFormRepeat] = useState<Reminder["repeat_type"]>("none");

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Reminder["status"]>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | Reminder["priority"]>("all");
  const [sortBy, setSortBy] = useState<"time" | "priority">("time");

  // NLP Bar state
  const [nlpInputText, setNlpInputText] = useState("");

  // Timeline & Weekly strip state
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Initialize detailed form default values
  useEffect(() => {
    if (isFormOpen) {
      if (editingReminder) {
        setFormTitle(editingReminder.title);
        setFormDesc(editingReminder.description || "");
        setFormDate(editingReminder.reminder_date);
        setFormTime(editingReminder.reminder_time.slice(0, 5));
        setFormPriority(editingReminder.priority);
        setFormNotification(editingReminder.notification_enabled);
        setFormRepeat(editingReminder.repeat_type);
      } else {
        // Sensible defaults
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        
        // Add 1 hour to current time for default time slot
        const futureTime = new Date(today.getTime() + 60 * 60 * 1000);
        const padH = String(futureTime.getHours()).padStart(2, "0");
        const padM = String(futureTime.getMinutes()).padStart(2, "0");

        setFormTitle("");
        setFormDesc("");
        setFormDate(`${yyyy}-${mm}-${dd}`);
        setFormTime(`${padH}:${padM}`);
        setFormPriority("medium");
        setFormNotification(true);
        setFormRepeat("none");
      }
    }
  }, [isFormOpen, editingReminder]);

  // NLP Live feedback parsing
  const nlpPreview = useMemo(() => {
    if (!nlpInputText.trim()) return null;
    return parseNaturalLanguage(nlpInputText);
  }, [nlpInputText]);

  // Compute analytics metrics
  const stats = useMemo(() => getAnalytics(), [reminders, getAnalytics]);

  // Filtered Reminders List
  const filteredReminders = useMemo(() => {
    return reminders
      .filter((r) => {
        // Search filter
        const matchSearch =
          r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()));

        // Status filter
        const matchStatus = statusFilter === "all" || r.status === statusFilter;

        // Priority filter
        const matchPriority = priorityFilter === "all" || r.priority === priorityFilter;

        return matchSearch && matchStatus && matchPriority;
      })
      .sort((a, b) => {
        if (sortBy === "priority") {
          const priorityWeights = { high: 3, medium: 2, low: 1 };
          return priorityWeights[b.priority] - priorityWeights[a.priority];
        }
        // Default sort by Date + Time chronological
        const timeA = new Date(`${a.reminder_date}T${a.reminder_time}`).getTime();
        const timeB = new Date(`${b.reminder_date}T${b.reminder_time}`).getTime();
        return timeA - timeB;
      });
  }, [reminders, searchQuery, statusFilter, priorityFilter, sortBy]);

  // Reminders grouped by the active weekly strip days
  const weeklyStripDays = useMemo(() => {
    const daysName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - d.getDay() + i); // Start from Sunday of current week
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;

      // Count reminders on this day
      const count = reminders.filter((r) => r.reminder_date === dateStr).length;

      return {
        label: daysName[d.getDay()],
        dayNumber: d.getDate(),
        dateString: dateStr,
        count,
      };
    });
  }, [reminders]);

  // Timeline hour slots (00:00 to 23:00)
  const timelineReminders = useMemo(() => {
    return reminders.filter((r) => r.reminder_date === selectedDate);
  }, [reminders, selectedDate]);

  // Submit Quick NLP Input
  const handleNlpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlpInputText.trim()) return;

    const parsed = parseNaturalLanguage(nlpInputText);
    const { error: err } = await addReminder({
      title: parsed.title,
      description: "Created via Natural Language Parser",
      priority: parsed.priority,
      reminder_date: parsed.date,
      reminder_time: parsed.time,
      notification_enabled: true,
      repeat_type: "none",
    });

    if (err) {
      showToast(`Could not save task: ${err}`, "error");
    } else {
      showToast(`Saved task! scheduled for ${parsed.date} at ${parsed.time}`, "success");
      setNlpInputText("");
    }
  };

  // Submit Detailed Modal Sheet Form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast("Please enter a title", "warning");
      return;
    }

    const payload = {
      title: formTitle.trim(),
      description: formDesc.trim() || null,
      priority: formPriority,
      reminder_date: formDate,
      reminder_time: formTime + ":00", // Enforce standard SQL Time format
      notification_enabled: formNotification,
      repeat_type: formRepeat,
    };

    let errorMsg: string | null = null;
    if (editingReminder) {
      errorMsg = await updateReminder(editingReminder.id, payload);
    } else {
      const { error } = await addReminder(payload);
      errorMsg = error;
    }

    if (errorMsg) {
      showToast(`Error: ${errorMsg}`, "error");
    } else {
      showToast(
        editingReminder ? "Reminder updated successfully" : "Reminder created successfully",
        "success"
      );
      setIsFormOpen(false);
      setEditingReminder(null);
    }
  };

  // Handle reminder quick completion
  const handleQuickComplete = async (reminder: Reminder) => {
    const err = await completeReminder(reminder);
    if (err) {
      showToast(`Failed: ${err}`, "error");
    } else {
      showToast("Completed! Great job keeping on track.", "success");
    }
  };

  // Handle quick delete
  const handleDelete = async (id: string) => {
    const err = await deleteReminder(id);
    if (err) {
      showToast(`Failed to delete: ${err}`, "error");
    } else {
      showToast("Reminder deleted", "info");
    }
  };

  // Handle quick snooze
  const handleSnooze = async (id: string, minutes: number) => {
    const err = await snoozeReminder(id, minutes);
    if (err) {
      showToast(`Failed to snooze: ${err}`, "error");
    } else {
      showToast(`Snoozed for ${minutes} mins`, "success");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Calm & Reassuring Premium Header */}
      <div className="glass rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 -translate-y-8 translate-x-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-600/10 blur-xl pointer-events-none" />
        <div className="flex items-start justify-between relative z-10">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
              <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Memory Companion
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed max-w-[280px]">
              {stats.pendingCount > 0
                ? `Take a deep breath. You have ${stats.pendingCount} active reminders. I am holding your commitments safely.`
                : "Your mind is completely free. You are completely organized."}
            </p>
          </div>
          {permission !== "granted" && (
            <button
              onClick={requestPermission}
              className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 px-2.5 py-1.5 rounded-xl border border-indigo-200/50 dark:border-indigo-800/40 flex items-center gap-1 active:scale-95 transition-all"
            >
              <BellRing className="w-3.5 h-3.5" />
              Enable Alerts
            </button>
          )}
        </div>
      </div>

      {/* Quick NLP Add Input Bar */}
      <form onSubmit={handleNlpSubmit} className="glass rounded-2xl p-4 space-y-2 relative overflow-hidden">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={nlpInputText}
              onChange={(e) => setNlpInputText(e.target.value)}
              placeholder="e.g. Submit chemistry homework tomorrow at 10 AM..."
              className="w-full h-11 px-4 pr-10 text-xs bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 text-gray-950 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 font-semibold"
            />
            {nlpInputText && (
              <button
                type="button"
                onClick={() => setNlpInputText("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={!nlpInputText.trim()}
            className="w-11 h-11 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:hover:shadow-none disabled:active:scale-100 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Real-time feedback parser card */}
        {nlpPreview && (
          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/20 rounded-xl p-2.5 text-[10px] text-indigo-700 dark:text-indigo-300 animate-slide-up flex flex-wrap gap-x-3 gap-y-1 items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="font-bold">Auto-Detected:</span>
              <span className="opacity-90">{nlpPreview.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 font-bold uppercase tracking-wider text-[8px]">
                {nlpPreview.priority} Priority
              </span>
              <span className="font-bold flex items-center gap-0.5">
                <Clock className="w-3 h-3" />
                {nlpPreview.date} at {nlpPreview.time}
              </span>
            </div>
          </div>
        )}
      </form>

      {/* Tabs Switcher Navigation */}
      <div className="flex bg-gray-100/50 dark:bg-gray-900/30 p-1 rounded-2xl border border-gray-200/10">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={classNames(
            "flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer",
            activeTab === "dashboard"
              ? "bg-white dark:bg-gray-950 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200/20"
              : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          )}
        >
          <TrendingUp className="w-4 h-4" />
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab("list")}
          className={classNames(
            "flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer",
            activeTab === "list"
              ? "bg-white dark:bg-gray-950 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200/20"
              : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          )}
        >
          <ListTodo className="w-4 h-4" />
          Reminders
        </button>
        <button
          onClick={() => setActiveTab("calendar")}
          className={classNames(
            "flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer",
            activeTab === "calendar"
              ? "bg-white dark:bg-gray-950 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200/20"
              : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          )}
        >
          <CalendarRange className="w-4 h-4" />
          Timeline
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="space-y-6">
        {loading ? (
          /* Loading Skeletons */
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-2xl bg-gray-100 dark:bg-gray-900 animate-pulse border border-gray-200/10"
              />
            ))}
          </div>
        ) : reminders.length === 0 ? (
          /* Empty State */
          <div className="glass rounded-3xl p-8 text-center space-y-4 border border-gray-200/10">
            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto">
              <Brain className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                No reminders configured
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                Organize your life easily. Type a quick reminder like "Call Krishna sir at 6 PM" above to start!
              </p>
            </div>
            <button
              onClick={() => {
                setEditingReminder(null);
                setIsFormOpen(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-xs font-semibold hover:shadow-lg active:scale-95 transition-all mx-auto cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Detailed Reminder
            </button>
          </div>
        ) : (
          <>
            {/* TAB 1: COMPANION DASHBOARD */}
            {activeTab === "dashboard" && (
              <div className="space-y-5 animate-slide-up">
                {/* Stats Ring & Streak Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="glass rounded-2xl p-4 flex flex-col justify-between border border-gray-200/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Completion
                      </span>
                      <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                        {stats.completionRate}%
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2">
                      {stats.completedCount} of {stats.totalCount} tasks complete
                    </p>
                  </div>

                  <div className="glass rounded-2xl p-4 flex flex-col justify-between border border-gray-200/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Memory Streak
                      </span>
                      <Flame className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                        {stats.streak}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">days</span>
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2">
                      Keep completing daily tasks!
                    </p>
                  </div>
                </div>

                {/* Today's Priority Highlights */}
                {stats.highPriorityCount > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
                      <h2 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                        High Priority Focus ({stats.highPriorityCount})
                      </h2>
                    </div>
                    <div className="space-y-2">
                      {reminders
                        .filter((r) => r.priority === "high" && r.status !== "completed")
                        .slice(0, 3)
                        .map((r) => (
                          <div
                            key={r.id}
                            className="glass rounded-xl p-4 border border-red-500/10 bg-red-500/[0.02] dark:bg-red-500/[0.01] flex items-center justify-between animate-scale-in"
                          >
                            <div className="flex-1 min-w-0 pr-4">
                              <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                                {r.title}
                              </h3>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1 font-medium">
                                <Clock className="w-3.5 h-3.5" />
                                {formatDate(r.reminder_date)} at {r.reminder_time.slice(0, 5)}
                              </p>
                            </div>
                            <button
                              onClick={() => handleQuickComplete(r)}
                              className="w-8 h-8 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-200 dark:hover:text-indigo-400 dark:hover:border-indigo-800 active:scale-90 transition-all cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Today's Complete Task Agenda overview */}
                <div className="space-y-3">
                  <h2 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                    Today's Companion Summary
                  </h2>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="glass rounded-xl p-3 border border-gray-200/10">
                      <p className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                        {reminders.filter((r) => r.status === "pending" || r.status === "snoozed").length}
                      </p>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">
                        Active Reminders
                      </p>
                    </div>
                    <div className="glass rounded-xl p-3 border border-gray-200/10">
                      <p className="text-sm font-extrabold text-green-600 dark:text-green-400">
                        {reminders.filter((r) => r.status === "completed").length}
                      </p>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">
                        Completed Today
                      </p>
                    </div>
                    <div className="glass rounded-xl p-3 border border-gray-200/10">
                      <p className="text-sm font-extrabold text-red-600 dark:text-red-400">
                        {reminders.filter((r) => r.status === "missed").length}
                      </p>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">
                        Neglected/Missed
                      </p>
                    </div>
                    <div className="glass rounded-xl p-3 border border-gray-200/10">
                      <p className="text-sm font-extrabold text-amber-600 dark:text-amber-400">
                        {reminders.filter((r) => r.status === "snoozed").length}
                      </p>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">
                        Snoozed Tasks
                      </p>
                    </div>
                  </div>
                </div>

                {/* Productivity Weekly Analytics Bar chart placeholder / rendered visually */}
                <div className="glass rounded-2xl p-4 border border-gray-200/10">
                  <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-4 flex items-center justify-between">
                    <span>Weekly Performance</span>
                    <span className="text-[9px] text-gray-400">Past 7 Days</span>
                  </h3>
                  <div className="flex items-end justify-between h-28 px-2">
                    {stats.weeklyStats.map((item, index) => {
                      const maxVal = Math.max(...stats.weeklyStats.map((s) => s.completed + s.missed), 1);
                      const totalVal = item.completed + item.missed;
                      const completedPct = totalVal > 0 ? (item.completed / maxVal) * 100 : 0;
                      const missedPct = totalVal > 0 ? (item.missed / maxVal) * 100 : 0;

                      return (
                        <div key={index} className="flex flex-col items-center gap-1.5 flex-1">
                          <div className="w-5 bg-gray-100 dark:bg-gray-900 rounded-full h-20 relative overflow-hidden flex flex-col justify-end">
                            {/* Missed bar portion */}
                            {item.missed > 0 && (
                              <div
                                style={{ height: `${missedPct}%` }}
                                className="w-full bg-red-400 dark:bg-red-950/60 rounded-b-full"
                              />
                            )}
                            {/* Completed bar portion */}
                            {item.completed > 0 && (
                              <div
                                style={{ height: `${completedPct}%` }}
                                className="w-full bg-indigo-500 dark:bg-indigo-400 rounded-t-full"
                              />
                            )}
                          </div>
                          <span className="text-[9px] font-semibold text-gray-400 dark:text-gray-500">
                            {item.day}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-center gap-4 mt-3 text-[10px] font-semibold">
                    <span className="flex items-center gap-1 text-gray-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                      Completed
                    </span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      Missed
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: REMINDERS LIST WITH FILTERS */}
            {activeTab === "list" && (
              <div className="space-y-4 animate-slide-up">
                {/* Search and Filters Strip */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search reminders by keyword..."
                      className="w-full h-10 pl-9 pr-4 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:border-indigo-500 text-gray-900 dark:text-gray-100 font-medium"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1.5 items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-gray-400" />
                      {/* Priority Filters */}
                      <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value as any)}
                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-2 py-1 font-semibold text-gray-700 dark:text-gray-300 focus:outline-none"
                      >
                        <option value="all">All Priorities</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>

                      {/* Status Filters */}
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-2 py-1 font-semibold text-gray-700 dark:text-gray-300 focus:outline-none"
                      >
                        <option value="all">All States</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="missed">Missed</option>
                        <option value="snoozed">Snoozed</option>
                      </select>
                    </div>

                    {/* Sort buttons */}
                    <button
                      onClick={() => setSortBy(sortBy === "time" ? "priority" : "time")}
                      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-2 py-1 font-bold text-indigo-600 dark:text-indigo-400 hover:bg-gray-50 active:scale-95 transition-all"
                    >
                      Sort: {sortBy === "time" ? "Time" : "Priority"}
                    </button>
                  </div>
                </div>

                {/* Filtered cards list */}
                {filteredReminders.length === 0 ? (
                  <div className="glass rounded-2xl p-8 text-center border border-gray-200/10">
                    <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-gray-500">No matching reminders found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredReminders.map((r) => (
                      <div
                        key={r.id}
                        className={classNames(
                          "glass rounded-2xl p-4 border transition-all duration-200 relative overflow-hidden animate-scale-in",
                          r.status === "completed"
                            ? "opacity-60 border-gray-200/20 dark:border-gray-800/20"
                            : r.status === "missed"
                            ? "border-red-500/25 dark:border-red-950/40 bg-red-500/[0.01]"
                            : r.status === "snoozed"
                            ? "border-amber-500/25 dark:border-amber-950/40"
                            : "border-gray-200/50 dark:border-gray-800/40"
                        )}
                      >
                        {/* Status bar */}
                        <div
                          className={classNames(
                            "absolute left-0 top-0 bottom-0 w-1",
                            r.status === "completed"
                              ? "bg-green-500"
                              : r.status === "missed"
                              ? "bg-red-500"
                              : r.status === "snoozed"
                              ? "bg-amber-500"
                              : "bg-indigo-500"
                          )}
                        />

                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {/* Header row */}
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <span
                                className={classNames(
                                  "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider",
                                  r.priority === "high"
                                    ? "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400"
                                    : r.priority === "medium"
                                    ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
                                    : "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400"
                                )}
                              >
                                {r.priority}
                              </span>
                              {r.repeat_type !== "none" && (
                                <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">
                                  🔁 {r.repeat_type}
                                </span>
                              )}
                              <span
                                className={classNames(
                                  "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider",
                                  r.status === "completed"
                                    ? "bg-green-100 dark:bg-green-950/40 text-green-700"
                                    : r.status === "missed"
                                    ? "bg-red-100 dark:bg-red-950/40 text-red-700"
                                    : r.status === "snoozed"
                                    ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700"
                                    : "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400"
                                )}
                              >
                                {r.status}
                              </span>
                            </div>

                            <h3
                              className={classNames(
                                "text-sm font-bold text-gray-900 dark:text-gray-100 leading-snug",
                                r.status === "completed" ? "line-through opacity-70" : ""
                              )}
                            >
                              {r.title}
                            </h3>

                            {r.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed truncate">
                                {r.description}
                              </p>
                            )}

                            {/* Scheduling time info */}
                            <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-gray-400 dark:text-gray-500 font-semibold">
                              <Clock className="w-3.5 h-3.5 text-indigo-500" />
                              <span>{formatDate(r.reminder_date)}</span>
                              <span>at</span>
                              <span className="text-indigo-600 dark:text-indigo-400">
                                {r.reminder_time.slice(0, 5)}
                              </span>
                            </div>
                          </div>

                          {/* Quick completion & secondary action sheet */}
                          <div className="flex flex-col gap-2 shrink-0 items-end">
                            {r.status !== "completed" && (
                              <button
                                onClick={() => handleQuickComplete(r)}
                                className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/35 hover:scale-105 active:scale-90 transition-all cursor-pointer"
                                title="Mark Completed"
                              >
                                <CheckCircle2 className="w-4.5 h-4.5" />
                              </button>
                            )}
                            <div className="flex gap-1.5">
                              {r.status !== "completed" && (
                                <button
                                  onClick={() => handleSnooze(r.id, 10)}
                                  className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-gray-200/40 dark:border-gray-800/40 hover:border-amber-200 active:scale-90 transition-all cursor-pointer"
                                  title="Snooze 10 mins"
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setEditingReminder(r);
                                  setIsFormOpen(true);
                                }}
                                className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-gray-200/40 dark:border-gray-800/40 hover:border-indigo-200 active:scale-90 transition-all cursor-pointer"
                                title="Edit detailed"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(r.id)}
                                className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border border-gray-200/40 dark:border-gray-800/40 hover:border-red-200 active:scale-90 transition-all cursor-pointer"
                                title="Delete task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: TIMELINE AND CALENDAR VIEW */}
            {activeTab === "calendar" && (
              <div className="space-y-5 animate-slide-up">
                {/* Horizontal Weekly strip selector */}
                <div className="flex justify-between items-center gap-1 bg-white dark:bg-gray-900 p-2.5 rounded-2xl border border-gray-200/50 dark:border-gray-800/40">
                  {weeklyStripDays.map((day) => {
                    const isSelected = day.dateString === selectedDate;
                    return (
                      <button
                        key={day.dateString}
                        onClick={() => setSelectedDate(day.dateString)}
                        className={classNames(
                          "flex-1 flex flex-col items-center p-1.5 rounded-xl transition-all cursor-pointer relative",
                          isSelected
                            ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/25 scale-[1.03]"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        )}
                      >
                        <span
                          className={classNames(
                            "text-[9px] font-bold uppercase",
                            isSelected ? "text-indigo-100" : "text-gray-400"
                          )}
                        >
                          {day.label}
                        </span>
                        <span className="text-xs font-black mt-0.5">{day.dayNumber}</span>
                        {/* dot counter indicators */}
                        {day.count > 0 && (
                          <span
                            className={classNames(
                              "w-1.5 h-1.5 rounded-full absolute bottom-1",
                              isSelected ? "bg-white" : "bg-indigo-500"
                            )}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Day title & summary indicator */}
                <div className="flex items-center justify-between border-b border-gray-200/30 pb-2">
                  <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                    Timeline Agenda • {formatDate(selectedDate)}
                  </h3>
                  <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-full">
                    {timelineReminders.length} reminder{timelineReminders.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Vertical Hourly timeline slots layout */}
                {timelineReminders.length === 0 ? (
                  <div className="glass rounded-2xl p-8 text-center border border-gray-200/10">
                    <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-gray-500">No events scheduled on this day</p>
                  </div>
                ) : (
                  <div className="relative pl-6 border-l-2 border-indigo-100 dark:border-indigo-950/60 ml-2.5 space-y-4 py-2">
                    {timelineReminders.map((r) => {
                      // Parse hour to format nicely
                      const hourStr = r.reminder_time.slice(0, 5);
                      return (
                        <div key={r.id} className="relative group">
                          {/* Anchor point circle dot */}
                          <div className="w-3.5 h-3.5 rounded-full bg-white dark:bg-gray-950 border-2 border-indigo-500 absolute -left-[34px] top-1.5 z-10 transition-transform group-hover:scale-125" />

                          <div className="glass rounded-xl p-3 flex items-start justify-between border border-gray-200/40 dark:border-gray-800/40 bg-white/50 hover:bg-white dark:bg-gray-900/50 dark:hover:bg-gray-900 transition-all duration-150">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded-md">
                                  {hourStr}
                                </span>
                                <span
                                  className={classNames(
                                    "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider",
                                    r.priority === "high"
                                      ? "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400"
                                      : r.priority === "medium"
                                      ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
                                      : "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400"
                                  )}
                                >
                                  {r.priority}
                                </span>
                                {r.status === "completed" && (
                                  <span className="bg-green-100 dark:bg-green-950/40 text-green-700 text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                    Done
                                  </span>
                                )}
                              </div>
                              <h4
                                className={classNames(
                                  "text-xs font-bold text-gray-900 dark:text-gray-100 mt-1.5 leading-snug",
                                  r.status === "completed" ? "line-through opacity-60" : ""
                                )}
                              >
                                {r.title}
                              </h4>
                              {r.description && (
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[200px]">
                                  {r.description}
                                </p>
                              )}
                            </div>

                            <button
                              onClick={() => handleQuickComplete(r)}
                              disabled={r.status === "completed"}
                              className={classNames(
                                "w-7 h-7 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer",
                                r.status === "completed"
                                  ? "text-green-500 bg-green-50 dark:bg-green-950/40"
                                  : "text-gray-400 bg-gray-50 dark:bg-gray-900 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200/50 dark:border-gray-800/40 active:scale-90"
                              )}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Add Reminder Action Button */}
      <button
        onClick={() => {
          setEditingReminder(null);
          setIsFormOpen(true);
        }}
        className="fixed bottom-20 right-6 w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full shadow-xl shadow-indigo-500/30 flex items-center justify-center hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 z-40 cursor-pointer"
        aria-label="Add reminder"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* DETAILED BOTTOM SHEET / OVERLAY MODAL FORM */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/40 dark:bg-gray-950/60 backdrop-blur-sm animate-fade-in">
          {/* Backdrop closer click */}
          <div className="absolute inset-0" onClick={() => setIsFormOpen(false)} />

          <div className="glass rounded-t-3xl p-6 w-full max-w-lg shadow-2xl relative z-10 overflow-hidden animate-slide-up border-t border-white/20 dark:border-white/10 max-h-[85vh] overflow-y-auto">
            {/* Ambient glows inside sheets */}
            <div className="absolute top-0 right-0 w-32 h-32 -translate-y-8 translate-x-8 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

            {/* Modal Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-extrabold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                {editingReminder ? "Update Reminder" : "Schedule Reminder"}
              </h2>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="What should I help you remember?"
                  className="w-full h-10 px-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:border-indigo-500 text-gray-900 dark:text-gray-100 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                  Description / Context (optional)
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Add details, links, or context..."
                  rows={2}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:border-indigo-500 text-gray-900 dark:text-gray-100 font-medium resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full h-10 px-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:border-indigo-500 text-gray-900 dark:text-gray-100 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                    Time
                  </label>
                  <input
                    type="time"
                    required
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full h-10 px-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:border-indigo-500 text-gray-900 dark:text-gray-100 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                    Priority Level
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full h-10 px-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none text-gray-900 dark:text-gray-100 font-medium"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority (Urgent)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                    Repeat Cycle
                  </label>
                  <select
                    value={formRepeat}
                    onChange={(e) => setFormRepeat(e.target.value as any)}
                    className="w-full h-10 px-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none text-gray-900 dark:text-gray-100 font-medium"
                  >
                    <option value="none">Does Not Repeat</option>
                    <option value="daily">Every Day</option>
                    <option value="weekly">Every Week</option>
                    <option value="monthly">Every Month</option>
                  </select>
                </div>
              </div>

              {/* Notification toggle */}
              <div className="flex items-center justify-between py-2 border-t border-b border-gray-200/20">
                <div className="space-y-0.5">
                  <label className="text-gray-900 dark:text-gray-100 font-bold block">
                    Trigger Browser Notifications
                  </label>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-normal block">
                    Receive scheduled PWA alerts even when backgrounded
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormNotification(!formNotification)}
                  className={classNames(
                    "w-11 h-6 rounded-full p-0.5 transition-colors focus:outline-none cursor-pointer",
                    formNotification ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-700"
                  )}
                >
                  <div
                    className={classNames(
                      "w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200",
                      formNotification ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="h-12 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-2xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-900 active:scale-95 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-12 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-2xl flex items-center justify-center hover:shadow-lg active:scale-95 transition-all cursor-pointer"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
