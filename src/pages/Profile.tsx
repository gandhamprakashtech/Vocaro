import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Moon,
  Sun,
  Bell,
  BellOff,
  LogOut,
  FileJson,
  FileText,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext.tsx";
import { useTheme } from "../contexts/ThemeContext.tsx";
import { useVocabulary } from "../hooks/useVocabulary.ts";
import { useNotifications } from "../hooks/useNotifications.ts";
import { exportAsJSON, exportAsPDF } from "../services/export.ts";
import { ROUTES } from "../utils/constants.ts";

import { showToast } from "../components/Toast.tsx";

export default function Profile() {
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const { dark, toggle } = useTheme();
  const { words, loading: wordsLoading } = useVocabulary(user);
  const { permission, requestPermission, scheduleDailyReminder } =
    useNotifications();
  const navigate = useNavigate();
  const [notifEnabled, setNotifEnabled] = useState(
    permission === "granted"
  );

  const handleNotificationToggle = async () => {
    if (notifEnabled) {
      setNotifEnabled(false);
    } else {
      const granted = await requestPermission();
      if (granted) {
        setNotifEnabled(true);
        scheduleDailyReminder();
        showToast("Notifications enabled!", "success");
      } else {
        showToast(
          "Please allow notifications in your browser settings",
          "warning"
        );
      }
    }
  };

  const handleExport = (format: "json" | "pdf") => {
    if (words.length === 0) {
      showToast("No words to export", "warning");
      return;
    }
    if (format === "json") exportAsJSON(words);
    else exportAsPDF(words);
    showToast(`Exported as ${format.toUpperCase()}`, "success");
  };

  const handleLogout = async () => {
    await signOut();
    navigate(ROUTES.login, { replace: true });
  };

  if (authLoading || wordsLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(ROUTES.dashboard)}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Settings
        </h1>
      </div>

      {/* Profile Card */}
      <div className="glass rounded-2xl p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/20">
          {(profile?.display_name || user?.email || "U").charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {profile?.display_name || user?.email?.split("@")[0] || "Learner"}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {profile?.email || user?.email}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="glass rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Vocabulary Stats
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {words.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {words.filter((w) => w.memory_strength === "strong").length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Strong</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {words.filter((w) => w.memory_strength === "weak").length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Weak</p>
          </div>
        </div>
      </div>

      {/* Settings List */}
      <div className="glass rounded-2xl overflow-hidden">
        {/* Dark Mode */}
        <button
          onClick={toggle}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            {dark ? (
              <Sun className="w-5 h-5 text-amber-500" />
            ) : (
              <Moon className="w-5 h-5 text-indigo-500" />
            )}
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Dark Mode
            </span>
          </div>
          <div
            className={`w-11 h-6 rounded-full transition-colors ${
              dark ? "bg-indigo-600" : "bg-gray-200"
            } relative`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-transform ${
                dark ? "translate-x-5.5" : "translate-x-0.5"
              }`}
            />
          </div>
        </button>

        <div className="h-px bg-gray-100 dark:bg-gray-800 mx-5" />

        {/* Notifications */}
        <button
          onClick={handleNotificationToggle}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            {notifEnabled ? (
              <Bell className="w-5 h-5 text-indigo-500" />
            ) : (
              <BellOff className="w-5 h-5 text-gray-400" />
            )}
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Notifications
            </span>
          </div>
          <div
            className={`w-11 h-6 rounded-full transition-colors ${
              notifEnabled ? "bg-indigo-600" : "bg-gray-200"
            } relative`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-transform ${
                notifEnabled ? "translate-x-5.5" : "translate-x-0.5"
              }`}
            />
          </div>
        </button>
      </div>

      {/* Export */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Export Data
          </h2>
        </div>
        <button
          onClick={() => handleExport("json")}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileJson className="w-5 h-5 text-indigo-500" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 text-left">
              Export as JSON
              <span className="block text-xs text-gray-400 font-normal">
                Machine-readable format
              </span>
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>
        <div className="h-px bg-gray-100 dark:bg-gray-800 mx-5" />
        <button
          onClick={() => handleExport("pdf")}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 text-left">
              Export as PDF
              <span className="block text-xs text-gray-400 font-normal">
                Printable document
              </span>
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-4 rounded-2xl glass text-red-600 dark:text-red-400 font-medium text-sm hover:shadow-md hover:bg-red-50 dark:hover:bg-red-900/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
    </div>
  );
}
