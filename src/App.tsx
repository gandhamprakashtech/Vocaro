import { Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";
import { AuthLayout } from "./layouts/AuthLayout.tsx";
import { AppLayout } from "./layouts/AppLayout.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import AddWord from "./pages/AddWord.tsx";
import Vocabulary from "./pages/Vocabulary.tsx";
import Flashcards from "./pages/Flashcards.tsx";
import WeeklyRecap from "./pages/WeeklyRecap.tsx";
import Profile from "./pages/Profile.tsx";
import { ROUTES } from "./utils/constants.ts";

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.login} element={<Login />} />
          <Route path={ROUTES.signup} element={<Signup />} />
        </Route>

        {/* App Routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path={ROUTES.dashboard} element={<Dashboard />} />
          <Route path={ROUTES.addWord} element={<AddWord />} />
          <Route path={ROUTES.vocabulary} element={<Vocabulary />} />
          <Route path={ROUTES.flashcards} element={<Flashcards />} />
          <Route path={ROUTES.weeklyRecap} element={<WeeklyRecap />} />
          <Route path={ROUTES.profile} element={<Profile />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
