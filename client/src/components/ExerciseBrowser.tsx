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
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M6.5 6.5h11"/><path d="M6.5 17.5h11"/>
    <path d="M3 9.5h2v5H3z"/><path d="M19 9.5h2v5h-2z"/>
    <path d="M5 12h14"/>
  </svg>
);

export function ExerciseBrowser({ open, onClose, onSelectExercise, selectedExercises, allExercises }: ExerciseBrowserProps) {
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

      {/* Slide-up panel */}
      <div
        className="fixed inset-0 z-50 flex flex-col bg-white"
        style={{
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          maxWidth: 700,
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div style={{ padding: "60px 16px 12px", borderBottom: "1px solid #f0f1f3", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{ width: 36, height: 36, borderRadius: 10, background: "#f5f6f8", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a2332" strokeWidth="2" strokeLinecap="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <div style={{ flex: 1, position: "relative" }}>
            <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search exercises…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%", padding: "10px 12px 10px 36px", background: "#f5f6f8", border: "none", borderRadius: 14, fontSize: 14, color: "#374151", outline: "none", boxSizing: "border-box" }}
              autoFocus
            />
          </div>
        </div>

        {/* Filter pills */}
        <div style={{ display: "flex", gap: 8, padding: "12px 16px", overflowX: "auto", flexShrink: 0, scrollbarWidth: "none" }}>
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                flexShrink: 0,
                padding: "7px 16px",
                borderRadius: 20,
                border: "none",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                background: activeFilter === f ? "#1a2332" : "#f5f6f8",
                color: activeFilter === f ? "white" : "#6b7280",
                transition: "all 0.15s",
              }}
            >
              {f === "all" ? "All" : PART_LABELS[f] || f}
            </button>
          ))}
        </div>

        {/* Exercise list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 24px", color: "#9ca3af", fontSize: 14 }}>
              No exercises found
            </div>
          ) : (
            Object.keys(grouped).map((part) => (
              <div key={part}>
                {/* Category header */}
                <div style={{ padding: "12px 16px 6px", display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 28, height: 28, background: "#f5f6f8", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#1a2332" }}>
                    {PART_ICON}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em" }}>
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
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer", transition: "background 0.1s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f5f6f8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#1a2332" }}>
                        {PART_ICON}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, fontSize: 14, color: "#1a2332", margin: "0 0 2px" }}>{ex.name}</p>
                        <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>{PART_LABELS[ex.category.toLowerCase()] || ex.category}</p>
                      </div>
                      {isAdded ? (
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#059669", background: "#f0fdf4", padding: "3px 10px", borderRadius: 20 }}>Added</span>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round">
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
      </div>
    </>
  );
}
