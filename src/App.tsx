import {
  Suspense,
  lazy,
  type ComponentType,
  type LazyExoticComponent,
} from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";
import { AuthLayout } from "./layouts/AuthLayout.tsx";
import { AppLayout } from "./layouts/AppLayout.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import AddWord from "./pages/AddWord.tsx";
import { RouteBoundary } from "./components/RouteBoundary.tsx";
import { RouteLoader } from "./components/RouteLoader.tsx";
import { ROUTES } from "./utils/constants.ts";

const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Vocabulary = lazy(() => import("./pages/Vocabulary.tsx"));
const Flashcards = lazy(() => import("./pages/Flashcards.tsx"));
const WeeklyRecap = lazy(() => import("./pages/WeeklyRecap.tsx"));
const Profile = lazy(() => import("./pages/Profile.tsx"));
const Reminders = lazy(() => import("./pages/Reminders.tsx"));

function lazyElement(Element: LazyExoticComponent<ComponentType>) {
  return (
    <RouteBoundary>
      <Suspense fallback={<RouteLoader />}>
        <Element />
      </Suspense>
    </RouteBoundary>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route
            path={ROUTES.login}
            element={
              <RouteBoundary>
                <Login />
              </RouteBoundary>
            }
          />
          <Route
            path={ROUTES.signup}
            element={
              <RouteBoundary>
                <Signup />
              </RouteBoundary>
            }
          />
        </Route>

        {/* App Routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path={ROUTES.dashboard} element={lazyElement(Dashboard)} />
          <Route
            path="/dashboard"
            element={<Navigate to={ROUTES.dashboard} replace />}
          />
          <Route
            path={ROUTES.addWord}
            element={
              <RouteBoundary>
                <AddWord />
              </RouteBoundary>
            }
          />
          <Route path={ROUTES.vocabulary} element={lazyElement(Vocabulary)} />
          <Route path={ROUTES.flashcards} element={lazyElement(Flashcards)} />
          <Route path={ROUTES.weeklyRecap} element={lazyElement(WeeklyRecap)} />
          <Route path={ROUTES.profile} element={lazyElement(Profile)} />
          <Route path={ROUTES.reminders} element={lazyElement(Reminders)} />
        </Route>

        <Route path="*" element={<Navigate to={ROUTES.dashboard} replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
