import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { formatDateFull } from "@/lib/dateUtils";

/* ─────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────── */
interface MetricConfig {
  key: string;
  label: string;
  unit: string;
  allowDecimal: boolean;
  defaultValue: number;
}

const METRICS: MetricConfig[] = [
  { key: "weight", label: "Weight",   unit: "lbs", allowDecimal: false, defaultValue: 185 },
  { key: "fat",    label: "Body Fat", unit: "%",   allowDecimal: true,  defaultValue: 15  },
  { key: "chest",  label: "Chest",    unit: "in",  allowDecimal: true,  defaultValue: 38  },
  { key: "waist",  label: "Waist",    unit: "in",  allowDecimal: true,  defaultValue: 32  },
  { key: "arms",   label: "Arms",     unit: "in",  allowDecimal: true,  defaultValue: 14  },
  { key: "thighs", label: "Thighs",   unit: "in",  allowDecimal: true,  defaultValue: 22  },
];

function fmt(v: number | null): string {
  if (v === null) return "—";
  return v % 1 === 0 ? String(v) : parseFloat(v.toFixed(1)).toString();
}

/* ─────────────────────────────────────────────────────────────────
   Numpad overlay component
───────────────────────────────────────────────────────────────── */
interface NumpadProps {
  metric: MetricConfig;
  inputBuf: string;
  onKey: (k: string) => void;
  onDone: () => void;
}

function Numpad({ metric, inputBuf, onKey, onDone }: NumpadProps) {
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const keyStyle: React.CSSProperties = {
    height: 50, borderRadius: 12, border: "none",
    background: "var(--muted)", fontSize: 20, fontWeight: 700,
    color: "var(--foreground)", cursor: "pointer", fontFamily: "inherit",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "background 0.1s",
    WebkitTapHighlightColor: "transparent",
  };

  return (
    <div style={{
      position: "absolute", left: 0, right: 0, bottom: 0,
      background: "var(--card)", borderTop: "1px solid var(--border)",
      borderRadius: "0 0 20px 20px",
      padding: "14px 16px 16px",
      zIndex: 20,
      boxShadow: "0 -4px 20px rgba(0,0,0,0.06)",
    }}>
      {/* Drag handle */}
      <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--border)", margin: "0 auto 14px" }} />

      {/* Header: metric name + live display */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          {metric.label}
        </span>
        <span style={{ fontSize: 28, fontWeight: 800, color: "var(--foreground)", letterSpacing: -1 }}>
          {inputBuf || "0"}{" "}
          <span style={{ fontSize: 14, fontWeight: 600, color: "#9ca3af" }}>{metric.unit}</span>
        </span>
      </div>

      {/* Keys grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7 }}>
        {digits.map(n => (
          <button key={n} style={keyStyle} onPointerDown={e => { e.preventDefault(); onKey(String(n)); }}>
            {n}
          </button>
        ))}

        {/* Bottom row: decimal / empty | 0 | backspace */}
        {metric.allowDecimal ? (
          <button style={keyStyle} onPointerDown={e => { e.preventDefault(); onKey("."); }}>.</button>
        ) : (
          <div style={{ ...keyStyle, background: "transparent", pointerEvents: "none" }} />
        )}

        <button style={keyStyle} onPointerDown={e => { e.preventDefault(); onKey("0"); }}>0</button>

        <button style={{ ...keyStyle, color: "var(--muted-foreground)", fontSize: 15 }}
          onPointerDown={e => { e.preventDefault(); onKey("del"); }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
            <line x1="18" y1="9" x2="12" y2="15" /><line x1="12" y1="9" x2="18" y2="15" />
          </svg>
        </button>

        {/* Done button spans full width */}
        <button
          style={{ ...keyStyle, background: "var(--foreground)", color: "var(--background)", fontSize: 14, fontWeight: 700, gridColumn: "span 3", height: 46, borderRadius: 12 }}
          onPointerDown={e => { e.preventDefault(); onDone(); }}
        >
          Done ✓
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   History screen component
───────────────────────────────────────────────────────────────── */
interface HistoryEntry {
  id: number;
  date: string;
  weight: number;
  chest: number;
  waist: number;
  arms: number;
  thighs: number;
}

interface HistoryScreenProps {
  entries: HistoryEntry[];
  onBack: () => void;
}

const HISTORY_FILTERS = [
  { key: "all",    label: "All"      },
  { key: "weight", label: "Weight"   },
  { key: "fat",    label: "Body Fat" },
  { key: "chest",  label: "Chest"    },
  { key: "waist",  label: "Waist"    },
  { key: "arms",   label: "Arms"     },
  { key: "thighs", label: "Thighs"   },
];

const METRIC_META: Record<string, { label: string; unit: string }> = {
  weight: { label: "Weight",   unit: "lbs" },
  fat:    { label: "Body Fat", unit: "%"   },
  chest:  { label: "Chest",    unit: "in"  },
  waist:  { label: "Waist",    unit: "in"  },
  arms:   { label: "Arms",     unit: "in"  },
  thighs: { label: "Thighs",   unit: "in"  },
};

function HistoryScreen({ entries, onBack }: HistoryScreenProps) {
  const [filter, setFilter] = useState("all");

  const sorted = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const filterKeys = filter === "all"
    ? ["weight", "fat", "chest", "waist", "arms", "thighs"]
    : filter === "weight" ? ["weight"] : ["weight", filter];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--background)" }}>
      {/* Top bar */}
      <div style={{ background: "var(--card)", borderBottom: "1px solid var(--border)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <button
          onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, color: "var(--foreground)", padding: 0 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
        <span style={{ flex: 1, textAlign: "center", fontSize: 16, fontWeight: 800, color: "var(--foreground)" }}>
          Measurement History
        </span>
        <div style={{ width: 60 }} />
      </div>

      {/* Filter chips */}
      <div style={{ display: "flex", gap: 6, padding: "10px 14px 0", overflowX: "auto", flexShrink: 0, scrollbarWidth: "none" }}>
        {HISTORY_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              flexShrink: 0, padding: "5px 12px", borderRadius: 20,
              border: `1.5px solid ${filter === f.key ? "var(--foreground)" : "var(--border)"}`,
              background: filter === f.key ? "var(--foreground)" : "var(--card)",
              color: filter === f.key ? "var(--background)" : "var(--muted-foreground)",
              fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              transition: "all 0.15s",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px 16px", scrollbarWidth: "none" }}>
        {sorted.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "#9ca3af", fontWeight: 500 }}>No measurements recorded yet.</p>
          </div>
        ) : sorted.map((h, idx) => {
          const prev = sorted[idx + 1];
          const delta = prev ? (h.weight - prev.weight) : null;
          const dClass = delta === null ? "none" : delta < 0 ? "down" : delta > 0 ? "up" : "none";
          const dText = delta === null ? "—" : delta < 0 ? `▼ ${Math.abs(delta)} lbs` : delta > 0 ? `▲ ${Math.abs(delta)} lbs` : "— no change";
          const dColor = dClass === "down" ? "#059669" : dClass === "up" ? "#dc2626" : "#9ca3af";

          const isToday = idx === 0;
          const metricItems = filterKeys.filter(k => k !== "weight").map(k => {
            const meta = METRIC_META[k];
            const val = k === "fat" ? null : (h as any)[k] as number;
            if (val === null || val === 0) {
              return (
                <div key={k} style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em" }}>{meta.label}</span>
                  <span style={{ fontSize: 11, fontStyle: "italic", color: "#9ca3af" }}>N/A</span>
                </div>
              );
            }
            return (
              <div key={k} style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em" }}>{meta.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>{fmt(val)}</span>
                <span style={{ fontSize: 10, fontWeight: 500, color: "#9ca3af" }}>{meta.unit}</span>
              </div>
            );
          });

          return (
            <div key={h.id} style={{ display: "flex", alignItems: "flex-start", padding: "12px 0", gap: 12, borderBottom: idx < sorted.length - 1 ? "1px solid var(--border)" : "none" }}>
              {/* Timeline dot + line */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 14 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: isToday ? "#059669" : "var(--foreground)",
                  border: "2px solid var(--background)",
                  boxShadow: isToday ? "0 0 0 2px rgba(5,150,105,0.25)" : "0 0 0 2px var(--border)",
                  marginTop: 3, flexShrink: 0,
                }} />
                {idx < sorted.length - 1 && (
                  <div style={{ flex: 1, width: 2, background: "var(--border)", marginTop: 4, minHeight: 20 }} />
                )}
              </div>

              {/* Body */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground)" }}>{formatDateFull(h.date)}</span>
                  {isToday && (
                    <span style={{ fontSize: 9, fontWeight: 800, background: "var(--foreground)", color: "var(--background)", padding: "2px 6px", borderRadius: 4, letterSpacing: "0.05em" }}>
                      TODAY
                    </span>
                  )}
                </div>
                {metricItems.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 10px" }}>
                    {metricItems}
                  </div>
                )}
              </div>

              {/* Weight + delta */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--foreground)" }}>
                  {fmt(h.weight)} <span style={{ fontSize: 11, fontWeight: 500, color: "#9ca3af" }}>lbs</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2, color: dColor }}>{dText}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Main BodyMeasurements component
───────────────────────────────────────────────────────────────── */
export function BodyMeasurements() {
  const { data: measurements = [] } = trpc.workout.getMeasurements.useQuery();
  const utils = trpc.useUtils();

  const sorted = [...measurements].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const latest = sorted[0];

  /* ── State ── */
  const [activeIdx, setActiveIdx] = useState(0);
  const [values, setValues] = useState<Record<string, number | null>>({
    weight: latest?.weight || 185,
    fat:    null,
    chest:  latest?.chest  || 38,
    waist:  latest?.waist  || 32,
    arms:   latest?.arms   || 14,
    thighs: latest?.thighs || 22,
  });
  const [naFlags, setNaFlags] = useState<Record<string, boolean>>({
    weight: false, fat: true, chest: false, waist: false, arms: false, thighs: false,
  });
  const [inputBuf, setInputBuf] = useState("");
  const [hasDot, setHasDot]     = useState(false);
  const [numpadOpen, setNumpadOpen] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const addMutation = trpc.workout.addMeasurement.useMutation({
    onSettled: () => utils.workout.getMeasurements.invalidate(),
  });

  const metric = METRICS[activeIdx];

  /* ── Sync latest DB values when data loads ── */
  useEffect(() => {
    if (latest) {
      setValues(prev => ({
        ...prev,
        weight: latest.weight || prev.weight,
        chest:  latest.chest  || prev.chest,
        waist:  latest.waist  || prev.waist,
        arms:   latest.arms   || prev.arms,
        thighs: latest.thighs || prev.thighs,
      }));
    }
  }, [latest?.id]);

  /* ── Navigation ── */
  function navigate(dir: number) {
    if (numpadOpen) closeNumpad();
    const next = activeIdx + dir;
    if (next < 0 || next >= METRICS.length) return;
    setActiveIdx(next);
    setInputBuf("");
    setHasDot(false);
  }

  function jumpTo(i: number) {
    if (numpadOpen) closeNumpad();
    setActiveIdx(i);
    setInputBuf("");
    setHasDot(false);
  }

  /* ── N/A toggle ── */
  function toggleNA() {
    const key = metric.key;
    const newNA = !naFlags[key];
    setNaFlags(prev => ({ ...prev, [key]: newNA }));
    if (!newNA && values[key] === null) {
      setValues(prev => ({ ...prev, [key]: metric.defaultValue }));
      setInputBuf(String(metric.defaultValue));
      setHasDot(false);
    }
    if (numpadOpen) closeNumpad();
  }

  /* ── Numpad ── */
  function openNumpad() {
    if (naFlags[metric.key]) return;
    const cur = values[metric.key];
    const buf = cur !== null ? fmt(cur) : "";
    setInputBuf(buf);
    setHasDot(buf.includes("."));
    setNumpadOpen(true);
  }

  function closeNumpad() {
    setNumpadOpen(false);
  }

  function handleKey(k: string) {
    let buf = inputBuf;
    let dot = hasDot;
    if (k === "del") {
      if (buf.length > 0) {
        if (buf[buf.length - 1] === ".") dot = false;
        buf = buf.slice(0, -1);
      }
    } else if (k === ".") {
      if (!metric.allowDecimal || dot) return;
      if (buf === "") buf = "0";
      buf += "."; dot = true;
    } else {
      const dotPos = buf.indexOf(".");
      if (dotPos !== -1 && buf.length - dotPos > 1) return;
      if (buf === "0") buf = k; else buf += k;
    }
    setInputBuf(buf);
    setHasDot(dot);
    // Live-update the value
    const parsed = parseFloat(buf);
    if (!isNaN(parsed) && parsed > 0) {
      setValues(prev => ({ ...prev, [metric.key]: parsed }));
    }
  }

  function handleDone() {
    const parsed = parseFloat(inputBuf);
    if (!isNaN(parsed) && parsed > 0) {
      setValues(prev => ({ ...prev, [metric.key]: parsed }));
    }
    setInputBuf("");
    setHasDot(false);
    closeNumpad();
  }

  /* ── Save ── */
  async function handleSave() {
    if (numpadOpen) handleDone();
    setSaving(true);
    const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "numeric", day: "numeric" });
    await addMutation.mutateAsync({
      date: today,
      weight: values.weight ?? 0,
      chest:  values.chest  ?? 0,
      waist:  values.waist  ?? 0,
      arms:   values.arms   ?? 0,
      thighs: values.thighs ?? 0,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  /* ── Dial display value ── */
  const isNA = naFlags[metric.key];
  const dialDisplayVal = isNA ? null : (values[metric.key] ?? null);
  const lastVal = metric.key === "fat" ? null
    : metric.key === "weight" ? (latest?.weight ?? null)
    : metric.key === "chest"  ? (latest?.chest  ?? null)
    : metric.key === "waist"  ? (latest?.waist  ?? null)
    : metric.key === "arms"   ? (latest?.arms   ?? null)
    : metric.key === "thighs" ? (latest?.thighs ?? null)
    : null;

  /* ─────────────────────────────────────────────────────────────
     Render
  ───────────────────────────────────────────────────────────── */
  return (
    <div style={{ position: "relative", height: "100%" }}>

      {/* ══════════════════════════════════════════════════════════
          HISTORY SCREEN — slides in over the entry screen
      ══════════════════════════════════════════════════════════ */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 30,
        transform: showHistory ? "translateX(0)" : "translateX(100%)",
        opacity: showHistory ? 1 : 0,
        transition: "transform 0.35s cubic-bezier(0.16,1,0.3,1), opacity 0.25s",
        pointerEvents: showHistory ? "auto" : "none",
      }}>
        <HistoryScreen entries={sorted} onBack={() => setShowHistory(false)} />
      </div>

      {/* ══════════════════════════════════════════════════════════
          ENTRY SCREEN
      ══════════════════════════════════════════════════════════ */}
      <div style={{
        transform: showHistory ? "translateX(-30%)" : "translateX(0)",
        opacity: showHistory ? 0 : 1,
        transition: "transform 0.35s cubic-bezier(0.16,1,0.3,1), opacity 0.25s",
        display: "flex", flexDirection: "column", gap: 12,
      }}>

        {/* Page title row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--foreground)", letterSpacing: -0.5, margin: 0 }}>
            Measurements
          </h2>
          <button
            onClick={() => setShowHistory(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "7px 13px", borderRadius: 10,
              border: "1.5px solid var(--border)", background: "var(--card)",
              color: "var(--foreground)", fontSize: 12, fontWeight: 700,
              fontFamily: "inherit", cursor: "pointer",
              transition: "background 0.15s",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            History
          </button>
        </div>

        {/* ── Dial card ── */}
        <div style={{
          background: "var(--card)", borderRadius: 20,
          border: "1px solid var(--border)", padding: "20px 18px 18px",
          position: "relative", overflow: "hidden",
        }}>

          {/* Arrow nav + dots */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <button
              disabled={activeIdx === 0}
              onClick={() => navigate(-1)}
              style={{
                width: 36, height: 36, borderRadius: 10,
                border: "1.5px solid var(--border)", background: "var(--muted)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: activeIdx === 0 ? "default" : "pointer",
                color: "var(--foreground)", opacity: activeIdx === 0 ? 0.3 : 1,
                transition: "opacity 0.15s",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
              {METRICS.map((_, i) => (
                <div key={i} style={{
                  height: 6, borderRadius: 3,
                  width: i === activeIdx ? 20 : 6,
                  background: i === activeIdx ? "var(--foreground)" : "var(--border)",
                  transition: "all 0.2s",
                }} />
              ))}
            </div>

            <button
              disabled={activeIdx === METRICS.length - 1}
              onClick={() => navigate(1)}
              style={{
                width: 36, height: 36, borderRadius: 10,
                border: "1.5px solid var(--border)", background: "var(--muted)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: activeIdx === METRICS.length - 1 ? "default" : "pointer",
                color: "var(--foreground)", opacity: activeIdx === METRICS.length - 1 ? 0.3 : 1,
                transition: "opacity 0.15s",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Metric label */}
          <div style={{ textAlign: "center", fontSize: 11, fontWeight: 800, color: "var(--muted-foreground)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
            {metric.label}
          </div>

          {/* Circular dial */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <div
              onClick={openNumpad}
              style={{
                width: 160, height: 160, borderRadius: "50%",
                background: "var(--muted)",
                border: `2px solid ${numpadOpen && !isNA ? "var(--foreground)" : "var(--border)"}`,
                boxShadow: numpadOpen && !isNA ? "0 0 0 5px rgba(26,35,50,0.1)" : "none",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                cursor: isNA ? "default" : "pointer",
                position: "relative",
                opacity: isNA ? 0.5 : 1,
                transition: "border-color 0.2s, box-shadow 0.2s, opacity 0.2s",
                userSelect: "none",
              }}
            >
              {isNA ? (
                <span style={{ fontSize: 20, fontWeight: 700, color: "#9ca3af" }}>N/A</span>
              ) : (
                <>
                  <span style={{ fontSize: 44, fontWeight: 800, color: "var(--foreground)", letterSpacing: -2, lineHeight: 1 }}>
                    {dialDisplayVal !== null ? fmt(dialDisplayVal) : "—"}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#9ca3af", marginTop: 4 }}>{metric.unit}</span>
                  {!numpadOpen && (
                    <span style={{ position: "absolute", bottom: 14, fontSize: 10, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.04em" }}>
                      tap to edit
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Last recorded */}
          <div style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", fontWeight: 500, marginBottom: 14 }}>
            {lastVal !== null ? `Last recorded: ${fmt(lastVal)} ${metric.unit}` : "No previous record"}
          </div>

          {/* N/A toggle */}
          <div
            onClick={toggleNA}
            style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", justifyContent: "center", marginBottom: 16, userSelect: "none" }}
          >
            <div style={{ width: 36, height: 20, borderRadius: 10, background: isNA ? "var(--foreground)" : "var(--border)", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
              <div style={{ position: "absolute", top: 3, left: 3, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "transform 0.2s cubic-bezier(0.16,1,0.3,1)", transform: isNA ? "translateX(16px)" : "translateX(0)", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)" }}>
              Mark as N/A — I don't know this value
            </span>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: "100%", padding: 13,
              background: saved ? "#059669" : "var(--foreground)",
              color: "var(--background)", border: "none", borderRadius: 14,
              fontSize: 15, fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit", transition: "background 0.2s",
            }}
          >
            {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Measurements"}
          </button>

          {/* Numpad overlay — inside the card */}
          {numpadOpen && (
            <Numpad
              metric={metric}
              inputBuf={inputBuf}
              onKey={handleKey}
              onDone={handleDone}
            />
          )}
        </div>

        {/* ── Summary panel ── */}
        <div style={{ background: "var(--card)", borderRadius: 20, border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px 10px", borderBottom: "1px solid var(--border)" }}>
            <h4 style={{ fontSize: 10, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
              All Measurements
            </h4>
          </div>
          {METRICS.map((m, i) => {
            const isActive = i === activeIdx;
            const mIsNA = naFlags[m.key];
            const mVal = values[m.key];
            return (
              <div
                key={m.key}
                onClick={() => jumpTo(i)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 16px",
                  borderBottom: i < METRICS.length - 1 ? "1px solid var(--border)" : "none",
                  background: isActive ? "var(--muted)" : "transparent",
                  cursor: "pointer", transition: "background 0.1s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: isActive ? "var(--foreground)" : "transparent", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--muted-foreground)" }}>{m.label}</span>
                </div>
                {mIsNA ? (
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", background: "var(--muted)", padding: "3px 8px", borderRadius: 6 }}>N/A</span>
                ) : (
                  <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "var(--foreground)" }}>{mVal !== null ? fmt(mVal) : "—"}</span>
                    <span style={{ fontSize: 11, fontWeight: 500, color: "#9ca3af" }}>{m.unit}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
