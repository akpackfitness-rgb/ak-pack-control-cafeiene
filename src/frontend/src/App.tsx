import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Layout } from "./components/Layout";
import { CheckInOutPage } from "./pages/CheckInOut";
import { DashboardPage } from "./pages/Dashboard";
import { LiveAttendancePage } from "./pages/LiveAttendance";
import { MembersPage } from "./pages/Members";
import { SettingsPage } from "./pages/Settings";

type Page = "dashboard" | "checkinout" | "attendance" | "members" | "settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: 1000,
    },
  },
});

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Support ?view=live or #live for TV display mode
  const [isLiveView, setIsLiveView] = useState(
    window.location.hash === "#live" ||
      new URLSearchParams(window.location.search).get("view") === "live",
  );

  useEffect(() => {
    const handler = () => {
      setIsLiveView(window.location.hash === "#live");
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.remove("light");
    } else {
      root.classList.add("light");
    }
  }, [theme]);

  // Set dark mode meta
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", theme === "dark" ? "#0d1a2e" : "#ebeff5");
    }
    document.title = "AK Pack Control System";
  }, [theme]);

  function renderPage() {
    switch (page) {
      case "dashboard":
        return <DashboardPage />;
      case "checkinout":
        return <CheckInOutPage />;
      case "attendance":
        return <LiveAttendancePage />;
      case "members":
        return <MembersPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  }

  if (isLiveView) {
    return (
      <QueryClientProvider client={queryClient}>
        <div style={{ background: "#0d1a2e", minHeight: "100vh" }}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-white font-bold text-xl">
                AK Pack Fitness — Live Attendance
              </h1>
              <button
                type="button"
                onClick={() => {
                  window.location.hash = "";
                  setIsLiveView(false);
                }}
                className="text-white/40 hover:text-white text-sm"
              >
                ✕ Exit Live View
              </button>
            </div>
            <LiveAttendancePage />
          </div>
        </div>
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Layout
        currentPage={page}
        onNavigate={setPage}
        theme={theme}
        onThemeToggle={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      >
        {renderPage()}
      </Layout>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
