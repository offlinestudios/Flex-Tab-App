import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import { useTheme } from "@/contexts/ThemeContext";

// ─── Sidebar nav items matching prototype ────────────────────────────────────
const sidebarItems = [
  {
    label: "Log",
    path: "/dashboard",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><line x1="14" y1="4" x2="21" y2="4"/><line x1="14" y1="9" x2="21" y2="9"/><line x1="14" y1="15" x2="21" y2="15"/><line x1="14" y1="20" x2="21" y2="20"/></svg>,
  },
  {
    label: "Measurements",
    path: "/dashboard?tab=measurements",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h4l3-9 4 18 3-9h4"/></svg>,
  },
  {
    label: "History",
    path: "/dashboard?tab=history",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  },
  {
    label: "Trends",
    path: "/dashboard?tab=trends",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  },
  {
    label: "Routines",
    path: "/dashboard?tab=routines",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  },
  {
    label: "Exercises",
    path: "/dashboard?tab=exercises",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6.5 6.5h11"/><path d="M6.5 17.5h11"/><path d="M3 9.5h2v5H3z"/><path d="M19 9.5h2v5h-2z"/><path d="M5 12h14"/></svg>,
  },
];

// ─── Bottom nav items (mobile) ────────────────────────────────────────────────
const bottomNavItems = [
  {
    label: "Log",
    path: "/dashboard",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--foreground)" : "#9ca3af"} strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
        <line x1="14" y1="4" x2="21" y2="4"/><line x1="14" y1="9" x2="21" y2="9"/>
        <line x1="14" y1="15" x2="21" y2="15"/><line x1="14" y1="20" x2="21" y2="20"/>
      </svg>
    ),
  },
  {
    label: "Community",
    path: "/dashboard?tab=community",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--foreground)" : "#9ca3af"} strokeWidth="2" strokeLinecap="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    label: "Profile",
    path: "/dashboard?tab=profile",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--foreground)" : "#9ca3af"} strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    ),
  },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  timerSlot?: React.ReactNode;
}

export default function DashboardLayout({ children, timerSlot }: DashboardLayoutProps) {
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

  return <AppShell timerSlot={timerSlot}>{children}</AppShell>;
}

// ─── Main app shell ───────────────────────────────────────────────────────────
function AppShell({ children, timerSlot }: { children: React.ReactNode; timerSlot?: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
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
    : "FT";

  const isActive = (path: string) => {
    if (path === "/dashboard" && !location.includes("?tab=")) return true;
    return location === path || location.startsWith(path);
  };

  const isBottomNavActive = (path: string) => {
    if (path === "/dashboard") {
      const tab = new URLSearchParams(location.split('?')[1] || '').get('tab');
      return !tab || tab === 'log' || tab === 'measurements' || tab === 'history' || tab === 'trends' || tab === 'routines' || tab === 'exercises';
    }
    return location === path || location.startsWith(path);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* ── Top header ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', maxWidth: 700, margin: '0 auto' }}>
          {/* Left: Hamburger + FlexTab wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{ width: 36, height: 36, borderRadius: 10, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              aria-label="Open menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.5px' }}>FlexTab</span>
          </div>
          {/* Right: timer slot + dark mode toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {timerSlot}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              style={{ width: 36, height: 36, borderRadius: 10, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)' }}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Sidebar overlay ── */}
      {sidebarOpen && (
        <div
          ref={overlayRef}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar drawer ── */}
      <aside
        style={{
          position: 'fixed', top: 0, left: 0, width: 280, height: '100dvh',
          background: 'var(--card)', zIndex: 60, boxShadow: '4px 0 24px rgba(0,0,0,0.12)',
          display: 'flex', flexDirection: 'column', overflowY: 'hidden',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(.4,0,.2,1)',
        }}
      >
        {/* Sidebar logo strip */}
        <div style={{ padding: '20px 20px 16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* FlexTab symbol logo - icon image has its own dark rounded square built in */}
            <img src="/flextab-icon.png" alt="FlexTab" style={{ width: 44, height: 44, objectFit: 'contain', flexShrink: 0 }} />
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.4px' }}>FlexTab</span>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ padding: '0 8px 16px', flex: 1, overflowY: 'auto' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 12px', marginBottom: 10 }}>Menu</p>
          <div style={{ height: 1, background: 'var(--border)', margin: '0 4px 10px' }} />
          {sidebarItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                  padding: '10px 12px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: active ? 'var(--secondary)' : 'transparent',
                  color: active ? 'var(--foreground)' : '#6b7280',
                  fontSize: 14, fontWeight: active ? 700 : 500,
                  marginBottom: 2, transition: 'background .15s, color .15s',
                }}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Account footer */}
        <div id="sidebar-account-footer" style={{ borderTop: '1px solid var(--border)', padding: 12, flexShrink: 0 }}>
          <div
            id="sidebar-profile-toggle"
            onClick={() => setAccountMenuOpen(!accountMenuOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, borderRadius: 14, cursor: 'pointer', transition: 'background .15s' }}
          >
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'var(--background)', flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)', margin: '0 0 1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'User'}</p>
              <p style={{ fontSize: 11, color: '#9ca3af', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email || ''}</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, transition: 'transform .2s', transform: accountMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}><polyline points="6 9 12 15 18 9"/></svg>
          </div>

          {accountMenuOpen && (
            <div id="account-menu">
              <div style={{ height: 1, background: 'var(--border)', margin: '8px 8px' }} />
              <button
                onClick={() => setLocation('/dashboard?tab=settings')}
                style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 12px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'transparent', color: '#6b7280', fontSize: 14, fontWeight: 500 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                Settings
              </button>
              <button
                onClick={logout}
                style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 12px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'transparent', color: '#ef4444', fontSize: 14, fontWeight: 500 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
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
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40, background: 'var(--card)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: 64 }}>
        {bottomNavItems.map((item) => {
          const active = isBottomNavActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {item.icon(active)}
              <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? 'var(--foreground)' : '#9ca3af' }}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
