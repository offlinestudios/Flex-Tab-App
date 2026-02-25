import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  Activity,
  BarChart2,
  BookOpen,
  ChevronUp,
  Dumbbell,
  History,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import { useTheme } from "@/contexts/ThemeContext";

// ─── Sidebar nav items matching prototype ────────────────────────────────────
const sidebarItems = [
  { icon: BookOpen,  label: "Log",          path: "/dashboard" },
  { icon: Activity,  label: "Measurements", path: "/dashboard?tab=measurements" },
  { icon: History,   label: "History",      path: "/dashboard?tab=history" },
  { icon: BarChart2, label: "Trends",       path: "/dashboard?tab=trends" },
  { icon: Dumbbell,  label: "Routines",     path: "/dashboard?tab=routines" },
  { icon: Dumbbell,  label: "Exercises",    path: "/dashboard?tab=exercises" },
];

// ─── Bottom nav items (mobile) ────────────────────────────────────────────────
const bottomNavItems = [
  { icon: BookOpen, label: "Log",       path: "/dashboard" },
  { icon: Users,    label: "Community", path: "/dashboard?tab=community" },
  { icon: Users,    label: "Profile",   path: "/dashboard?tab=profile" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, user } = useAuth();

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4">
            <span className="text-2xl font-bold text-foreground">FlexTab</span>
            <h1 className="text-xl font-semibold tracking-tight text-center text-foreground">
              Sign in to continue
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Access to this dashboard requires authentication.
            </p>
          </div>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            size="lg"
            className="w-full"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}

// ─── Main app shell ───────────────────────────────────────────────────────────
function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileExpanded, setProfileExpanded] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [location]);

  // Prevent body scroll when sidebar open on mobile
  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = sidebarOpen ? "hidden" : "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen, isMobile]);

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const isActive = (path: string) => {
    if (path === "/dashboard" && !location.includes("?tab=")) return true;
    return location === path || location.startsWith(path);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* ── Top header ── */}
      <header className="sticky top-0 z-40 flex items-center justify-between h-14 px-4 bg-card border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <span className="font-bold text-lg text-foreground tracking-tight">FlexTab</span>
        </div>
        {/* Dark mode toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
          )}
        </button>
      </header>

      {/* ── Sidebar overlay ── */}
      {sidebarOpen && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-50 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar drawer ── */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 z-50 bg-card border-r border-border flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-border">
          <span className="font-bold text-lg text-foreground tracking-tight">FlexTab</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Menu label */}
        <div className="px-4 pt-4 pb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Menu</span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Profile section at bottom */}
        <div className="p-3 border-t border-border">
          <button
            onClick={() => setProfileExpanded(!profileExpanded)}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors"
          >
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback className="text-xs font-semibold bg-secondary text-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-foreground truncate">{user?.name || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
            </div>
            <ChevronUp className={`h-4 w-4 text-muted-foreground transition-transform ${profileExpanded ? "" : "rotate-180"}`} />
          </button>

          {profileExpanded && (
            <div className="mt-1 space-y-1">
              <button
                onClick={() => setLocation("/settings")}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Page content ── */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border flex items-center justify-around h-16 pb-safe">
        {bottomNavItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
                active ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
