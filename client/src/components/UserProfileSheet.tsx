import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";

/* ─────────────────────────────────────────────────────────────────
   Avatar helper (inline so no external dep)
───────────────────────────────────────────────────────────────── */
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
  if (avatarUrl) {
    return (
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
    );
  }
  const hue = (name.charCodeAt(0) * 37 + name.charCodeAt(1) * 17) % 360;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `hsl(${hue}, 60%, 50%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 700,
        fontSize: size * 0.36,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Post grid tile
───────────────────────────────────────────────────────────────── */
function PostTile({
  post,
  onClick,
}: {
  post: {
    id: number;
    caption: string | null;
    thumbnailUrl: string | null;
    mediaType: string | null;
  };
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        aspectRatio: "1",
        overflow: "hidden",
        position: "relative",
        background: "var(--secondary)",
        border: "none",
        padding: 0,
        cursor: "pointer",
        display: "block",
      }}
    >
      {post.thumbnailUrl ? (
        post.mediaType === "video" ? (
          <>
            <video
              src={post.thumbnailUrl}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              muted
              playsInline
              preload="metadata"
            />
            <div
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                background: "rgba(0,0,0,0.55)",
                borderRadius: 4,
                padding: "2px 5px",
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
          </>
        ) : (
          <img
            src={post.thumbnailUrl}
            alt={post.caption ?? ""}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 8,
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: "var(--foreground)",
              textAlign: "center",
              margin: 0,
              lineHeight: 1.3,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 4,
              WebkitBoxOrient: "vertical",
            }}
          >
            {post.caption ?? ""}
          </p>
        </div>
      )}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────
   FollowersFollowingSheet — shown when tapping follower/following counts
───────────────────────────────────────────────────────────────── */
function FollowersFollowingSheet({
  userId,
  mode,
  onClose,
  onViewProfile,
}: {
  userId: number;
  mode: "followers" | "following";
  onClose: () => void;
  onViewProfile: (userId: number, name: string, avatarUrl?: string | null) => void;
}) {
  const { data: users = [], isLoading } = (trpc as any).social[
    mode === "followers" ? "getFollowers" : "getFollowing"
  ].useQuery({ userId }, { staleTime: 30_000 });

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 310,
          backdropFilter: "blur(2px)",
        }}
      />
      {/* Sheet */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 480,
          background: "var(--card)",
          borderRadius: "20px 20px 0 0",
          zIndex: 311,
          maxHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 -4px 32px rgba(0,0,0,0.18)",
        }}
      >
        {/* Handle */}
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: "var(--border)",
            margin: "12px auto 0",
            flexShrink: 0,
          }}
        />
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px 12px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <h3
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: "var(--foreground)",
              margin: 0,
            }}
          >
            {mode === "followers" ? "Followers" : "Following"}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9ca3af",
              fontSize: 22,
              lineHeight: 1,
              padding: 4,
            }}
          >
            ×
          </button>
        </div>
        {/* List */}
        <div style={{ overflowY: "auto", flex: 1, padding: "8px 0" }}>
          {isLoading && (
            <p
              style={{
                textAlign: "center",
                color: "#9ca3af",
                fontSize: 14,
                padding: "24px 0",
              }}
            >
              Loading…
            </p>
          )}
          {!isLoading && users.length === 0 && (
            <p
              style={{
                textAlign: "center",
                color: "#9ca3af",
                fontSize: 14,
                padding: "24px 0",
              }}
            >
              {mode === "followers" ? "No followers yet" : "Not following anyone yet"}
            </p>
          )}
          {users.map(
            (u: { id: number; name: string | null; avatarUrl: string | null }) => (
              <button
                key={u.id}
                onClick={() => {
                  onClose();
                  onViewProfile(u.id, u.name ?? "FlexTab User", u.avatarUrl);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  padding: "10px 20px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <Avatar
                  name={u.name ?? "FlexTab User"}
                  avatarUrl={u.avatarUrl}
                  size={44}
                />
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--foreground)",
                      margin: "0 0 2px",
                    }}
                  >
                    {u.name ?? "FlexTab User"}
                  </p>
                  <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
                    @
                    {(u.name ?? "user")
                      .toLowerCase()
                      .replace(/\s+/g, "")
                      .slice(0, 20)}
                  </p>
                </div>
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9ca3af"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )
          )}
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────
   UserProfileSheet — main component
───────────────────────────────────────────────────────────────── */
export interface UserProfileSheetProps {
  userId: number;
  /** Pre-filled name to show while data loads */
  initialName?: string;
  /** Pre-filled avatar to show while data loads */
  initialAvatarUrl?: string | null;
  currentUser: any;
  onClose: () => void;
  /** If set, open directly to the followers or following list */
  initialListMode?: 'followers' | 'following';
}

export function UserProfileSheet({
  userId,
  initialName,
  initialAvatarUrl,
  currentUser,
  onClose,
  initialListMode,
}: UserProfileSheetProps) {
  const utils = trpc.useUtils();
  const [followingListMode, setFollowingListMode] = useState<
    "followers" | "following" | null
  >(initialListMode ?? null);
  // Nested profile navigation stack
  const [nestedProfile, setNestedProfile] = useState<{
    userId: number;
    name: string;
    avatarUrl?: string | null;
  } | null>(null);

  // Fetch public profile
  const { data: profile } = (trpc as any).user.getPublicProfile.useQuery(
    { userId },
    { staleTime: 60_000 }
  );

  // Fetch relationship
  const { data: rel } = (trpc as any).social.getRelationship.useQuery(
    { userId },
    { staleTime: 30_000, enabled: userId !== currentUser?.id }
  );

  // Fetch user posts
  const { data: postsData = [] } = (trpc as any).community.getUserPosts.useQuery(
    { userId, limit: 30, offset: 0 },
    { staleTime: 30_000 }
  );

  const [following, setFollowing] = useState<boolean | null>(null);
  const serverFollowing: boolean = rel?.following ?? false;
  const effectiveFollowing = following !== null ? following : serverFollowing;

  const followMutation = (trpc as any).social.follow.useMutation({
    onSuccess: () => {
      setFollowing(true);
      utils.social.getRelationship.invalidate({ userId });
      utils.social.getMyStats.invalidate();
    },
  });
  const unfollowMutation = (trpc as any).social.unfollow.useMutation({
    onSuccess: () => {
      setFollowing(false);
      utils.social.getRelationship.invalidate({ userId });
      utils.social.getMyStats.invalidate();
    },
  });

  const toggleFollow = () => {
    if (effectiveFollowing) {
      unfollowMutation.mutate({ userId });
    } else {
      followMutation.mutate({ userId });
    }
  };

  const isMyProfile = currentUser?.id === userId;
  const displayName = profile?.name ?? initialName ?? "FlexTab User";
  const displayAvatar = profile?.avatarUrl ?? initialAvatarUrl;
  const handle =
    "@" + displayName.toLowerCase().replace(/\s+/g, "").slice(0, 20);
  const followerCount: number = rel?.followerCount ?? 0;
  const followingCount: number = rel?.followingCount ?? 0;

  // Prevent body scroll while sheet is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 300,
          backdropFilter: "blur(2px)",
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 480,
          background: "var(--card)",
          borderRadius: "20px 20px 0 0",
          zIndex: 301,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 -4px 32px rgba(0,0,0,0.18)",
        }}
      >
        {/* Handle */}
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: "var(--border)",
            margin: "12px auto 0",
            flexShrink: 0,
          }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 14,
            right: 16,
            background: "var(--secondary)",
            border: "none",
            borderRadius: "50%",
            width: 30,
            height: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#9ca3af",
            fontSize: 18,
            lineHeight: 1,
          }}
        >
          ×
        </button>

        {/* Scrollable content */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {/* Profile header */}
          <div style={{ padding: "20px 20px 16px" }}>
            {/* Avatar + stats row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 14,
              }}
            >
              <Avatar name={displayName} avatarUrl={displayAvatar} size={72} />
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  justifyContent: "space-around",
                }}
              >
                {/* Posts count */}
                <div style={{ textAlign: "center" }}>
                  <p
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: "var(--foreground)",
                      margin: "0 0 2px",
                    }}
                  >
                    {postsData.length}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "#6b7280",
                      margin: 0,
                      fontWeight: 500,
                    }}
                  >
                    Posts
                  </p>
                </div>
                {/* Followers */}
                <button
                  onClick={() => setFollowingListMode("followers")}
                  style={{
                    textAlign: "center",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <p
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: "var(--foreground)",
                      margin: "0 0 2px",
                    }}
                  >
                    {followerCount}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "#6b7280",
                      margin: 0,
                      fontWeight: 500,
                    }}
                  >
                    Followers
                  </p>
                </button>
                {/* Following */}
                <button
                  onClick={() => setFollowingListMode("following")}
                  style={{
                    textAlign: "center",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <p
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: "var(--foreground)",
                      margin: "0 0 2px",
                    }}
                  >
                    {followingCount}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "#6b7280",
                      margin: 0,
                      fontWeight: 500,
                    }}
                  >
                    Following
                  </p>
                </button>
              </div>
            </div>

            {/* Name + handle */}
            <div style={{ marginBottom: 14 }}>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "var(--foreground)",
                  margin: "0 0 2px",
                }}
              >
                {displayName}
              </h3>
              <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
                {handle}
              </p>
            </div>

            {/* Follow / Unfollow button — only for other users */}
            {!isMyProfile && (
              <button
                onClick={toggleFollow}
                disabled={
                  followMutation.isPending || unfollowMutation.isPending
                }
                style={{
                  width: "100%",
                  padding: "10px 0",
                  borderRadius: 50,
                  border: effectiveFollowing
                    ? "1.5px solid var(--border)"
                    : "none",
                  background: effectiveFollowing
                    ? "var(--secondary)"
                    : "var(--foreground)",
                  color: effectiveFollowing
                    ? "var(--foreground)"
                    : "var(--background)",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor:
                    followMutation.isPending || unfollowMutation.isPending
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    followMutation.isPending || unfollowMutation.isPending
                      ? 0.6
                      : 1,
                  transition: "all 0.15s ease",
                }}
              >
                {effectiveFollowing ? "Following" : "Follow"}
              </button>
            )}
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: "var(--border)",
              margin: "0 0 2px",
            }}
          />

          {/* Posts grid */}
          {postsData.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 2,
              }}
            >
              {postsData.map(
                (post: {
                  id: number;
                  caption: string | null;
                  thumbnailUrl: string | null;
                  mediaType: string | null;
                }) => (
                  <PostTile key={post.id} post={post} onClick={() => {}} />
                )
              )}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 24px",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "var(--secondary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9ca3af"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--foreground)",
                  margin: 0,
                }}
              >
                No posts yet
              </p>
            </div>
          )}

          {/* Bottom safe area */}
          <div
            style={{ height: "calc(24px + env(safe-area-inset-bottom))" }}
          />
        </div>
      </div>

      {/* Followers / Following sub-sheet */}
      {followingListMode && (
        <FollowersFollowingSheet
          userId={userId}
          mode={followingListMode}
          onClose={() => setFollowingListMode(null)}
          onViewProfile={(uid, name, avatarUrl) => {
            setNestedProfile({ userId: uid, name, avatarUrl });
          }}
        />
      )}

      {/* Nested profile sheet (when tapping a user in followers/following list) */}
      {nestedProfile && (
        <UserProfileSheet
          userId={nestedProfile.userId}
          initialName={nestedProfile.name}
          initialAvatarUrl={nestedProfile.avatarUrl}
          currentUser={currentUser}
          onClose={() => setNestedProfile(null)}
        />
      )}
    </>
  );
}

export default UserProfileSheet;
