import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { useEffect, useRef, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { NotificationsTab } from "./NotificationsTab";

// ─── Sidebar nav items matching prototype ────────────────────────────────────
const sidebarItems = [
  {
    label: "Log",
    path: "/dashboard",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><line x1="14" y1="4" x2="21" y2="4"/><line x1="14" y1="9" x2="21" y2="9"/><line x1="14" y1="15" x2="21" y2="15"/><line x1="14" y1="20" x2="21" y2="20"/></svg>,
  },
  {
    label: "Measurements",
    path: "/dashboard?tab=measurements",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h4l3-9 4 18 3-9h4"/></svg>,
  },
  {
    label: "History",
    path: "/dashboard?tab=history",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  },
  {
    label: "Trends",
    path: "/dashboard?tab=trends",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  },
  {
    label: "Routines",
    path: "/dashboard?tab=routines",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  },
  {
    label: "Exercises",
    path: "/dashboard?tab=exercises",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6.5 6.5h11"/><path d="M6.5 17.5h11"/><path d="M3 9.5h2v5H3z"/><path d="M19 9.5h2v5h-2z"/><path d="M5 12h14"/></svg>,
  },
];

// ─── Bottom nav items (mobile) ────────────────────────────────────────────────
const bottomNavItems = [
  {
    label: "Log",
    path: "/dashboard",
    icon: (active: boolean) => (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--foreground)" : "#9ca3af"} strokeWidth="2" strokeLinecap="round">
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
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--foreground)" : "#9ca3af"} strokeWidth="2" strokeLinecap="round">
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
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--foreground)" : "#9ca3af"} strokeWidth="2" strokeLinecap="round">
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
  const [showNotifications, setShowNotifications] = useState(false);

  // Unread notifications badge
  const { data: unreadCount = 0 } = (trpc as any).notifications.unreadCount.useQuery(
    undefined,
    { refetchInterval: 60_000, staleTime: 30_000 }
  );
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

  const search = useSearch();
  const currentTab = new URLSearchParams(search).get('tab') || 'log';

  const isActive = (path: string) => {
    const pathTab = new URLSearchParams(path.split('?')[1] || '').get('tab');
    if (!pathTab) {
      // "Log" item — active only when the current tab is 'log' (no specific tab)
      return currentTab === 'log';
    }
    return currentTab === pathTab;
  };
  const isBottomNavActive = (path: string) => {
    const pathTab = new URLSearchParams(path.split('?')[1] || '').get('tab');
    if (!pathTab) {
      // Log tab — active only when not on community or profile
      return currentTab !== 'community' && currentTab !== 'profile';
    }
    return currentTab === pathTab;
  };

  // Close notifications panel when navigating
  useEffect(() => { setShowNotifications(false); }, [location]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* ── Top header ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'var(--card)', borderBottom: '1px solid var(--border)', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', maxWidth: 700, margin: '0 auto' }}>
          {/* Left: Hamburger + FlexTab wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{ width: 36, height: 36, borderRadius: 10, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              aria-label="Open menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.5px' }}>FlexTab</span>
          </div>
          {/* Right: timer slot + bell + dark mode toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {timerSlot}
            {/* Bell icon with unread badge */}
            <button
              onClick={() => setShowNotifications(s => !s)}
              aria-label="Notifications"
              style={{ position: 'relative', width: 36, height: 36, borderRadius: 10, background: showNotifications ? 'var(--secondary)' : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: 4, right: 4,
                  minWidth: 16, height: 16, borderRadius: 8,
                  background: '#ef4444', color: '#fff',
                  fontSize: 10, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 3px', lineHeight: 1,
                  border: '1.5px solid var(--card)',
                  pointerEvents: 'none',
                }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
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
        {/* Sidebar logo strip — padding mirrors app header exactly so items align */}
        <div style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)', paddingLeft: 16, paddingRight: 16, paddingBottom: 10, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* FlexTab symbol logo - switches between dark and white versions based on theme */}
              <img src={theme === 'dark' ? '/flextab-icon-white.png' : '/flextab-icon.png'} alt="FlexTab" style={{ width: 26, height: 26, objectFit: 'contain', flexShrink: 0 }} />
              <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.4px' }}>FlexTab</span>
            </div>
            {/* Close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
              style={{ width: 36, height: 36, borderRadius: 10, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)', flexShrink: 0 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ padding: '0 8px 16px', flex: 1, overflowY: 'auto' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 12px', marginBottom: 10 }}>Menu</p>
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
                  fontSize: 16, fontWeight: active ? 700 : 500,
                  marginBottom: 2, transition: 'background .15s, color .15s',
                }}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Account footer — height matches bottom nav bar */}
        <div id="sidebar-account-footer" style={{ borderTop: '1px solid var(--border)', paddingLeft: 12, paddingRight: 12, paddingTop: 0, paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 4px)', minHeight: 64, display: 'flex', flexDirection: 'column', justifyContent: 'center', flexShrink: 0, boxSizing: 'border-box' }}>
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

      {/* ── Notifications slide-down panel ── */}
      {showNotifications && (
        <div
          style={{
            position: 'fixed', top: 57, left: 0, right: 0, zIndex: 50,
            background: 'var(--card)',
            borderBottom: '1px solid var(--border)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            maxHeight: 'calc(100dvh - 57px - 64px)',
            overflowY: 'auto',
            animation: 'slideDown 0.2s ease',
          }}
        >
          <style>{`@keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
          <div style={{ maxWidth: 700, margin: '0 auto', padding: '16px 16px 24px' }}>
            <NotificationsTab user={undefined} />
          </div>
        </div>
      )}
      {/* Backdrop to close notifications panel */}
      {showNotifications && (
        <div
          onClick={() => setShowNotifications(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 49, background: 'transparent' }}
        />
      )}

      {/* ── Page content ── */}
      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 80px)' }}>
        {children}
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40, background: 'var(--card)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'stretch', justifyContent: 'space-around', paddingLeft: 'env(safe-area-inset-left, 0px)', paddingRight: 'env(safe-area-inset-right, 0px)', minHeight: 64 }}>
        {bottomNavItems.map((item) => {
          const active = isBottomNavActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, flex: 1, paddingTop: 8, paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 4px)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {item.icon(active)}
              <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? 'var(--foreground)' : '#9ca3af' }}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
