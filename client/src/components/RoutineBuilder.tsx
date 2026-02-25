import { useState, useEffect } from "react";
import { PRESET_EXERCISES } from "@/lib/exercises";

interface Exercise {
  id: string;
  name: string;
  category: string;
  isCustom?: boolean;
}

interface Routine {
  id: string;
  name: string;
  exercises: Exercise[];
}

interface RoutineBuilderProps {
  open: boolean;
  onClose: () => void;
  onSave: (routine: Routine) => void;
  allExercises: Exercise[];
}

const PART_LABELS: Record<string, string> = {
  chest: "Chest", back: "Back", legs: "Legs", arms: "Arms",
  shoulders: "Shoulders", core: "Core", cardio: "Cardio",
};

const FILTERS = ["all", "chest", "back", "legs", "arms", "shoulders", "core", "cardio"];

export function RoutineBuilder({ open, onClose, onSave, allExercises }: RoutineBuilderProps) {
  const [routineName, setRoutineName] = useState("");
  const [selected, setSelected] = useState<Exercise[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    if (open) {
      setRoutineName("");
      setSelected([]);
      setActiveFilter("all");
    }
  }, [open]);

  const filtered = allExercises.filter((ex) =>
    activeFilter === "all" || ex.category.toLowerCase() === activeFilter
  );

  const toggleExercise = (ex: Exercise) => {
    const idx = selected.findIndex((e) => e.id === ex.id);
    if (idx > -1) {
      setSelected(selected.filter((e) => e.id !== ex.id));
    } else {
      setSelected([...selected, ex]);
    }
  };

  const handleSave = () => {
    if (selected.length === 0) return;
    const name = routineName.trim() || "My Routine";
    onSave({ id: Date.now().toString(), name, exercises: selected });
    onClose();
  };

  return (
    <>
      {open && <div className="fixed inset-0 z-50 bg-black/30" onClick={onClose} />}
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
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "60px 16px 16px", borderBottom: "1px solid #f0f1f3", flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{ width: 36, height: 36, borderRadius: 10, background: "#f5f6f8", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a2332" strokeWidth="2" strokeLinecap="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1a2332", margin: 0 }}>New Routine</h2>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Build and save a reusable workout</p>
          </div>
          <button
            onClick={handleSave}
            style={{ padding: "9px 20px", background: "#1a2332", color: "white", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
          >
            Save
          </button>
        </div>

        {/* Routine name input */}
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f1f3", flexShrink: 0 }}>
          <input
            type="text"
            placeholder="Routine name (e.g. Push Day)"
            maxLength={40}
            value={routineName}
            onChange={(e) => setRoutineName(e.target.value)}
            style={{ width: "100%", padding: "12px 16px", background: "#f5f6f8", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 600, color: "#1a2332", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        {/* Filter pills */}
        <div style={{ display: "flex", gap: 8, padding: "12px 16px", overflowX: "auto", flexShrink: 0, scrollbarWidth: "none" }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{ flexShrink: 0, padding: "7px 16px", borderRadius: 20, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", background: activeFilter === f ? "#1a2332" : "#f5f6f8", color: activeFilter === f ? "white" : "#6b7280", transition: "all 0.15s" }}
            >
              {f === "all" ? "All" : PART_LABELS[f] || f}
            </button>
          ))}
        </div>

        {/* Split: exercise list (left) + selected (right) */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
          {/* Left: exercise picker */}
          <div style={{ flex: 1, overflowY: "auto", borderRight: "1px solid #f0f1f3" }}>
            {filtered.map((ex) => {
              const sel = !!selected.find((e) => e.id === ex.id);
              return (
                <div
                  key={ex.id}
                  onClick={() => toggleExercise(ex)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: "pointer", background: sel ? "#1a2332" : "transparent", transition: "background 0.15s", borderBottom: "1px solid #f5f6f8" }}
                >
                  <div style={{ width: 32, height: 32, background: sel ? "rgba(255,255,255,0.15)" : "#f5f6f8", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" }}>
                    {sel ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a2332" strokeWidth="2" strokeLinecap="round"><path d="M6.5 6.5h11"/><path d="M6.5 17.5h11"/><path d="M3 9.5h2v5H3z"/><path d="M19 9.5h2v5h-2z"/><path d="M5 12h14"/></svg>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 13, color: sel ? "white" : "#1a2332", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ex.name}</p>
                    <p style={{ fontSize: 11, color: sel ? "rgba(255,255,255,0.65)" : "#9ca3af", margin: 0 }}>{PART_LABELS[ex.category.toLowerCase()] || ex.category}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: selected exercises */}
          <div style={{ width: 150, flexShrink: 0, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "10px 12px", borderBottom: "1px solid #f0f1f3", flexShrink: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>
                Selected <span style={{ color: "#1a2332" }}>{selected.length}</span>
              </p>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
              {selected.length === 0 ? (
                <p style={{ fontSize: 12, color: "#d1d5db", textAlign: "center", padding: "16px 4px", lineHeight: 1.5 }}>Tap exercises to add them</p>
              ) : (
                selected.map((ex, i) => (
                  <div key={ex.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 4px", borderBottom: "1px solid #f5f6f8" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", width: 16, flexShrink: 0 }}>{i + 1}.</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#1a2332", flex: 1, lineHeight: 1.3 }}>{ex.name}</span>
                    <button
                      onClick={() => toggleExercise(ex)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 2, flexShrink: 0 }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1a2332" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
