import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  BookPlus,
  Library,
  Repeat,
  BarChart3,
  User,
  Brain,
} from "lucide-react";
import { ROUTES } from "../utils/constants.ts";
import { classNames } from "../utils/helpers.ts";

const navItems = [
  { icon: Home, label: "Home", path: ROUTES.dashboard },
  { icon: Brain, label: "Memory", path: ROUTES.reminders },
  { icon: BookPlus, label: "Add", path: ROUTES.addWord },
  { icon: Library, label: "Words", path: ROUTES.vocabulary },
  { icon: Repeat, label: "Revise", path: ROUTES.flashcards },
  { icon: BarChart3, label: "Recap", path: ROUTES.weeklyRecap },
  { icon: User, label: "Profile", path: ROUTES.profile },
];

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-gray-200/50 dark:border-gray-700/50 safe-area-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around px-1 py-1">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={classNames(
                "flex flex-col items-center py-1.5 px-1.5 rounded-xl transition-all duration-200 min-w-0",
                active
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              )}
            >
              <item.icon
                className={classNames(
                  "w-5 h-5 transition-transform duration-200",
                  active ? "scale-110" : ""
                )}
              />
              <span className="text-[10px] font-medium mt-0.5 whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
