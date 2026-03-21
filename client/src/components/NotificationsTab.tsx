import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { UserProfileSheet } from "./UserProfileSheet";

/* ─────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────── */
function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

function Avatar({
  name,
  avatarUrl,
  size = 40,
}: {
  name: string;
  avatarUrl?: string | null;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return avatarUrl ? (
    <img
      src={avatarUrl}
      alt={name}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        objectFit: "cover",
        flexShrink: 0,
      }}
    />
  ) : (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--secondary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.36,
        fontWeight: 700,
        color: "var(--foreground)",
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Notification type icon
───────────────────────────────────────────────────────────────── */
function TypeIcon({ type }: { type: string }) {
  if (type === "follow") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <line x1="19" y1="8" x2="19" y2="14"/>
        <line x1="22" y1="11" x2="16" y2="11"/>
      </svg>
    );
  }
  if (type === "like") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    );
  }
  // comment
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Notification row
───────────────────────────────────────────────────────────────── */
function NotificationRow({
  notif,
  currentUser,
  onMarkRead,
  onViewProfile,
}: {
  notif: {
    id: number;
    type: string;
    entityId: number | null;
    read: boolean;
    createdAt: Date | string;
    actorId: number;
    actorName: string | null;
    actorAvatarUrl: string | null;
  };
  currentUser: any;
  onMarkRead: (id: number) => void;
  onViewProfile: (userId: number, name: string, avatarUrl?: string | null) => void;
}) {
  const actorName = notif.actorName ?? "Someone";

  const body =
    notif.type === "follow"
      ? "started following you"
      : notif.type === "like"
      ? "liked your post"
      : "commented on your post";

  return (
    <div
      onClick={() => {
        if (!notif.read) onMarkRead(notif.id);
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        background: notif.read ? "transparent" : "var(--secondary)",
        borderBottom: "1px solid var(--border)",
        cursor: "default",
        transition: "background 0.2s",
      }}
    >
      {/* Tappable actor avatar */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onViewProfile(notif.actorId, actorName, notif.actorAvatarUrl);
        }}
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", position: "relative", flexShrink: 0 }}
      >
        <Avatar name={actorName} avatarUrl={notif.actorAvatarUrl} size={44} />
        {/* Type badge */}
        <div
          style={{
            position: "absolute",
            bottom: -2,
            right: -2,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "var(--card)",
            border: "1.5px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <TypeIcon type={notif.type} />
        </div>
      </button>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, color: "var(--foreground)", margin: "0 0 2px", lineHeight: 1.4 }}>
          <strong>{actorName}</strong> {body}
        </p>
        <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>{timeAgo(notif.createdAt)}</p>
      </div>

      {/* Unread dot */}
      {!notif.read && (
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#3b82f6",
            flexShrink: 0,
          }}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Main NotificationsTab
───────────────────────────────────────────────────────────────── */
export function NotificationsTab({ user }: { user: any }) {
  const utils = trpc.useUtils();
  const [viewingUserId, setViewingUserId] = useState<{
    id: number;
    name: string;
    avatarUrl?: string | null;
  } | null>(null);

  const { data: notifs = [], isLoading } = (trpc as any).notifications.list.useQuery(
    { limit: 30, offset: 0 },
    { refetchOnWindowFocus: true, staleTime: 15_000 }
  );

  const markRead = (trpc as any).notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      (utils as any).notifications.unreadCount.invalidate();
    },
  });

  const markAllRead = (trpc as any).notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      (utils as any).notifications.unreadCount.invalidate();
    },
  });

  const unreadCount = notifs.filter((n: any) => !n.read).length;

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 0 12px",
        }}
      >
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--foreground)", margin: 0 }}>
            Notifications
          </h2>
          {unreadCount > 0 && (
            <p style={{ fontSize: 13, color: "#9ca3af", margin: "2px 0 0" }}>
              {unreadCount} unread
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#3b82f6",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "6px 0",
              opacity: markAllRead.isPending ? 0.6 : 1,
            }}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div
        style={{
          background: "var(--card)",
          borderRadius: 20,
          border: "1.5px solid var(--border)",
          overflow: "hidden",
        }}
      >
        {isLoading && (
          <div style={{ padding: "40px 24px", textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>Loading…</p>
          </div>
        )}

        {!isLoading && notifs.length === 0 && (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "var(--secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)", margin: "0 0 6px" }}>
              No notifications yet
            </p>
            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
              When someone follows you, likes, or comments on your posts, you'll see it here.
            </p>
          </div>
        )}

        {notifs.map((notif: any) => (
          <NotificationRow
            key={notif.id}
            notif={notif}
            currentUser={user}
            onMarkRead={(id) => markRead.mutate({ id })}
            onViewProfile={(userId, name, avatarUrl) =>
              setViewingUserId({ id: userId, name, avatarUrl })
            }
          />
        ))}
      </div>

      {/* User profile sheet */}
      {viewingUserId && (
        <UserProfileSheet
          userId={viewingUserId.id}
          initialName={viewingUserId.name}
          initialAvatarUrl={viewingUserId.avatarUrl}
          currentUser={user}
          onClose={() => setViewingUserId(null)}
        />
      )}
    </div>
  );
}

export default NotificationsTab;
