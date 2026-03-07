import React, { useEffect, useRef } from "react";
import { Info } from "lucide-react";
import type { ExerciseDetail } from "@/lib/exerciseDetails";

interface ExerciseDetailSheetProps {
  detail: ExerciseDetail;
  onClose: () => void;
}

export function ExerciseDetailSheet({ detail, onClose }: ExerciseDetailSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Prevent body scroll while sheet is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleBackdropClick}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
        }}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        style={{
          position: "fixed",
          left: "env(safe-area-inset-left, 0px)",
          right: "env(safe-area-inset-right, 0px)",
          bottom: 0,
          zIndex: 51,
          background: "var(--card)",
          borderRadius: "20px 20px 0 0",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
          maxWidth: 480,
          margin: "0 auto",
          maxHeight: "92dvh",
          display: "flex",
          flexDirection: "column",
          overflowY: "hidden",
        }}
      >
        {/* Drag handle — shown above image or above content if no image */}
        {!detail.image && (
          <div style={{ padding: "12px 16px 0", flexShrink: 0 }}>
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                background: "var(--border)",
                margin: "0 auto",
              }}
            />
          </div>
        )}

        {/* Scrollable content */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {/* Exercise illustration — full-width, flush with card edges, top corners match card */}
          {detail.image && (
            <div
              style={{
                width: "100%",
                aspectRatio: "4 / 3",
                overflow: "hidden",
                background: "#eef0f5",
                borderRadius: "20px 20px 0 0",
                flexShrink: 0,
                position: "relative",
              }}
            >
              {/* Drag handle overlaid on image */}
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  background: "rgba(0,0,0,0.18)",
                  zIndex: 2,
                }}
              />
              <img
                src={detail.image}
                alt={detail.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
                onError={(e) => {
                  (e.currentTarget.parentElement as HTMLDivElement).style.display = "none";
                }}
              />
            </div>
          )}

          {/* Padded content below image */}
          <div style={{ padding: "0 16px calc(env(safe-area-inset-bottom,0px) + 24px)" }}>

          {/* Name + category */}
          <div style={{ marginBottom: 16, marginTop: 16 }}>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "var(--foreground)",
                margin: "0 0 4px",
                letterSpacing: -0.5,
              }}
            >
              {detail.name}
            </h2>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
              }}
            >
              {detail.category}
            </span>
          </div>

          {/* Muscles worked */}
          <div style={{ marginBottom: 16 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                margin: "0 0 8px",
              }}
            >
              Muscles Worked
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {detail.primaryMuscles.map((m) => (
                <span
                  key={m}
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--foreground)",
                    background: "var(--secondary)",
                    padding: "5px 12px",
                    borderRadius: 20,
                    border: "1.5px solid var(--border)",
                  }}
                >
                  {m}
                </span>
              ))}
              {detail.secondaryMuscles.map((m) => (
                <span
                  key={m}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#6b7280",
                    background: "var(--secondary)",
                    padding: "5px 12px",
                    borderRadius: 20,
                    border: "1.5px solid var(--border)",
                  }}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div style={{ marginBottom: 16 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                margin: "0 0 10px",
              }}
            >
              How to Perform
            </p>
            <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {detail.instructions.map((step, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    gap: 12,
                    marginBottom: i < detail.instructions.length - 1 ? 10 : 0,
                    alignItems: "flex-start",
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: "var(--foreground)",
                      color: "var(--background)",
                      fontSize: 12,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 1,
                    }}
                  >
                    {i + 1}
                  </span>
                  <p
                    style={{
                      fontSize: 14,
                      color: "var(--foreground)",
                      margin: 0,
                      lineHeight: 1.55,
                    }}
                  >
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          {/* Tips box */}
          {detail.tips && (
            <div
              style={{
                background: "#f4f4f6",
                border: "1.5px solid #c8c8d0",
                borderRadius: 14,
                padding: "12px 14px",
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
              }}
            >
              <Info
                size={16}
                color="#6b7280"
                style={{ flexShrink: 0, marginTop: 2 }}
              />
              <p
                style={{
                  fontSize: 13,
                  color: "#374151",
                  margin: 0,
                  lineHeight: 1.55,
                }}
              >
                {detail.tips}
              </p>
            </div>
           )}
          </div>{/* end padded content */}
        </div>
        {/* Close button */}
        <div
          style={{
            padding: "12px 20px",
            paddingBottom: "calc(env(safe-area-inset-bottom, 20px) + 16px)",
            flexShrink: 0,
            borderTop: "1px solid var(--border)",
          }}
        >
          <button
            onClick={onClose}
            style={{
              width: "100%",
              padding: "14px",
              background: "var(--foreground)",
              color: "var(--background)",
              border: "none",
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
