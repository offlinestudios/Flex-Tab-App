/**
 * POST /api/generate-workout-card
 *
 * Renders a full 1080×1920 Instagram story/reel PNG using satori + resvg.
 *
 * Redesign v2:
 *   - Gradient backgrounds (dark & light)
 *   - Larger, bolder typography with stronger hierarchy
 *   - Per-exercise set breakdown (all sets shown when ≤5 exercises; best-set pill for 6+)
 *   - Per-exercise volume bar chart below the stat tiles
 *   - User avatar circle in the header
 *   - Lifter grade badge in the header
 *
 * Layout zones:
 *   - Header  (logo + branding + avatar + grade)
 *   - Stats   (4 tiles in 2×2 grid)
 *   - Chart   (horizontal volume bars per exercise)
 *   - Exercises list (expanded sets or best-set pill)
 *   - Footer
 *
 * Satori rule: every <div> with more than one child MUST have display:"flex".
 */

import { Request, Response } from "express";
import { storagePut } from "./storage.js";
import { INTER_REGULAR_B64, INTER_BOLD_B64 } from "./fontData.js";
import { FLEXTAB_ICON_B64, FLEXTAB_ICON_WHITE_B64 } from "../client/src/lib/flextabIconB64.js";

// ── Fonts ─────────────────────────────────────────────────────────────────────
const fontRegular   = Buffer.from(INTER_REGULAR_B64,   "base64");
const fontBold      = Buffer.from(INTER_BOLD_B64,       "base64");
const fontExtraBold = fontBold;

// ── Story canvas ──────────────────────────────────────────────────────────────
const STORY_W = 1080;
const STORY_H = 1920;

const PAD_H   = 60;
const PAD_TOP = 68;
const PAD_BOT = 44;

// ── Theme palettes ────────────────────────────────────────────────────────────
const THEMES = {
  light: {
    // Gradient expressed as a CSS linear-gradient string (satori supports it)
    bg:            "linear-gradient(160deg, #e8edf6 0%, #dce4f0 40%, #cdd8ec 100%)",
    accentBg:      "rgba(255,255,255,0.70)",
    tileBg:        "rgba(255,255,255,0.80)",
    tileAccent:    "#0f172a",
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
    gradeColors: {
      Novice:       "#6b7280",
      Intermediate: "#3b82f6",
      Advanced:     "#8b5cf6",
      Elite:        "#f59e0b",
      Legend:       "#ef4444",
    } as Record<string, string>,
    logoFilter: "none",
  },
  dark: {
    bg:            "linear-gradient(160deg, #0a0f1e 0%, #0d1526 50%, #060b16 100%)",
    accentBg:      "rgba(255,255,255,0.04)",
    tileBg:        "rgba(255,255,255,0.06)",
    tileAccent:    "#60a5fa",
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
    gradeColors: {
      Novice:       "#9ca3af",
      Intermediate: "#60a5fa",
      Advanced:     "#a78bfa",
      Elite:        "#fbbf24",
      Legend:       "#f87171",
    } as Record<string, string>,
    logoFilter: "none",
  },
} as const;

type Theme = keyof typeof THEMES;

// ── Individual set within an exercise ─────────────────────────────────────────
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
  volume: number;          // totalSets × bestReps × bestWeight (approx)
  sets?: SetDetail[];      // individual set breakdown (optional)
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
  const { date, duration, totalSets, totalReps, volumeDisplay, exercises, userName, userAvatarUrl, lifterGrade } = data;
  const C = THEMES[data.theme === "dark" ? "dark" : "light"];
  const isDark = data.theme === "dark";

  // ── Determine display mode ─────────────────────────────────────────────────
  // Show expanded sets when ≤5 exercises AND sets data is present
  const hasSetDetails = exercises.some(e => e.sets && e.sets.length > 0);
  const expandSets    = hasSetDetails && exercises.length <= 5;

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
        borderRadius: 28,
        paddingTop: 40, paddingBottom: 32,
        paddingLeft: 20, paddingRight: 20,
        flex: 1,
        display: "flex", flexDirection: "column", alignItems: "center",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              fontSize: 68, fontWeight: 800, color: C.textPrimary,
              lineHeight: 1, display: "flex",
            },
            children: value,
          },
        },
        {
          type: "div",
          props: {
            style: {
              fontSize: 22, fontWeight: 700, color: C.textMuted,
              marginTop: 14, textTransform: "uppercase",
              letterSpacing: "0.12em", display: "flex",
            },
            children: label,
          },
        },
      ],
    },
  });

  // ── Volume bar chart ───────────────────────────────────────────────────────
  // Show up to 7 exercises; compute volumes
  const chartExercises = exercises.slice(0, 7);
  const maxVol = Math.max(...chartExercises.map(e => e.volume || 1), 1);
  const CHART_W = STORY_W - PAD_H * 2;   // full inner width
  const BAR_H   = 44;
  const BAR_GAP = 18;
  const LABEL_W = 320;
  const BAR_AREA_W = CHART_W - LABEL_W - 16;

  const chartRows = chartExercises.map((ex, i) => {
    const pct   = Math.max((ex.volume || 0) / maxVol, 0.02);
    const barW  = Math.round(pct * BAR_AREA_W);
    const isLast = i === chartExercises.length - 1;

    return {
      type: "div",
      props: {
        style: {
          display: "flex", alignItems: "center", gap: 16,
          marginBottom: isLast ? 0 : BAR_GAP,
        },
        children: [
          // Exercise label
          {
            type: "div",
            props: {
              style: {
                width: LABEL_W, fontSize: 24, fontWeight: 700,
                color: C.textSecondary, display: "flex", alignItems: "center",
              },
              children: truncate(ex.exercise, 18),
            },
          },
          // Bar track
          {
            type: "div",
            props: {
              style: {
                flex: 1, height: BAR_H, borderRadius: BAR_H / 2,
                background: C.chartBarBg, display: "flex", alignItems: "center",
                overflow: "hidden",
              },
              children: {
                type: "div",
                props: {
                  style: {
                    width: barW, height: BAR_H, borderRadius: BAR_H / 2,
                    background: C.chartBar, display: "flex",
                  },
                },
              },
            },
          },
        ],
      },
    };
  });

  // ── Exercise rows ──────────────────────────────────────────────────────────
  const visibleExercises = exercises.slice(0, expandSets ? 5 : 6);
  const moreCount = exercises.length - visibleExercises.length;

  const exerciseRows = visibleExercises.map((ex, i) => {
    const isLast = i === visibleExercises.length - 1 && moreCount === 0;

    // Pill text (fallback when no expanded sets)
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

    // Build individual set rows (only when expandSets is true)
    const setChildren: any[] = (expandSets && ex.sets && ex.sets.length > 0)
      ? ex.sets.map((s, si) => ({
          type: "div",
          props: {
            style: {
              display: "flex", alignItems: "center", gap: 16,
              paddingTop: 10, paddingBottom: 10,
              paddingLeft: 16, paddingRight: 16,
              background: C.setRowBg,
              borderRadius: 14,
              marginTop: si === 0 ? 12 : 6,
            },
            children: [
              // Set number chip
              {
                type: "div",
                props: {
                  style: {
                    fontSize: 20, fontWeight: 700, color: C.textMuted,
                    width: 80, display: "flex",
                  },
                  children: `Set ${s.setNumber}`,
                },
              },
              // Reps
              {
                type: "div",
                props: {
                  style: { flex: 1, display: "flex", alignItems: "center", gap: 8 },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: { fontSize: 26, fontWeight: 800, color: C.textPrimary, display: "flex" },
                        children: String(s.reps),
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: { fontSize: 20, fontWeight: 600, color: C.textMuted, display: "flex" },
                        children: "reps",
                      },
                    },
                  ],
                },
              },
              // Weight
              ...(s.weight > 0 ? [{
                type: "div",
                props: {
                  style: { display: "flex", alignItems: "center", gap: 8 },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: { fontSize: 26, fontWeight: 800, color: C.textPrimary, display: "flex" },
                        children: String(s.weight),
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: { fontSize: 20, fontWeight: 600, color: C.textMuted, display: "flex" },
                        children: "lbs",
                      },
                    },
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
          paddingTop: 24, paddingBottom: 24,
          borderBottom: isLast ? "none" : `1px solid ${C.divider}`,
        },
        children: [
          // Header row: badge + name + pill
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
                    style: {
                      flex: 1, fontSize: 34, fontWeight: 800, color: C.textPrimary,
                      display: "flex", alignItems: "center",
                    },
                    children: truncate(ex.exercise, expandSets ? 28 : 22),
                  },
                },
                // Pill (only when NOT expanding sets)
                ...(!expandSets ? [{
                  type: "div",
                  props: {
                    style: {
                      background: C.pillBg, borderRadius: 50,
                      paddingTop: 12, paddingBottom: 12,
                      paddingLeft: 28, paddingRight: 28,
                      flexShrink: 0, display: "flex", alignItems: "center",
                    },
                    children: {
                      type: "div",
                      props: {
                        style: {
                          fontSize: 24, fontWeight: 700, color: C.pillText,
                          whiteSpace: "nowrap", display: "flex",
                        },
                        children: pillText,
                      },
                    },
                  },
                }] : [
                  // Sets count badge when expanded
                  {
                    type: "div",
                    props: {
                      style: {
                        background: C.pillBg, borderRadius: 50,
                        paddingTop: 10, paddingBottom: 10,
                        paddingLeft: 24, paddingRight: 24,
                        flexShrink: 0, display: "flex", alignItems: "center",
                      },
                      children: {
                        type: "div",
                        props: {
                          style: {
                            fontSize: 22, fontWeight: 700, color: C.pillText,
                            whiteSpace: "nowrap", display: "flex",
                          },
                          children: `${ex.totalSets} set${ex.totalSets !== 1 ? "s" : ""}`,
                        },
                      },
                    },
                  },
                ]),
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
      style: {
        display: "flex", alignItems: "center", justifyContent: "center",
        paddingTop: 24,
      },
      children: {
        type: "div",
        props: {
          style: { fontSize: 26, color: C.textMuted, fontWeight: 600, display: "flex" },
          children: `+${moreCount} more exercise${moreCount > 1 ? "s" : ""}`,
        },
      },
    },
  } : null;

  // ── Grade badge ────────────────────────────────────────────────────────────
  const gradeColor = lifterGrade
    ? (C.gradeColors[lifterGrade] ?? C.textMuted)
    : null;

  const gradeBadge = lifterGrade && gradeColor ? {
    type: "div",
    props: {
      style: {
        display: "flex", alignItems: "center", gap: 10,
        background: C.pillBg, borderRadius: 50,
        paddingTop: 10, paddingBottom: 10,
        paddingLeft: 22, paddingRight: 22,
      },
      children: [
        // Colored dot
        {
          type: "div",
          props: {
            style: {
              width: 14, height: 14, borderRadius: 7,
              background: gradeColor, display: "flex", flexShrink: 0,
            },
          },
        },
        {
          type: "div",
          props: {
            style: {
              fontSize: 22, fontWeight: 700, color: gradeColor,
              display: "flex",
            },
            children: lifterGrade,
          },
        },
      ],
    },
  } : null;

  // ── Avatar circle ──────────────────────────────────────────────────────────
  const avatarEl = userAvatarUrl ? {
    type: "img",
    props: {
      src: userAvatarUrl,
      width: 72, height: 72,
      style: { borderRadius: 36, objectFit: "cover", flexShrink: 0 },
    },
  } : null;

  // ── Section label helper ───────────────────────────────────────────────────
  const sectionLabel = (text: string) => ({
    type: "div",
    props: {
      style: {
        fontSize: 22, fontWeight: 800, color: C.textMuted,
        marginBottom: 20, textTransform: "uppercase",
        letterSpacing: "0.12em", display: "flex",
      },
      children: text,
    },
  });

  // ── Full-bleed story canvas ────────────────────────────────────────────────
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        width: STORY_W,
        height: STORY_H,
        background: C.bg,
        paddingTop: PAD_TOP,
        paddingBottom: PAD_BOT,
        paddingLeft: PAD_H,
        paddingRight: PAD_H,
      },
      children: [

        // ── HEADER ──────────────────────────────────────────────────────────
        {
          type: "div",
          props: {
            style: {
              display: "flex", alignItems: "center", gap: 24,
              marginBottom: 56,
            },
            children: [
              // Logo
              {
                type: "img",
                props: {
                  src: isDark ? FLEXTAB_ICON_WHITE_B64 : FLEXTAB_ICON_B64,
                  width: 80, height: 80,
                  style: { borderRadius: 20, flexShrink: 0 },
                },
              },
              // App name + date
              {
                type: "div",
                props: {
                  style: { display: "flex", flexDirection: "column", gap: 6, flex: 1 },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: 38, fontWeight: 800,
                          color: C.textPrimary, display: "flex",
                        },
                        children: "FlexTab",
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: 26, color: C.textMuted, display: "flex",
                        },
                        children: date,
                      },
                    },
                  ],
                },
              },
              // Right side: grade badge + optional avatar
              {
                type: "div",
                props: {
                  style: { display: "flex", alignItems: "center", gap: 16, flexShrink: 0 },
                  children: [
                    ...(gradeBadge ? [gradeBadge] : []),
                    ...(avatarEl   ? [avatarEl]   : []),
                  ],
                },
              },
            ],
          },
        },

        // ── STAT TILES 2×2 ──────────────────────────────────────────────────
        {
          type: "div",
          props: {
            style: {
              display: "flex", flexDirection: "column", gap: 20,
              marginBottom: 56,
            },
            children: [
              {
                type: "div",
                props: {
                  style: { display: "flex", flexDirection: "row", gap: 20 },
                  children: statTiles.slice(0, 2).map(makeTile),
                },
              },
              {
                type: "div",
                props: {
                  style: { display: "flex", flexDirection: "row", gap: 20 },
                  children: statTiles.slice(2, 4).map(makeTile),
                },
              },
            ],
          },
        },

        // ── VOLUME CHART ─────────────────────────────────────────────────────
        {
          type: "div",
          props: {
            style: {
              display: "flex", flexDirection: "column",
              marginBottom: 52,
            },
            children: [
              sectionLabel("Volume by Exercise"),
              {
                type: "div",
                props: {
                  style: { display: "flex", flexDirection: "column" },
                  children: chartRows,
                },
              },
            ],
          },
        },

        // ── DIVIDER ──────────────────────────────────────────────────────────
        {
          type: "div",
          props: {
            style: {
              height: 1, background: C.divider,
              marginBottom: 36, display: "flex",
            },
          },
        },

        // ── EXERCISES HEADING ────────────────────────────────────────────────
        sectionLabel("Exercises"),

        // ── EXERCISE ROWS (flex:1) ───────────────────────────────────────────
        {
          type: "div",
          props: {
            style: {
              display: "flex", flexDirection: "column",
              flex: 1,
            },
            children: moreCount > 0
              ? [...exerciseRows, moreRow as any]
              : exerciseRows,
          },
        },

        // ── FOOTER ───────────────────────────────────────────────────────────
        {
          type: "div",
          props: {
            style: {
              display: "flex", alignItems: "center", justifyContent: "center",
              paddingTop: 28,
              borderTop: `1px solid ${C.divider}`,
            },
            children: {
              type: "div",
              props: {
                style: {
                  fontSize: 24, color: C.textFooter,
                  fontWeight: 600, display: "flex",
                },
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
