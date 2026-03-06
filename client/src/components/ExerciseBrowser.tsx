import { useState, useEffect } from "react";
import { PRESET_EXERCISES, EXERCISE_CATEGORIES } from "@/lib/exercises";

interface Exercise {
  id: string;
  name: string;
  category: string;
  isCustom?: boolean;
}

interface ExerciseBrowserProps {
  open: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: Exercise) => void;
  selectedExercises: Exercise[];
  allExercises: Exercise[];
  onCreateCustom?: () => void;
}

const PART_LABELS: Record<string, string> = {
  chest: "Chest",
  back: "Back",
  legs: "Legs",
  arms: "Arms",
  shoulders: "Shoulders",
  core: "Core",
  cardio: "Cardio",
};

const PART_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M6.5 6.5h11"/><path d="M6.5 17.5h11"/>
    <path d="M3 9.5h2v5H3z"/><path d="M19 9.5h2v5h-2z"/>
    <path d="M5 12h14"/>
  </svg>
);

const CARDIO_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);

export function ExerciseBrowser({ open, onClose, onSelectExercise, selectedExercises, allExercises, onCreateCustom }: ExerciseBrowserProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  // Reset state when opened
  useEffect(() => {
    if (open) {
      setSearchQuery("");
      setActiveFilter("all");
    }
  }, [open]);

  // Filter exercises
  const filtered = allExercises.filter((ex) => {
    const matchesFilter = activeFilter === "all" || ex.category.toLowerCase() === activeFilter;
    const matchesSearch = !searchQuery || ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Group by category
  const grouped: Record<string, Exercise[]> = {};
  filtered.forEach((ex) => {
    const cat = ex.category.toLowerCase();
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(ex);
  });

  const filters = ["all", "chest", "back", "legs", "arms", "shoulders", "core", "cardio"];

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/30"
          onClick={onClose}
        />
      )}

      {/* Slide-up full-screen panel */}
      <div
        className="fixed inset-0 z-50 flex flex-col"
        style={{
          background: "var(--background)",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          maxWidth: 700,
          margin: "0 auto",
        }}
      >
        {/* ── Header: back button + search ── */}
        <div
          style={{
            paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)",
            paddingLeft: 16,
            paddingRight: 16,
            paddingBottom: 12,
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              width: 38, height: 38, borderRadius: 12,
              background: "var(--secondary)", border: "none",
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", flexShrink: 0,
              color: "var(--foreground)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <div style={{ flex: 1, position: "relative" }}>
            <svg
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search exercises…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%", padding: "11px 14px 11px 38px",
                background: "var(--secondary)", border: "none",
                borderRadius: 14, fontSize: 15, color: "var(--foreground)",
                outline: "none", boxSizing: "border-box",
              }}
              autoFocus
            />
          </div>
        </div>

        {/* ── Filter pills ── */}
        <div
          style={{
            display: "flex", gap: 8, padding: "12px 16px",
            overflowX: "auto", flexShrink: 0, scrollbarWidth: "none",
          }}
        >
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                flexShrink: 0,
                padding: "8px 18px",
                borderRadius: 22,
                border: "none",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                background: activeFilter === f ? "var(--foreground)" : "var(--secondary)",
                color: activeFilter === f ? "var(--background)" : "var(--muted-foreground)",
                transition: "all 0.15s",
              }}
            >
              {f === "all" ? "All" : PART_LABELS[f] || f}
            </button>
          ))}
        </div>

        {/* ── Exercise list ── */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "56px 24px", color: "#9ca3af", fontSize: 15 }}>
              No exercises found
            </div>
          ) : (
            Object.keys(grouped).map((part) => (
              <div key={part}>
                {/* Category header */}
                <div style={{ padding: "14px 16px 6px", display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, background: "var(--secondary)",
                    borderRadius: 8, display: "flex", alignItems: "center",
                    justifyContent: "center", color: "var(--foreground)",
                  }}>
                    {part === "cardio" ? CARDIO_ICON : PART_ICON}
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: "var(--muted-foreground)",
                    textTransform: "uppercase", letterSpacing: "0.08em",
                  }}>
                    {PART_LABELS[part] || part}
                  </span>
                </div>

                {/* Exercise rows */}
                {grouped[part].map((ex) => {
                  const isAdded = !!selectedExercises.find((e) => e.id === ex.id);
                  return (
                    <div
                      key={ex.id}
                      onClick={() => { onSelectExercise(ex); onClose(); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "14px 16px", cursor: "pointer",
                        transition: "background 0.1s",
                        borderBottom: "1px solid var(--border)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--secondary)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* Icon */}
                      <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: "var(--secondary)", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        flexShrink: 0, color: "var(--foreground)",
                      }}>
                        {ex.category.toLowerCase() === "cardio" ? CARDIO_ICON : PART_ICON}
                      </div>

                      {/* Name + category */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: 15, color: "var(--foreground)", margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {ex.name}
                        </p>
                        <p style={{ fontSize: 13, color: "var(--muted-foreground)", margin: 0 }}>
                          {PART_LABELS[ex.category.toLowerCase()] || ex.category}
                          {ex.isCustom ? " · Custom" : ""}
                        </p>
                      </div>

                      {/* State indicator */}
                      {isAdded ? (
                        <span style={{
                          fontSize: 12, fontWeight: 700, color: "#059669",
                          background: "#f0fdf4", padding: "4px 12px",
                          borderRadius: 22, flexShrink: 0,
                        }}>
                          Added
                        </span>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* ── Create custom exercise button — safe area aware ── */}
        {onCreateCustom && (
          <div
            style={{
              padding: "12px 16px",
              paddingBottom: "calc(env(safe-area-inset-bottom, 20px) + 12px)",
              borderTop: "1px solid var(--border)",
              flexShrink: 0,
              background: "var(--background)",
            }}
          >
            <button
              onClick={() => { onClose(); onCreateCustom(); }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                width: "100%", padding: "15px 16px", borderRadius: 16,
                border: "none", background: "var(--foreground)",
                fontSize: 15, fontWeight: 700, color: "var(--background)",
                cursor: "pointer", transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Create custom exercise
            </button>
          </div>
        )}
      </div>
    </>
  );
}
