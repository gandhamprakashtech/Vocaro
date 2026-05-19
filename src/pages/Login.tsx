import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.tsx";
import { ROUTES } from "../utils/constants.ts";
import { showToast } from "../components/Toast.tsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = (() => {
    const state = location.state as
      | { from?: { pathname?: string } | string }
      | null;
    if (!state?.from) return ROUTES.dashboard;
    return typeof state.from === "string"
      ? state.from
      : state.from.pathname || ROUTES.dashboard;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const err = await signIn(email, password);
    setLoading(false);
    if (err) {
      showToast(err, "error");
    } else {
      navigate(redirectTo, { replace: true });
    }
  };

  return (
    <div className="w-full max-w-sm animate-slide-up">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="glass rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 text-center">
            Welcome back
          </h2>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 dark:focus:border-indigo-400 outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full pl-10 pr-12 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 dark:focus:border-indigo-400 outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Sign In
          </button>
        </div>

        <div className="relative flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          <span className="text-xs text-gray-400 dark:text-gray-500">or</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>

        <button
          type="button"
          onClick={signInWithGoogle}
          className="w-full py-3 rounded-xl glass text-gray-700 dark:text-gray-300 font-medium text-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Don&apos;t have an account?{" "}
          <Link
            to={ROUTES.signup}
            className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
          >
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
