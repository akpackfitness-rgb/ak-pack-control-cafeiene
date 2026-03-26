import { Button } from "@/components/ui/button";
import {
  Activity,
  Bell,
  Dumbbell,
  LayoutDashboard,
  LogIn,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

type Page = "dashboard" | "checkinout" | "attendance" | "members" | "settings";

interface LayoutProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  theme: "dark" | "light";
  onThemeToggle: () => void;
  children: React.ReactNode;
}

const NAV_ITEMS: { id: Page; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "checkinout", label: "Check In / Out", icon: LogIn },
  { id: "attendance", label: "Live Attendance", icon: Activity },
  { id: "members", label: "Members", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Layout({ currentPage, onNavigate, children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#07070f" }}
    >
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col w-60 flex-shrink-0 relative z-20"
        style={{
          background: "#09090e",
          borderRight: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <SidebarContent currentPage={currentPage} onNavigate={onNavigate} />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="md:hidden fixed left-0 top-0 h-full w-64 z-50 flex flex-col"
              style={{
                background: "#09090e",
                borderRight: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                className="flex items-center justify-between p-4"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
              >
                <GymLogo />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                  className="text-white/40 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <SidebarContent
                currentPage={currentPage}
                onNavigate={(p) => {
                  onNavigate(p);
                  setSidebarOpen(false);
                }}
                hideLogo
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* ── GLOW LAYER ─────────────────────────────────────────────── */}
        {/* Large amber/orange orb – top right quadrant */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-10%",
            right: "-5%",
            width: "70%",
            height: "70%",
            background:
              "radial-gradient(ellipse at center, rgba(251,146,60,0.45) 0%, rgba(234,88,12,0.28) 30%, transparent 70%)",
            filter: "blur(60px)",
            zIndex: 0,
          }}
        />
        {/* Purple/violet secondary orb – center right */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "20%",
            right: "5%",
            width: "55%",
            height: "55%",
            background:
              "radial-gradient(ellipse at center, rgba(168,85,247,0.30) 0%, rgba(109,40,217,0.15) 40%, transparent 70%)",
            filter: "blur(80px)",
            zIndex: 0,
          }}
        />
        {/* Subtle blue accent – bottom left */}
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "-5%",
            left: "5%",
            width: "40%",
            height: "40%",
            background:
              "radial-gradient(ellipse at center, rgba(59,130,246,0.18) 0%, transparent 65%)",
            filter: "blur(60px)",
            zIndex: 0,
          }}
        />
        {/* ────────────────────────────────────────────────────────────── */}

        {/* Header */}
        <header
          className="relative flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(9,9,14,0.85)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            zIndex: 10,
          }}
        >
          {/* Mobile hamburger */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-white/50 hover:text-white"
              data-ocid="nav.toggle"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="md:hidden">
              <GymLogo />
            </div>
            {/* Desktop page title */}
            <div className="hidden md:block">
              <span
                className="text-sm font-semibold"
                style={{ color: "rgba(255,255,255,0.75)" }}
              >
                {NAV_ITEMS.find((n) => n.id === currentPage)?.label ??
                  "Dashboard"}
              </span>
            </div>
          </div>

          {/* Right: bell + avatar */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.09)",
              }}
              data-ocid="header.secondary_button"
            >
              <Bell className="h-4 w-4 text-white/60" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-orange-400" />
            </button>
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white"
              style={{
                background: "linear-gradient(135deg, #f97316 0%, #a855f7 100%)",
                border: "1px solid rgba(249,115,22,0.5)",
                boxShadow: "0 0 12px rgba(249,115,22,0.35)",
              }}
            >
              AK
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto relative" style={{ zIndex: 5 }}>
          {children}
        </main>
      </div>
    </div>
  );
}

function GymLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{
          background:
            "linear-gradient(135deg, rgba(249,115,22,0.35) 0%, rgba(168,85,247,0.35) 100%)",
          border: "1px solid rgba(249,115,22,0.4)",
          boxShadow: "0 0 10px rgba(249,115,22,0.2)",
        }}
      >
        <Dumbbell className="h-4 w-4 text-orange-400" />
      </div>
      <div>
        <div className="font-display font-bold text-sm text-white leading-tight">
          AK Pack
        </div>
        <div
          className="text-[10px] leading-tight"
          style={{ color: "rgba(255,255,255,0.38)" }}
        >
          Fitness Control
        </div>
      </div>
    </div>
  );
}

function SidebarContent({
  currentPage,
  onNavigate,
  hideLogo,
}: {
  currentPage: Page;
  onNavigate: (p: Page) => void;
  hideLogo?: boolean;
}) {
  return (
    <div className="flex flex-col h-full">
      {!hideLogo && (
        <div
          className="p-5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <GymLogo />
        </div>
      )}

      <nav className="flex-1 px-3 py-5 space-y-1" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => onNavigate(item.id)}
              data-ocid={`nav.${item.id}.link`}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                background: isActive
                  ? "linear-gradient(135deg, rgba(249,115,22,0.75) 0%, rgba(168,85,247,0.65) 100%)"
                  : "transparent",
                color: isActive ? "#fff" : "rgba(255,255,255,0.42)",
                boxShadow: isActive
                  ? "0 4px 16px rgba(249,115,22,0.35), 0 1px 4px rgba(0,0,0,0.4)"
                  : "none",
                border: isActive
                  ? "1px solid rgba(249,115,22,0.4)"
                  : "1px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(255,255,255,0.06)";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "rgba(255,255,255,0.85)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "rgba(255,255,255,0.42)";
                }
              }}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div
        className="p-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div
          className="text-[11px] text-center"
          style={{ color: "rgba(255,255,255,0.22)" }}
        >
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-70 transition-opacity"
          >
            caffeine.ai
          </a>
        </div>
      </div>
    </div>
  );
}
