import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Flame,
  TrendingUp,
  Target,
  Sparkles,
  ArrowRight,
  Brain,
  Send,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext.tsx";
import { useVocabulary } from "../hooks/useVocabulary.ts";
import { useReminders } from "../hooks/useReminders.ts";
import { parseNaturalLanguage } from "../utils/nlpParser.ts";
import { showToast } from "../components/Toast.tsx";
import { ROUTES } from "../utils/constants.ts";
import { getGreeting } from "../utils/helpers.ts";
import { StatCard } from "../components/StatCard.tsx";


export default function Dashboard() {
  const { user, profile } = useAuth();
  const { words, loading } = useVocabulary(user);
  const { reminders, addReminder } = useReminders(user);
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState(getGreeting);
  const [quickReminderText, setQuickReminderText] = useState("");

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  const todayWords = (words || []).filter((w) => {
    const today = new Date().toDateString();
    return new Date(w.created_at).toDateString() === today;
  });

  const weakWords = words.filter((w) => w.memory_strength === "weak");
  const recentWords = words.slice(0, 5);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayPendingCount = reminders.filter(
    (r) => r.reminder_date === todayStr && (r.status === "pending" || r.status === "snoozed")
  ).length;

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickReminderText.trim()) return;

    const parsed = parseNaturalLanguage(quickReminderText);
    const { error: err } = await addReminder({
      title: parsed.title,
      description: "Created from dashboard quick add",
      priority: parsed.priority,
      reminder_date: parsed.date,
      reminder_time: parsed.time,
      notification_enabled: true,
      repeat_type: "none",
    });

    if (err) {
      showToast(`Failed to add reminder: ${err}`, "error");
    } else {
      showToast(`Added: "${parsed.title}" scheduled for ${parsed.date} at ${parsed.time}`, "success");
      setQuickReminderText("");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-4">
      {/* Greeting */}
      <div className="glass rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 -translate-y-8 translate-x-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 opacity-10" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {greeting}
            </p>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">
              {profile?.display_name || user?.email?.split("@")[0] || "Learner"}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {profile?.email || user?.email}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/20">
            {(profile?.display_name || user?.email || "U").charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={BookOpen}
          label="Total Words"
          value={words.length}
          gradient="primary"
        />
        <StatCard
          icon={Sparkles}
          label="Today"
          value={todayWords.length}
          sublabel="words added"
          gradient="cool"
        />
        <StatCard
          icon={Target}
          label="Need Review"
          value={weakWords.length}
          sublabel="weak words"
          gradient="warm"
        />
        <StatCard
          icon={Flame}
          label="Streak"
          value={calculateStreak(words)}
          sublabel="days"
          gradient="primary"
        />
      </div>

      {/* Memory Assistance Home Widget */}
      <div className="glass rounded-2xl p-5 relative overflow-hidden animate-slide-up border border-white/10 dark:border-white/5">
        <div className="absolute top-0 right-0 w-32 h-32 -translate-y-8 translate-x-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 opacity-10 blur-xl pointer-events-none" />
        
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Brain className="w-4.5 h-4.5" />
            </div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              Memory Companion
            </h2>
          </div>
          <button
            onClick={() => navigate(ROUTES.reminders || "/reminders")}
            className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-0.5"
          >
            Open Companion <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Dynamic Summary Block */}
        <div className="mb-4 bg-gray-100/50 dark:bg-gray-900/35 rounded-xl p-3 border border-gray-200/10 relative z-10">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {todayPendingCount > 0 ? (
              <span>You have <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{todayPendingCount} reminder{todayPendingCount > 1 ? "s" : ""}</strong> due today.</span>
            ) : (
              <span>Your mind is completely free right now! ✨</span>
            )}
          </p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 italic">
            {todayPendingCount > 0 
              ? "“Take things one step at a time. I am holding your tasks securely.”"
              : "“All organized. Let's learn some new words!”"}
          </p>
        </div>

        {/* Micro Quick Add Form */}
        <form onSubmit={handleQuickAdd} className="flex gap-2 relative z-10">
          <div className="relative flex-1">
            <input
              type="text"
              value={quickReminderText}
              onChange={(e) => setQuickReminderText(e.target.value)}
              placeholder="e.g. Call Krishna sir at 6 PM..."
              className="w-full h-10 px-3 pr-10 text-xs bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 text-gray-950 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 font-medium"
            />
            {quickReminderText && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded animate-fade-in">
                {parseNaturalLanguage(quickReminderText).time}
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={!quickReminderText.trim()}
            className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:hover:shadow-none disabled:active:scale-100 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Today's Word Card */}
      {todayWords.length > 0 && (
        <div className="glass rounded-2xl p-5 animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Today's Word
            </h2>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {todayWords[0].word}
          </p>
          <p className="text-lg text-indigo-600 dark:text-indigo-400 font-medium mt-1">
            {todayWords[0].telugu_meaning}
          </p>
          {todayWords[0].example_sentence && (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-2">
              “{todayWords[0].example_sentence}”
            </p>
          )}
        </div>
      )}

      {/* Recent Words */}
      {recentWords.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Recent Words
            </h2>
            <button
              onClick={() => navigate(ROUTES.vocabulary)}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1 hover:underline"
            >
              See all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {recentWords.map((word) => (
              <div
                key={word.id}
                className="glass rounded-xl p-3 flex items-center justify-between animate-scale-in"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {word.word}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {word.telugu_meaning}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    word.memory_strength === "strong"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      : word.memory_strength === "medium"
                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                      : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                  }`}
                >
                  {word.memory_strength}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate(ROUTES.addWord)}
          className="glass rounded-2xl p-4 text-left hover:shadow-md transition-all duration-200 active:scale-[0.98] group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Add Word
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Learn something new
          </p>
        </button>
        <button
          onClick={() => navigate(ROUTES.flashcards)}
          className="glass rounded-2xl p-4 text-left hover:shadow-md transition-all duration-200 active:scale-[0.98] group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Revise
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {weakWords.length} words need review
          </p>
        </button>
      </div>
    </div>
  );
}

function calculateStreak(words: { created_at: string }[]): number {
  if (words.length === 0) return 0;
  const dates = [
    ...new Set(
      words.map((w) => new Date(w.created_at).toDateString())
    ),
  ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let streak = 1;
  const today = new Date().toDateString();
  if (dates[0] !== today && getYesterday() !== dates[0]) return 0;

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toDateString();
}
