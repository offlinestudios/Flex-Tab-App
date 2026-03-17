/**
 * POST /api/generate-workout-card
 *
 * Renders a full 1080×1920 Instagram story PNG using satori + resvg.
 *
 * Redesign v3:
 *   - Gradient backgrounds (dark & light)
 *   - Larger, bolder typography with stronger hierarchy
 *   - Per-exercise set breakdown (shown when ≤5 exercises AND set data present)
 *   - Adaptive volume bar chart (shown only when ≤4 exercises; hidden for 5+ to give room for sets)
 *   - User avatar circle in the header (when available)
 *   - Instagram safe-zone padding: header/footer clear the top/bottom UI chrome
 *   - White logo on dark theme
 *
 * Satori rule: every <div> with more than one child MUST have display:"flex".
 */

import { Request, Response } from "express";
import { storagePut } from "./storage.js";
import { INTER_REGULAR_B64, INTER_BOLD_B64 } from "./fontData.js";
import { FLEXTAB_ICON_B64, FLEXTAB_ICON_WHITE_B64 } from "../client/src/lib/flextabIconB64.js";

// ── Fonts ─────────────────────────────────────────────────────────────────────
const fontRegular   = Buffer.from(INTER_REGULAR_B64, "base64");
const fontBold      = Buffer.from(INTER_BOLD_B64,    "base64");
const fontExtraBold = fontBold;

// ── Story canvas ──────────────────────────────────────────────────────────────
const STORY_W = 1080;
const STORY_H = 1920;

// Instagram Stories safe zone:
//   Top ~13% (≈250px) and bottom ~18% (≈346px) are covered by UI chrome.
//   We push content well inside those zones.
const PAD_H   = 80;    // horizontal padding
const PAD_TOP = 280;   // top safe-zone padding
const PAD_BOT = 380;   // bottom safe-zone padding

// ── Theme palettes ────────────────────────────────────────────────────────────
const THEMES = {
  light: {
    bg:            "linear-gradient(160deg, #e8edf6 0%, #dce4f0 40%, #cdd8ec 100%)",
    tileBg:        "rgba(255,255,255,0.80)",
    divider:       "rgba(15,23,42,0.10)",
    textPrimary:   "#0f172a",
    textSecondary: "#334155",
    textMuted:     "#64748b",
    textFooter:    "#94a3b8",
    badgeBg:       "#0f172a",
    badgeText:     "#ffffff",
    pillBg:        "rgba(15,23,42,0.07)",
    pillText:      "#334155",
    setRowBg:      "rgba(15,23,42,0.04)",
    chartBar:      "#3b82f6",
    chartBarBg:    "rgba(15,23,42,0.08)",
  },
  dark: {
    bg:            "linear-gradient(160deg, #0a0f1e 0%, #0d1526 50%, #060b16 100%)",
    tileBg:        "rgba(255,255,255,0.06)",
    divider:       "rgba(255,255,255,0.08)",
    textPrimary:   "#f1f5f9",
    textSecondary: "#cbd5e1",
    textMuted:     "#64748b",
    textFooter:    "#334155",
    badgeBg:       "rgba(255,255,255,0.12)",
    badgeText:     "#f1f5f9",
    pillBg:        "rgba(255,255,255,0.07)",
    pillText:      "#94a3b8",
    setRowBg:      "rgba(255,255,255,0.03)",
    chartBar:      "#60a5fa",
    chartBarBg:    "rgba(255,255,255,0.07)",
  },
} as const;

type Theme = keyof typeof THEMES;

// ── Data interfaces ───────────────────────────────────────────────────────────
interface SetDetail {
  setNumber: number;
  reps: number;
  weight: number;
}

interface ExerciseRow {
  exercise: string;
  totalSets: number;
  bestReps: number;
  bestWeight: number;
  category: string;
  volume: number;
  sets?: SetDetail[];
  duration?: number;
  distance?: number;
  distanceUnit?: "miles" | "km";
}

interface CardData {
  date: string;
  duration?: string;
  totalSets: number;
  totalReps: number;
  volumeDisplay: string;
  exercises: ExerciseRow[];
  theme?: Theme;
  userName?: string;
  userAvatarUrl?: string;
  lifterGrade?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

// ── Build the full story element tree ────────────────────────────────────────
function buildStoryElement(data: CardData) {
  const { date, duration, totalSets, totalReps, volumeDisplay, exercises, userName, userAvatarUrl } = data;
  const C      = THEMES[data.theme === "dark" ? "dark" : "light"];
  const isDark = data.theme === "dark";

  // ── Adaptive layout ────────────────────────────────────────────────────────
  // Show expanded sets when ≤5 exercises AND set data is present
  const hasSetDetails = exercises.some(e => e.sets && e.sets.length > 0);
  const expandSets    = hasSetDetails && exercises.length <= 5;
  // Show chart only when ≤4 exercises (5+ use the full height for set rows)
  const showChart     = exercises.length <= 4;
  // Sets shown per exercise: 2 for 5 exercises, 3 for 4, 4 for ≤3
  const maxSetsPerEx  = exercises.length >= 5 ? 2 : exercises.length === 4 ? 3 : 4;

  // ── Stat tiles ─────────────────────────────────────────────────────────────
  const statTiles = [
    { value: duration || "—", label: "DURATION" },
    { value: String(totalSets),  label: "SETS"     },
    { value: String(totalReps),  label: "REPS"     },
    { value: volumeDisplay,      label: "VOLUME"   },
  ];

  const makeTile = ({ value, label }: { value: string; label: string }) => ({
    type: "div",
    props: {
      style: {
        background: C.tileBg,
        borderRadius: 24,
        paddingTop: 18, paddingBottom: 14,
        paddingLeft: 16, paddingRight: 16,
        flex: 1,
        display: "flex", flexDirection: "column", alignItems: "center",
      },
      children: [
        {
          type: "div",
          props: {
            style: { fontSize: 58, fontWeight: 800, color: C.textPrimary, lineHeight: 1, display: "flex" },
            children: value,
          },
        },
        {
          type: "div",
          props: {
            style: { fontSize: 20, fontWeight: 700, color: C.textMuted, marginTop: 8, textTransform: "uppercase", letterSpacing: "0.12em", display: "flex" },
            children: label,
          },
        },
      ],
    },
  });

  // ── Volume bar chart ───────────────────────────────────────────────────────
  const chartExercises = exercises.slice(0, 7);
  const maxVol     = Math.max(...chartExercises.map(e => e.volume || 1), 1);
  const CHART_W    = STORY_W - PAD_H * 2;
  const BAR_H      = 32;
  const BAR_GAP    = 12;
  const LABEL_W    = 320;
  const BAR_AREA_W = CHART_W - LABEL_W - 16;

  const chartRows = chartExercises.map((ex, i) => {
    const pct    = Math.max((ex.volume || 0) / maxVol, 0.02);
    const barW   = Math.round(pct * BAR_AREA_W);
    const isLast = i === chartExercises.length - 1;
    return {
      type: "div",
      props: {
        style: { display: "flex", alignItems: "center", gap: 16, marginBottom: isLast ? 0 : BAR_GAP },
        children: [
          {
            type: "div",
            props: {
              style: { width: LABEL_W, fontSize: 28, fontWeight: 700, color: C.textSecondary, display: "flex", alignItems: "center" },
              children: truncate(ex.exercise, 18),
            },
          },
          {
            type: "div",
            props: {
              style: { flex: 1, height: BAR_H, borderRadius: BAR_H / 2, background: C.chartBarBg, display: "flex", alignItems: "center", overflow: "hidden" },
              children: {
                type: "div",
                props: { style: { width: barW, height: BAR_H, borderRadius: BAR_H / 2, background: C.chartBar, display: "flex" } },
              },
            },
          },
        ],
      },
    };
  });

  // ── Exercise rows ──────────────────────────────────────────────────────────
  const visibleExercises = exercises.slice(0, expandSets ? 5 : 6);
  const moreCount        = exercises.length - visibleExercises.length;

  const exerciseRows = visibleExercises.map((ex, i) => {
    const isLast = i === visibleExercises.length - 1 && moreCount === 0;

    // Pill text (used when NOT expanding sets)
    let pillText: string;
    if (ex.category === "Cardio") {
      const parts = [
        ex.duration ? `${ex.duration} min` : "",
        ex.distance ? `${ex.distance} ${ex.distanceUnit ?? "km"}` : "",
      ].filter(Boolean);
      pillText = parts.length ? parts.join(" · ") : `${ex.totalSets} set${ex.totalSets !== 1 ? "s" : ""}`;
    } else if (ex.bestWeight > 0) {
      pillText = `Best: ${ex.bestReps} reps @ ${ex.bestWeight} lbs`;
    } else {
      pillText = `Best: ${ex.bestReps} reps`;
    }

    // Expanded set rows
    const setChildren: any[] = (expandSets && ex.sets && ex.sets.length > 0)
      ? ex.sets.slice(0, maxSetsPerEx).map((s, si) => ({
          type: "div",
          props: {
            style: {
              display: "flex", alignItems: "center", gap: 16,
              paddingTop: 8, paddingBottom: 8,
              paddingLeft: 14, paddingRight: 14,
              background: C.setRowBg, borderRadius: 12,
              marginTop: si === 0 ? 8 : 4,
            },
            children: [
              {
                type: "div",
                props: {
                  style: { fontSize: 24, fontWeight: 700, color: C.textMuted, width: 90, display: "flex" },
                  children: `Set ${s.setNumber}`,
                },
              },
              {
                type: "div",
                props: {
                  style: { flex: 1, display: "flex", alignItems: "center", gap: 8 },
                  children: [
                    { type: "div", props: { style: { fontSize: 32, fontWeight: 800, color: C.textPrimary, display: "flex" }, children: String(s.reps) } },
                    { type: "div", props: { style: { fontSize: 24, fontWeight: 600, color: C.textMuted, display: "flex" }, children: "reps" } },
                  ],
                },
              },
              ...(s.weight > 0 ? [{
                type: "div",
                props: {
                  style: { display: "flex", alignItems: "center", gap: 8 },
                  children: [
                    { type: "div", props: { style: { fontSize: 32, fontWeight: 800, color: C.textPrimary, display: "flex" }, children: String(s.weight) } },
                    { type: "div", props: { style: { fontSize: 24, fontWeight: 600, color: C.textMuted, display: "flex" }, children: "lbs" } },
                  ],
                },
              }] : []),
            ],
          },
        }))
      : [];

    return {
      type: "div",
      props: {
        style: {
          display: "flex", flexDirection: "column",
          paddingTop: 10, paddingBottom: 10,
          borderBottom: isLast ? "none" : `1px solid ${C.divider}`,
        },
        children: [
          // Header row: badge + name + pill/sets-count
          {
            type: "div",
            props: {
              style: { display: "flex", alignItems: "center", gap: 24 },
              children: [
                // Number badge
                {
                  type: "div",
                  props: {
                    style: {
                      width: 56, height: 56, borderRadius: 28,
                      background: C.badgeBg, color: C.badgeText,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 24, fontWeight: 800, flexShrink: 0,
                    },
                    children: String(i + 1),
                  },
                },
                // Exercise name
                {
                  type: "div",
                  props: {
                    style: { flex: 1, fontSize: 40, fontWeight: 800, color: C.textPrimary, display: "flex", alignItems: "center" },
                    children: truncate(ex.exercise, expandSets ? 30 : 24),
                  },
                },
                // Pill or sets-count badge
                ...(!expandSets ? [{
                  type: "div",
                  props: {
                    style: { background: C.pillBg, borderRadius: 50, paddingTop: 12, paddingBottom: 12, paddingLeft: 28, paddingRight: 28, flexShrink: 0, display: "flex", alignItems: "center" },
                    children: {
                      type: "div",
                      props: { style: { fontSize: 26, fontWeight: 700, color: C.pillText, whiteSpace: "nowrap", display: "flex" }, children: pillText },
                    },
                  },
                }] : [{
                  type: "div",
                  props: {
                    style: { background: C.pillBg, borderRadius: 50, paddingTop: 10, paddingBottom: 10, paddingLeft: 24, paddingRight: 24, flexShrink: 0, display: "flex", alignItems: "center" },
                    children: {
                      type: "div",
                      props: { style: { fontSize: 26, fontWeight: 700, color: C.pillText, whiteSpace: "nowrap", display: "flex" }, children: `${ex.totalSets} set${ex.totalSets !== 1 ? "s" : ""}` },
                    },
                  },
                }]),
              ],
            },
          },
          // Expanded set detail rows
          ...setChildren,
        ],
      },
    };
  });

  // "+N more" row
  const moreRow = moreCount > 0 ? {
    type: "div",
    props: {
      style: { display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 24 },
      children: {
        type: "div",
        props: { style: { fontSize: 26, color: C.textMuted, fontWeight: 600, display: "flex" }, children: `+${moreCount} more exercise${moreCount > 1 ? "s" : ""}` },
      },
    },
  } : null;

  // ── Avatar circle ──────────────────────────────────────────────────────────
  const avatarEl = userAvatarUrl ? {
    type: "img",
    props: { src: userAvatarUrl, width: 72, height: 72, style: { borderRadius: 36, objectFit: "cover", flexShrink: 0 } },
  } : null;

  // ── Section label helper ───────────────────────────────────────────────────
  const sectionLabel = (text: string, subtitle?: string) => ({
    type: "div",
    props: {
      style: { display: "flex", flexDirection: "column", marginBottom: 20 },
      children: [
        { type: "div", props: { style: { fontSize: 26, fontWeight: 800, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.12em", display: "flex" }, children: text } },
        ...(subtitle ? [{ type: "div", props: { style: { fontSize: 22, fontWeight: 500, color: C.textMuted, marginTop: 4, display: "flex" }, children: subtitle } }] : []),
      ],
    },
  });

  // ── Full-bleed story canvas ────────────────────────────────────────────────
  return {
    type: "div",
    props: {
      style: {
        display: "flex", flexDirection: "column",
        width: STORY_W, height: STORY_H,
        background: C.bg,
        paddingTop: PAD_TOP, paddingBottom: PAD_BOT,
        paddingLeft: PAD_H, paddingRight: PAD_H,
      },
      children: [

        // ── HEADER ──────────────────────────────────────────────────────────
        {
          type: "div",
          props: {
            style: { display: "flex", alignItems: "center", gap: 24, marginBottom: 28 },
            children: [
              // Logo — white on dark, coloured on light
              {
                type: "img",
                props: {
                  src: isDark ? FLEXTAB_ICON_WHITE_B64 : FLEXTAB_ICON_B64,
                  width: 88, height: 88,
                  style: { borderRadius: 22, flexShrink: 0 },
                },
              },
              // App name + date
              {
                type: "div",
                props: {
                  style: { display: "flex", flexDirection: "column", gap: 6, flex: 1 },
                  children: [
                    { type: "div", props: { style: { fontSize: 44, fontWeight: 800, color: C.textPrimary, display: "flex" }, children: "FlexTab" } },
                    { type: "div", props: { style: { fontSize: 28, color: C.textMuted, display: "flex" }, children: date } },
                  ],
                },
              },
              // Optional avatar
              ...(avatarEl ? [{
                type: "div",
                props: { style: { display: "flex", alignItems: "center", flexShrink: 0 }, children: [avatarEl] },
              }] : []),
            ],
          },
        },

        // ── STAT TILES 2×2 ──────────────────────────────────────────────────
        {
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 },
            children: [
              { type: "div", props: { style: { display: "flex", flexDirection: "row", gap: 20 }, children: statTiles.slice(0, 2).map(makeTile) } },
              { type: "div", props: { style: { display: "flex", flexDirection: "row", gap: 20 }, children: statTiles.slice(2, 4).map(makeTile) } },
            ],
          },
        },

        // ── VOLUME CHART (only when ≤4 exercises) ───────────────────────────
        ...(showChart ? [{
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "column", marginBottom: 24 },
            children: [
              sectionLabel("Volume by Exercise", "Total lbs lifted per exercise"),
              { type: "div", props: { style: { display: "flex", flexDirection: "column" }, children: chartRows } },
            ],
          },
        }] : []),

        // ── DIVIDER ──────────────────────────────────────────────────────────
        { type: "div", props: { style: { height: 1, background: C.divider, marginBottom: showChart ? 20 : 16, display: "flex" } } },

        // ── EXERCISES HEADING ────────────────────────────────────────────────
        sectionLabel("Exercises"),

        // ── EXERCISE ROWS ────────────────────────────────────────────────────
        {
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "column" },
            children: moreCount > 0 ? [...exerciseRows, moreRow as any] : exerciseRows,
          },
        },

        // ── FOOTER ───────────────────────────────────────────────────────────
        {
          type: "div",
          props: {
            style: {
              display: "flex", alignItems: "center", justifyContent: "center",
              paddingTop: 20, marginTop: "auto",
              borderTop: `1px solid ${C.divider}`,
            },
            children: {
              type: "div",
              props: {
                style: { fontSize: 26, color: C.textFooter, fontWeight: 600, display: "flex" },
                children: userName
                  ? `@${userName.toLowerCase().replace(/\s+/g, "")} · flextab.app`
                  : "flextab.app",
              },
            },
          },
        },

      ],
    },
  };
}

// ── HTTP handler ─────────────────────────────────────────────────────────────
export async function handleGenerateWorkoutCard(req: Request, res: Response) {
  try {
    const data: CardData = req.body;
    if (!data || !data.exercises || !Array.isArray(data.exercises)) {
      return res.status(400).json({ error: "Invalid card data" });
    }

    const { default: satori } = await import("satori");
    const { Resvg }           = await import("@resvg/resvg-js");

    const storyElement = buildStoryElement(data);

    const svg = await satori(storyElement as any, {
      width:  STORY_W,
      height: STORY_H,
      fonts: [
        { name: "Inter", data: fontRegular,   weight: 400, style: "normal" },
        { name: "Inter", data: fontBold,       weight: 700, style: "normal" },
        { name: "Inter", data: fontExtraBold,  weight: 800, style: "normal" },
      ],
    });

    const resvg     = new Resvg(svg, { fitTo: { mode: "width", value: STORY_W } });
    const pngBuffer = resvg.render().asPng();

    const dataUri = `data:image/png;base64,${Buffer.from(pngBuffer).toString("base64")}`;

    let url: string | null = null;
    let key: string | null = null;
    try {
      const r2Key = `workout-cards/${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
      const result = await storagePut(r2Key, pngBuffer, "image/png");
      url  = result.url;
      key  = r2Key;
    } catch (r2Err: any) {
      console.warn("[workout-card] R2 upload failed (non-fatal):", r2Err?.message);
    }

    return res.json({ dataUri, url, key });
  } catch (err: any) {
    console.error("[workout-card] Error:", err);
    return res.status(500).json({ error: err?.message ?? "Unknown error" });
  }
}
