import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  TrendingUp,
  BookOpen,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext.tsx";
import { useVocabulary } from "../hooks/useVocabulary.ts";
import { useWeeklyRecap } from "../hooks/useWeeklyRecap.ts";
import { ROUTES } from "../utils/constants.ts";
import { StatCard } from "../components/StatCard.tsx";
import { EmptyState } from "../components/EmptyState.tsx";

export default function WeeklyRecap() {
  const { user } = useAuth();
  const { words, loading } = useVocabulary(user);
  const recap = useWeeklyRecap(words);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (recap.totalWords === 0) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(ROUTES.dashboard)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Weekly Recap
          </h1>
        </div>
        <EmptyState
          title="No data yet"
          description="Add words throughout the week to see your recap"
        />
      </div>
    );
  }

  const total =
    recap.strongCount + recap.mediumCount + recap.weakCount || 1;
  const strongPct = Math.round((recap.strongCount / total) * 100);
  const mediumPct = Math.round((recap.mediumCount / total) * 100);
  const weakPct = Math.round((recap.weakCount / total) * 100);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(ROUTES.dashboard)}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Weekly Recap
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Your learning progress this week
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={TrendingUp}
          label="This Week"
          value={recap.wordsThisWeek}
          sublabel="words added"
          gradient="primary"
        />
        <StatCard
          icon={BookOpen}
          label="Total"
          value={recap.totalWords}
          gradient="cool"
        />
        <StatCard
          icon={CheckCircle2}
          label="Strong"
          value={recap.strongCount}
          gradient="primary"
        />
        <StatCard
          icon={AlertTriangle}
          label="Weak"
          value={recap.weakCount}
          gradient="warm"
        />
      </div>

      {/* Memory Distribution */}
      <div className="glass rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-indigo-500" />
          Memory Distribution
        </h2>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-green-600 dark:text-green-400">
                Strong
              </span>
              <span className="text-gray-500">{strongPct}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
                style={{ width: `${strongPct}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-amber-600 dark:text-amber-400">
                Medium
              </span>
              <span className="text-gray-500">{mediumPct}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
                style={{ width: `${mediumPct}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-red-600 dark:text-red-400">
                Weak
              </span>
              <span className="text-gray-500">{weakPct}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500"
                style={{ width: `${weakPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Most Revised */}
      {recap.mostRevised.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-500" />
            Most Revised
          </h2>
          <div className="space-y-2">
            {recap.mostRevised.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {w.word}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {w.telugu_meaning}
                  </p>
                </div>
                <span className="text-xs text-gray-400">
                  {w.revision_count}x
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Difficult Words */}
      {recap.difficultWords.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Needs Attention ({recap.difficultWords.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {recap.difficultWords.slice(0, 10).map((w) => (
              <span
                key={w.id}
                className="px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium"
              >
                {w.word}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
