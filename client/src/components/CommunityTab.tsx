import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

/* ─────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────── */
interface MediaItem {
  id: number;
  r2Key: string;
  mediaType: string;
  mimeType: string;
  url: string;
}

interface WorkoutSummary {
  exercises: string[];
  totalSets: number;
  totalReps: number;
  totalVolume: number;
}

interface FeedPost {
  id: number;
  userId: number;
  authorName: string;
  authorHandle: string;
  authorAvatarUrl?: string | null;
  caption: string | null;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  isMyPost?: boolean;
  media: MediaItem[];
  workout: WorkoutSummary | null;
}

interface Comment {
  id: number;
  postId: number;
  userId: number;
  body: string;
  createdAt: string;
  authorName: string;
  authorHandle: string;
  authorAvatarUrl?: string | null;
}

/* ─────────────────────────────────────────────────────────────────
   Sample posts shown when the real feed is empty (display reference)
───────────────────────────────────────────────────────────────── */
const SAMPLE_POSTS: FeedPost[] = [
  {
    id: -1,
    userId: -1,
    authorName: "Marcus Reid",
    authorHandle: "@marcusreid",
    caption: "Hit a new deadlift PR today. Consistency is everything.",
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    likeCount: 47,
    commentCount: 2,
    likedByMe: false,
    media: [],
    workout: {
      exercises: ["Deadlift", "Romanian Deadlift", "Leg Press"],
      totalSets: 10,
      totalReps: 84,
      totalVolume: 14200,
    },
  },
  {
    id: -2,
    userId: -2,
    authorName: "Sofia Lim",
    authorHandle: "@sofialim",
    caption: "225 lbs bench press — finally hit it after 3 months of grinding.",
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    likeCount: 24,
    commentCount: 3,
    likedByMe: false,
    media: [],
    workout: {
      exercises: ["Bench Press", "Incline DB Press", "Cable Fly"],
      totalSets: 12,
      totalReps: 96,
      totalVolume: 11200,
    },
  },
  {
    id: -3,
    userId: -3,
    authorName: "Jordan Kim",
    authorHandle: "@jordankim",
    caption: "Leg day done. Squats feeling strong this week.",
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    likeCount: 18,
    commentCount: 5,
    likedByMe: true,
    media: [],
    workout: {
      exercises: ["Squat", "Romanian Deadlift", "Leg Press"],
      totalSets: 10,
      totalReps: 80,
      totalVolume: 18200,
    },
  },
];

/* ─────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────── */
function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function fmtVolume(v: number): string {
  return v >= 1000 ? `${(v / 1000).toFixed(1)}k lbs` : `${v} lbs`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* ─────────────────────────────────────────────────────────────────
   Avatar
───────────────────────────────────────────────────────────────── */
function Avatar({ name, avatarUrl, size = 40 }: { name: string; avatarUrl?: string | null; size?: number }) {
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
        onError={(e) => {
          // Fall back to initials on broken image
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--foreground)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontSize: size * 0.34,
          fontWeight: 700,
          color: "var(--background)",
          letterSpacing: "-0.02em",
        }}
      >
        {getInitials(name)}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Workout log block
───────────────────────────────────────────────────────────────── */
function WorkoutLogBlock({ workout }: { workout: WorkoutSummary }) {
  return (
    <div
      style={{
        margin: "0 16px 12px",
        background: "var(--secondary)",
        borderRadius: 14,
        padding: "12px 14px",
        border: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 8,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: "var(--foreground)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--background)"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <line x1="14" y1="4" x2="21" y2="4" />
            <line x1="14" y1="9" x2="21" y2="9" />
            <line x1="14" y1="15" x2="21" y2="15" />
            <line x1="14" y1="20" x2="21" y2="20" />
          </svg>
        </div>
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "var(--foreground)",
          }}
        >
          Workout Log
        </span>
      </div>

      <p
        style={{
          fontSize: 13,
          color: "#6b7280",
          fontWeight: 500,
          margin: "0 0 10px",
          lineHeight: 1.4,
        }}
      >
        {workout.exercises.slice(0, 4).join(" · ")}
        {workout.exercises.length > 4 ? " · …" : ""}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 6,
        }}
      >
        {[
          { value: String(workout.totalSets), label: "Sets" },
          { value: String(workout.totalReps), label: "Reps" },
          { value: fmtVolume(workout.totalVolume), label: "Volume" },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "var(--card)",
              borderRadius: 10,
              padding: "8px 6px",
              textAlign: "center",
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: "var(--foreground)",
                lineHeight: 1.1,
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "#9ca3af",
                marginTop: 2,
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Comments sheet
───────────────────────────────────────────────────────────────── */
function CommentsSheet({
  post,
  currentUser,
  onClose,
}: {
  post: FeedPost;
  currentUser: any;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const utils = trpc.useUtils();
  const isReal = post.id > 0;

  const { data: comments = [], isLoading } = trpc.community.getComments.useQuery(
    { postId: post.id, limit: 50, offset: 0 },
    { enabled: isReal }
  );

  const addComment = trpc.community.addComment.useMutation({
    onSuccess: () => {
      utils.community.getComments.invalidate({ postId: post.id });
      utils.community.getFeed.invalidate();
      setDraft("");
    },
  });

  const submit = () => {
    const body = draft.trim();
    if (!body || !isReal) return;
    addComment.mutate({ postId: post.id, body });
  };

  const displayComments: Comment[] = isReal
    ? (comments as Comment[])
    : [
        {
          id: 1,
          postId: post.id,
          userId: -10,
          body: "Absolute beast mode!",
          createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
          authorName: "Sarah K.",
          authorHandle: "@sarahk",
        },
        {
          id: 2,
          postId: post.id,
          userId: -11,
          body: "Congrats on the PR!",
          createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
          authorName: "JD",
          authorHandle: "@jd",
        },
      ];

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          zIndex: 200,
          backdropFilter: "blur(2px)",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 480,
          maxHeight: "75vh",
          background: "var(--card)",
          borderRadius: "20px 20px 0 0",
          zIndex: 201,
          boxShadow: "0 -4px 32px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: "var(--border)",
            margin: "14px auto 0",
            flexShrink: 0,
          }}
        />
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
            Comments
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "var(--secondary)",
              border: "none",
              borderRadius: "50%",
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#6b7280",
              fontSize: 18,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px" }}>
          {isLoading && (
            <p
              style={{
                color: "#9ca3af",
                fontSize: 13,
                textAlign: "center",
              }}
            >
              Loading…
            </p>
          )}
          {!isLoading && displayComments.length === 0 && (
            <p
              style={{
                color: "#9ca3af",
                fontSize: 13,
                textAlign: "center",
                marginTop: 24,
              }}
            >
              No comments yet. Be the first!
            </p>
          )}
          {displayComments.map((c) => (
            <div
              key={c.id}
              style={{ display: "flex", gap: 10, marginBottom: 14 }}
            >
              <Avatar name={c.authorName} avatarUrl={c.authorAvatarUrl} size={32} />
              <div>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--foreground)",
                    margin: "0 0 2px",
                  }}
                >
                  <strong>{c.authorName}</strong>{" "}
                  <span style={{ color: "#9ca3af", fontWeight: 400 }}>
                    {c.authorHandle}
                  </span>
                </p>
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--foreground)",
                    margin: "0 0 2px",
                  }}
                >
                  {c.body}
                </p>
                <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>
                  {timeAgo(c.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            padding: "12px 20px",
            borderTop: "1px solid var(--border)",
            paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
            flexShrink: 0,
          }}
        >
          <Avatar name={currentUser?.name ?? "Me"} size={32} />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={
              isReal ? "Add a comment…" : "Sign in to comment"
            }
            disabled={!isReal}
            style={{
              flex: 1,
              background: "var(--secondary)",
              border: "1.5px solid var(--border)",
              borderRadius: 20,
              padding: "8px 14px",
              fontSize: 14,
              color: "var(--foreground)",
              outline: "none",
              fontFamily: "inherit",
            }}
          />
          {isReal && (
            <button
              onClick={submit}
              disabled={!draft.trim() || addComment.isPending}
              style={{
                background: "var(--foreground)",
                color: "var(--background)",
                border: "none",
                borderRadius: 20,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                opacity: !draft.trim() ? 0.4 : 1,
              }}
            >
              Post
            </button>
          )}
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────
   New post composer (bottom sheet)
───────────────────────────────────────────────────────────────── */
export function NewPostComposer({
  currentUser,
  userAvatarUrl,
  workoutSessions = [],
  onClose,
}: {
  currentUser: any;
  userAvatarUrl?: string | null;
  workoutSessions?: any[];
  onClose: () => void;
}) {
  const [caption, setCaption] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachedSession, setAttachedSession] = useState<any | null>(null);
  const [showSessionPicker, setShowSessionPicker] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  // Sort sessions newest first
  const sortedSessions = [...workoutSessions].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const createPost = trpc.community.createPost.useMutation({
    onSuccess: () => {
      utils.community.getFeed.invalidate();
      // Also refresh the profile page posts grid
      (utils as any).community.getMyPosts.invalidate();
      onClose();
    },
    onError: (e) => setError(e.message),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 4);
    setMediaFiles(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const removeFile = (i: number) => {
    setMediaFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    if (!caption.trim() && mediaFiles.length === 0) return;
    setUploading(true);
    setError(null);

    try {
      // Get the Supabase session token to authenticate the server-side upload
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const mediaItems: {
        key: string;
        url?: string;
        mediaType: "photo" | "video";
        mimeType: string;
      }[] = [];

      for (const file of mediaFiles) {
        // Upload via server-side endpoint to avoid browser-to-R2 CORS issues
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload-media", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({ error: "Upload failed" }));
          throw new Error(errBody.error ?? "Media upload failed");
        }
        // url is the full Supabase Storage public URL; key is the storage path
        const { key, url, mediaType, mimeType } = await res.json();
        mediaItems.push({ key, url, mediaType, mimeType });
      }

      await createPost.mutateAsync({
        caption: caption.trim() || undefined,
        mediaItems,
        workoutSessionId: attachedSession?.sessionId ?? undefined,
      });
    } catch (e: any) {
      const msg = e.message ?? "Something went wrong";
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          zIndex: 200,
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
          borderRadius: "24px 24px 0 0",
          zIndex: 201,
          boxShadow: "0 -8px 40px rgba(0,0,0,0.14)",
          paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
        }}
      >
        {/* Drag handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--border)", margin: "12px auto 0" }} />

        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px 12px",
          borderBottom: "1px solid var(--border)",
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--foreground)", margin: 0 }}>New Post</h3>
          <button
            onClick={onClose}
            style={{
              background: "var(--secondary)",
              border: "none",
              borderRadius: "50%",
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--muted-foreground)",
              fontSize: 18,
            }}
          >
            ×
          </button>
        </div>

        {/* Composer body: avatar + text area */}
        <div style={{ display: "flex", gap: 12, padding: "16px 20px 12px", alignItems: "flex-start" }}>
          <Avatar name={currentUser?.name ?? "Me"} avatarUrl={userAvatarUrl} size={40} />
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Share your workout, progress, or motivation…"
            rows={4}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              fontSize: 15,
              lineHeight: 1.5,
              color: "var(--foreground)",
              fontFamily: "inherit",
              paddingTop: 2,
            }}
          />
        </div>

        {/* Media previews */}
        {previews.length > 0 && (
          <div style={{ display: "flex", gap: 8, padding: "0 20px 12px", flexWrap: "wrap" }}>
            {previews.map((src, i) => (
              <div key={i} style={{ position: "relative" }}>
                {mediaFiles[i]?.type.startsWith("video/") ? (
                  <video src={src} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 10, border: "1.5px solid var(--border)" }} />
                ) : (
                  <img src={src} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 10, border: "1.5px solid var(--border)" }} />
                )}
                <button
                  onClick={() => removeFile(i)}
                  style={{
                    position: "absolute", top: -6, right: -6,
                    width: 20, height: 20, borderRadius: "50%",
                    background: "#ef4444", color: "#fff",
                    border: "none", cursor: "pointer", fontSize: 12,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >×</button>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <p style={{ color: "#ef4444", fontSize: 13, margin: "0 20px 8px" }}>{error}</p>
        )}

        {/* Divider */}
        <div style={{ height: 1, background: "var(--border)", margin: "0 0 0" }} />

        {/* Bottom action bar: photo icon left, Post pill right */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px 4px",
        }}>
          {/* Photo / Video icon button */}
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--muted-foreground)",
              padding: "6px 8px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Photo / Video</span>
          </button>

          <input ref={fileRef} type="file" accept="image/*,video/*" multiple style={{ display: "none" }} onChange={handleFileChange} />

          {/* Post pill */}
          <button
            onClick={handleSubmit}
            disabled={uploading || (!caption.trim() && mediaFiles.length === 0)}
            style={{
              background: "var(--foreground)",
              color: "var(--background)",
              border: "none",
              borderRadius: 20,
              padding: "9px 24px",
              fontSize: 14,
              fontWeight: 700,
              cursor: uploading || (!caption.trim() && mediaFiles.length === 0) ? "default" : "pointer",
              opacity: uploading || (!caption.trim() && mediaFiles.length === 0) ? 0.35 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {uploading ? "Posting…" : "Post"}
          </button>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Post card
───────────────────────────────────────────────────────────────── */
function PostCard({
  post,
  currentUser,
}: {
  post: FeedPost;
  currentUser: any;
}) {
  const [showComments, setShowComments] = useState(false);
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [showOverflow, setShowOverflow] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isReal = post.id > 0;
  // Use server-provided isMyPost flag (avoids client-side ID type mismatch)
  const isOtherUser = isReal && !post.isMyPost;
  const utils = trpc.useUtils();

  const deletePostMutation = (trpc as any).community.deletePost.useMutation({
    onSuccess: () => {
      utils.community.getFeed.invalidate();
      utils.community.getMyPosts.invalidate();
    },
    onError: (err: any) => {
      console.error('[DeletePost] error:', err);
    },
  });

  // Social graph state for this post's author
  const { data: rel } = (trpc as any).social.getRelationship.useQuery(
    { userId: post.userId },
    { enabled: isOtherUser, staleTime: 30_000 }
  );
  const [following, setFollowing] = useState<boolean | null>(null);
  // Sync server state into local state once loaded
  const serverFollowing: boolean = rel?.following ?? false;
  const effectiveFollowing = following !== null ? following : serverFollowing;

  const followMutation = (trpc as any).social.follow.useMutation({
    onSuccess: () => { setFollowing(true); utils.social.getRelationship.invalidate({ userId: post.userId }); },
  });
  const unfollowMutation = (trpc as any).social.unfollow.useMutation({
    onSuccess: () => { setFollowing(false); utils.social.getRelationship.invalidate({ userId: post.userId }); },
  });
  const blockMutation = (trpc as any).social.block.useMutation({
    onSuccess: () => { setShowOverflow(false); utils.community.getFeed.invalidate(); },
  });
  const muteMutation = (trpc as any).social.mute.useMutation({
    onSuccess: () => { setShowOverflow(false); utils.community.getFeed.invalidate(); },
  });

  const toggleFollow = () => {
    if (!isOtherUser) return;
    if (effectiveFollowing) {
      unfollowMutation.mutate({ userId: post.userId });
    } else {
      followMutation.mutate({ userId: post.userId });
    }
  };

  const likeMutation = trpc.community.likePost.useMutation({
    onSuccess: () => utils.community.getFeed.invalidate(),
  });
  const unlikeMutation = trpc.community.unlikePost.useMutation({
    onSuccess: () => utils.community.getFeed.invalidate(),
  });

  const toggleLike = () => {
    if (!isReal) return; // sample posts: optimistic only
    if (liked) {
      setLiked(false);
      setLikeCount((c) => c - 1);
      unlikeMutation.mutate({ postId: post.id });
    } else {
      setLiked(true);
      setLikeCount((c) => c + 1);
      likeMutation.mutate({ postId: post.id });
    }
  };

  return (
    <>
      <div
        style={{
          background: "var(--card)",
          borderRadius: 20,
          border: "1.5px solid var(--border)",
          overflow: "hidden",
          marginBottom: 12,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 16px 10px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Avatar name={post.authorName} avatarUrl={post.authorAvatarUrl} size={42} />
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--foreground)",
                margin: "0 0 1px",
              }}
            >
              {post.authorName}
            </p>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
              {post.authorHandle} · {timeAgo(post.createdAt)}
            </p>
          </div>

          {/* Follow / Unfollow button — only shown for other users' posts */}
          {isOtherUser && (
            <button
              onClick={toggleFollow}
              style={{
                padding: "5px 12px",
                borderRadius: 50,
                border: effectiveFollowing
                  ? "1.5px solid var(--border)"
                  : "1.5px solid var(--foreground)",
                background: effectiveFollowing ? "var(--secondary)" : "var(--foreground)",
                color: effectiveFollowing ? "var(--foreground)" : "var(--background)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {effectiveFollowing ? "Following" : "Follow"}
            </button>
          )}

          {/* Three-dot overflow menu */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowOverflow((v) => !v)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#9ca3af",
                padding: 4,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>

            {showOverflow && (
              <>
                {/* Backdrop to close menu */}
                <div
                  onClick={() => setShowOverflow(false)}
                  style={{ position: "fixed", inset: 0, zIndex: 299 }}
                />
                {/* Dropdown */}
                <div
                  style={{
                    position: "absolute",
                    top: 28,
                    right: 0,
                    background: "var(--card)",
                    border: "1.5px solid var(--border)",
                    borderRadius: 14,
                    boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
                    zIndex: 300,
                    minWidth: 160,
                    overflow: "hidden",
                  }}
                >
                  {isOtherUser && (
                    <>
                      <button
                        onClick={() => { setShowOverflow(false); toggleFollow(); }}
                        style={{
                          display: "block",
                          width: "100%",
                          padding: "12px 16px",
                          background: "none",
                          border: "none",
                          textAlign: "left",
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--foreground)",
                          cursor: "pointer",
                        }}
                      >
                        {effectiveFollowing ? "Unfollow" : "Follow"}
                      </button>
                      <div style={{ height: 1, background: "var(--border)", margin: "0 12px" }} />
                      <button
                        onClick={() => muteMutation.mutate({ userId: post.userId })}
                        style={{
                          display: "block",
                          width: "100%",
                          padding: "12px 16px",
                          background: "none",
                          border: "none",
                          textAlign: "left",
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--foreground)",
                          cursor: "pointer",
                        }}
                      >
                        Mute
                      </button>
                      <div style={{ height: 1, background: "var(--border)", margin: "0 12px" }} />
                      <button
                        onClick={() => blockMutation.mutate({ userId: post.userId })}
                        style={{
                          display: "block",
                          width: "100%",
                          padding: "12px 16px",
                          background: "none",
                          border: "none",
                          textAlign: "left",
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#ef4444",
                          cursor: "pointer",
                        }}
                      >
                        Block
                      </button>
                    </>
                  )}
                  {!isOtherUser && (
                    <button
                      onClick={() => { setShowOverflow(false); setShowDeleteConfirm(true); }}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "12px 16px",
                        background: "none",
                        border: "none",
                        textAlign: "left",
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#ef4444",
                        cursor: "pointer",
                      }}
                    >
                      Delete post
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Caption */}
        {post.caption && (
          <div style={{ padding: "0 16px 12px" }}>
            <p
              style={{
                fontSize: 14,
                color: "var(--foreground)",
                margin: 0,
                lineHeight: 1.55,
              }}
            >
              {post.caption}
            </p>
          </div>
        )}

        {/* Workout log block — only shown when there is no media (media posts use the card image instead) */}
        {post.workout && post.media.length === 0 && <WorkoutLogBlock workout={post.workout} />}

        {/* Media */}
        {post.media.length > 0 && (
          <div
            style={{
              margin: "0 16px 12px",
              borderRadius: 14,
              overflow: "hidden",
              border: "1px solid var(--border)",
            }}
          >
            {post.media[0].mediaType === "video" ? (
              <video
                src={post.media[0].url}
                controls
                playsInline
                style={{
                  width: "100%",
                  maxHeight: 320,
                  objectFit: "cover",
                }}
              />
            ) : (
              <img
                src={post.media[0].url}
                alt=""
                style={{
                  width: "100%",
                  display: "block",
                  objectFit: "contain",
                }}
              />
            )}
          </div>
        )}

        {/* Action bar */}
        <div
          style={{
            padding: "10px 16px 12px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <button
            onClick={toggleLike}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 50,
              border: `1.5px solid ${liked ? "#fca5a5" : "var(--border)"}`,
              background: liked ? "#fee2e2" : "var(--card)",
              cursor: "pointer",
              color: liked ? "#ef4444" : "#9ca3af",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill={liked ? "#ef4444" : "none"}
              stroke={liked ? "#ef4444" : "currentColor"}
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {likeCount}
          </button>

          <button
            onClick={() => setShowComments(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 50,
              border: "1.5px solid var(--border)",
              background: "var(--card)",
              cursor: "pointer",
              color: "#9ca3af",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {post.commentCount}
          </button>

          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 50,
              border: "1.5px solid var(--border)",
              background: "var(--card)",
              cursor: "pointer",
              color: "#9ca3af",
              fontSize: 13,
              fontWeight: 600,
              marginLeft: "auto",
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            Share
          </button>
        </div>

        {/* Comment input row */}
        <div
          style={{
            padding: "0 16px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Avatar name={currentUser?.name ?? "Me"} size={32} />
          <input
            type="text"
            placeholder="Add a comment…"
            onClick={() => setShowComments(true)}
            readOnly
            style={{
              flex: 1,
              background: "var(--secondary)",
              border: "none",
              borderRadius: 50,
              padding: "8px 14px",
              fontSize: 13,
              color: "var(--foreground)",
              outline: "none",
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          />
        </div>
      </div>

      {showComments && (
        <CommentsSheet
          post={post}
          currentUser={currentUser}
          onClose={() => setShowComments(false)}
        />
      )}

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.45)",
            padding: "0 24px",
          }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--card)",
              borderRadius: 20,
              padding: "28px 24px 20px",
              width: "100%",
              maxWidth: 340,
              boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
            }}
          >
            <p style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 700, color: "var(--foreground)" }}>
              Delete post?
            </p>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: "var(--muted-foreground)", lineHeight: 1.5 }}>
              This will permanently remove the post and any attached media. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  flex: 1,
                  padding: "11px 0",
                  borderRadius: 50,
                  border: "1.5px solid var(--border)",
                  background: "none",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--foreground)",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  deletePostMutation.mutate({ postId: post.id });
                }}
                disabled={deletePostMutation.isPending}
                style={{
                  flex: 1,
                  padding: "11px 0",
                  borderRadius: 50,
                  border: "none",
                  background: "#ef4444",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#fff",
                  cursor: deletePostMutation.isPending ? "not-allowed" : "pointer",
                  opacity: deletePostMutation.isPending ? 0.6 : 1,
                }}
              >
                {deletePostMutation.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Main CommunityTab
───────────────────────────────────────────────────────────────── */
interface CommunityTabProps {
  user: any;
  userAvatarUrl?: string | null;
  workoutSessions?: any[];
}

export function CommunityTab({ user, userAvatarUrl, workoutSessions = [] }: CommunityTabProps) {
  const [showComposer, setShowComposer] = useState(false);

  const {
    data,
    isLoading,
    error,
    refetch,
  } = trpc.community.getFeed.useQuery(
    { limit: 20, offset: 0 },
    { refetchOnWindowFocus: true, staleTime: 30_000 }
  );

  // Use real posts if available, fall back to sample posts for display
  const feedPosts: FeedPost[] =
    data && data.posts.length > 0 ? (data.posts as FeedPost[]) : SAMPLE_POSTS;

  const showingSamples = !data || data.posts.length === 0;

  return (
    <div className="space-y-3">
      {/* Compose trigger */}
      <div
        onClick={() => setShowComposer(true)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "var(--card)",
          border: "1.5px solid var(--border)",
          borderRadius: 16,
          padding: "12px 16px",
          cursor: "pointer",
        }}
      >
        <Avatar name={user?.name ?? "Me"} avatarUrl={userAvatarUrl} size={36} />
        <span style={{ fontSize: 14, color: "#9ca3af", fontWeight: 500, flex: 1 }}>
          Share your workout…
        </span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <p style={{ color: "#9ca3af", fontSize: 14 }}>Loading feed…</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            background: "#fee2e2",
            borderRadius: 14,
            padding: "14px 16px",
          }}
        >
          <p style={{ color: "#ef4444", fontSize: 13, margin: 0 }}>
            Could not load feed.{" "}
            <button
              onClick={() => refetch()}
              style={{
                background: "none",
                border: "none",
                color: "#ef4444",
                fontWeight: 700,
                cursor: "pointer",
                textDecoration: "underline",
                padding: 0,
                fontSize: 13,
              }}
            >
              Retry
            </button>
          </p>
        </div>
      )}

      {/* Sample posts notice */}
      {!isLoading && showingSamples && (
        <div
          style={{
            background: "var(--secondary)",
            borderRadius: 12,
            padding: "10px 14px",
            border: "1px solid var(--border)",
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: "#9ca3af",
              margin: 0,
              textAlign: "center",
            }}
          >
            Sample posts shown for reference — be the first to post!
          </p>
        </div>
      )}

      {/* Feed */}
      {feedPosts.map((post) => (
        <PostCard key={post.id} post={post} currentUser={user} />
      ))}

      {/* Composer */}
      {showComposer && (
        <NewPostComposer
          currentUser={user}
          userAvatarUrl={userAvatarUrl}
          workoutSessions={workoutSessions}
          onClose={() => setShowComposer(false)}
        />
      )}
    </div>
  );
}

export default CommunityTab;
