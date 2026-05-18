import { Outlet } from "react-router-dom";
import { Navbar } from "../components/Navbar.tsx";
import { FloatingActionButton } from "../components/FloatingActionButton.tsx";
import { Toast } from "../components/Toast.tsx";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      <Toast />
      <main className="max-w-lg mx-auto px-4 py-6">
        <Outlet />
      </main>
      <Navbar />
      <FloatingActionButton />
    </div>
  );
}
