import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useEffect } from "react";

/**
 * Public profile deep-link landing page: /u/:userId
 *
 * Behaviour:
 * 1. Fetch the user's public profile (name + avatar).
 * 2. Redirect authenticated users to /dashboard?tab=community&profile={userId}
 *    so the UserProfileSheet opens automatically.
 * 3. Show a minimal preview card for unauthenticated visitors with a
 *    "Join FlexTab" CTA.
 */
export default function PublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const [, setLocation] = useLocation();
  const numericId = parseInt(userId ?? "0", 10);

  const { data: profile, isLoading } = (trpc as any).user.getPublicProfile.useQuery(
    { userId: numericId },
    { enabled: numericId > 0, retry: 1 }
  );

  // If the user is already logged in (Supabase session exists), redirect to
  // the dashboard community tab with the profile sheet pre-opened.
  useEffect(() => {
    if (!numericId) return;
    try {
      const stored = localStorage.getItem("manus-runtime-user-info");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.id || parsed?.openId) {
          // Redirect to dashboard with profile param so UserProfileSheet opens
          setLocation(`/dashboard?tab=community&openProfile=${numericId}`);
        }
      }
    } catch {
      // Not logged in — stay on this page
    }
  }, [numericId, setLocation]);

  const initials = (profile?.name ?? "?")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handle =
    "@" + (profile?.name ?? "user").toLowerCase().replace(/\s+/g, "").slice(0, 20);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px",
        fontFamily: "inherit",
      }}
    >
      {/* FlexTab wordmark */}
      <div style={{ marginBottom: 40 }}>
        <span
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: "var(--foreground)",
            letterSpacing: "-0.5px",
          }}
        >
          FlexTab
        </span>
      </div>

      {/* Profile card */}
      <div
        style={{
          background: "var(--card)",
          border: "1.5px solid var(--border)",
          borderRadius: 24,
          padding: "32px 28px",
          width: "100%",
          maxWidth: 360,
          textAlign: "center",
          boxShadow: "0 4px 32px rgba(0,0,0,0.12)",
        }}
      >
        {isLoading ? (
          <div style={{ padding: "24px 0" }}>
            <p style={{ color: "#9ca3af", fontSize: 14 }}>Loading profile…</p>
          </div>
        ) : !profile ? (
          <div style={{ padding: "24px 0" }}>
            <p style={{ color: "#9ca3af", fontSize: 14 }}>Profile not found.</p>
          </div>
        ) : (
          <>
            {/* Avatar */}
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: "50%",
                margin: "0 auto 16px",
                overflow: "hidden",
                background: "var(--secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span
                  style={{
                    fontSize: 30,
                    fontWeight: 800,
                    color: "var(--foreground)",
                  }}
                >
                  {initials}
                </span>
              )}
            </div>

            {/* Name + handle */}
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "var(--foreground)",
                margin: "0 0 4px",
              }}
            >
              {profile.name}
            </h1>
            <p style={{ fontSize: 14, color: "#9ca3af", margin: "0 0 24px" }}>
              {handle} · FlexTab
            </p>

            {/* CTA */}
            <a
              href="/sign-up"
              style={{
                display: "block",
                width: "100%",
                padding: "13px 0",
                background: "var(--foreground)",
                color: "var(--background)",
                borderRadius: 50,
                fontWeight: 700,
                fontSize: 15,
                textDecoration: "none",
                marginBottom: 10,
              }}
            >
              Join FlexTab to follow
            </a>
            <a
              href="/sign-in"
              style={{
                display: "block",
                width: "100%",
                padding: "13px 0",
                background: "var(--secondary)",
                color: "var(--foreground)",
                borderRadius: 50,
                fontWeight: 700,
                fontSize: 15,
                textDecoration: "none",
                border: "1.5px solid var(--border)",
              }}
            >
              Sign in
            </a>
          </>
        )}
      </div>

      <p
        style={{
          marginTop: 28,
          fontSize: 13,
          color: "#6b7280",
          textAlign: "center",
        }}
      >
        Track workouts. Build community. Level up.
      </p>
    </div>
  );
}
