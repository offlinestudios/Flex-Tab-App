/**
 * POST /api/generate-workout-card
 *
 * Renders a full 1080×1920 Instagram story/reel PNG using satori + resvg.
 *
 * Design: full-bleed — content fills the entire canvas edge-to-edge.
 * No floating card. Background is a rich dark or light gradient.
 * Content is laid out in three zones:
 *   - Top zone  (header + stat tiles)
 *   - Mid zone  (exercises list — flex:1 to fill remaining space)
 *   - Bottom zone (footer)
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

// Padding — generous breathing room, not a safe-zone constraint
const PAD_H   = 72;   // horizontal padding
const PAD_TOP = 120;  // top padding (below status bar area)
const PAD_BOT = 160;  // bottom padding (above home indicator)

// ── Theme palettes ────────────────────────────────────────────────────────────
const THEMES = {
  light: {
    bg:           "#f0f4f8",
    accentBg:     "#ffffff",
    tileBg:       "#e8edf4",
    tileAccent:   "#0f172a",
    divider:      "#dde3ec",
    textPrimary:  "#0f172a",
    textSecondary:"#475569",
    textMuted:    "#94a3b8",
    textFooter:   "#b0bec5",
    badgeBg:      "#0f172a",
    badgeText:    "#ffffff",
    pillBg:       "#e8edf4",
    pillText:     "#475569",
    logoFilter:   "none",
  },
  dark: {
    bg:           "#080d1a",
    accentBg:     "#111827",
    tileBg:       "#1a2236",
    tileAccent:   "#60a5fa",
    divider:      "#1e293b",
    textPrimary:  "#f1f5f9",
    textSecondary:"#94a3b8",
    textMuted:    "#475569",
    textFooter:   "#2d3748",
    badgeBg:      "#1e293b",
    badgeText:    "#f1f5f9",
    pillBg:       "#1a2236",
    pillText:     "#94a3b8",
    logoFilter:   "none",
  },
} as const;

type Theme = keyof typeof THEMES;

interface ExerciseRow {
  exercise: string;
  totalSets: number;
  bestReps: number;
  bestWeight: number;
  category: string;
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

// ── Build the full story element tree ────────────────────────────────────────
function buildStoryElement(data: CardData) {
  const { date, duration, totalSets, totalReps, volumeDisplay, exercises, userName } = data;
  const C = THEMES[data.theme === "dark" ? "dark" : "light"];
  const isDark = data.theme === "dark";

  const statTiles = [
    { value: duration || "—", label: "DURATION" },
    { value: String(totalSets),    label: "SETS"     },
    { value: String(totalReps),    label: "REPS"     },
    { value: volumeDisplay,        label: "VOLUME"   },
  ];

  // ── Stat tile — large, no border, just fill ──────────────────────────────
  const makeTile = ({ value, label }: { value: string; label: string }) => ({
    type: "div",
    props: {
      style: {
        background: C.tileBg,
        borderRadius: 28,
        paddingTop: 36, paddingBottom: 28,
        paddingLeft: 20, paddingRight: 20,
        flex: 1,
        display: "flex", flexDirection: "column", alignItems: "center",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              fontSize: 60, fontWeight: 800, color: C.textPrimary,
              lineHeight: 1, display: "flex",
            },
            children: value,
          },
        },
        {
          type: "div",
          props: {
            style: {
              fontSize: 20, fontWeight: 700, color: C.textMuted,
              marginTop: 12, textTransform: "uppercase",
              letterSpacing: "0.1em", display: "flex",
            },
            children: label,
          },
        },
      ],
    },
  });

  // ── Exercise rows ─────────────────────────────────────────────────────────
  // Show max 6 exercises to avoid overflow
  const visibleExercises = exercises.slice(0, 6);
  const exerciseRows = visibleExercises.map((ex, i) => {
    let pill: string;
    if (ex.category === "Cardio") {
      const parts = [
        ex.duration ? `${ex.duration} min` : "",
        ex.distance ? `${ex.distance} ${ex.distanceUnit ?? "km"}` : "",
      ].filter(Boolean);
      pill = parts.length ? parts.join(" · ") : `${ex.totalSets} set${ex.totalSets !== 1 ? "s" : ""}`;
    } else if (ex.bestWeight > 0) {
      pill = `Best: ${ex.bestReps} reps @ ${ex.bestWeight} lbs`;
    } else {
      pill = `Best: ${ex.bestReps} reps`;
    }

    const isLast = i === visibleExercises.length - 1;

    return {
      type: "div",
      props: {
        style: {
          display: "flex", alignItems: "center", gap: 24,
          paddingTop: 22, paddingBottom: 22,
          borderBottom: isLast ? "none" : `1px solid ${C.divider}`,
        },
        children: [
          // Number badge
          {
            type: "div",
            props: {
              style: {
                width: 52, height: 52, borderRadius: 26,
                background: C.badgeBg, color: C.badgeText,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, fontWeight: 800, flexShrink: 0,
              },
              children: String(i + 1),
            },
          },
          // Exercise name
          {
            type: "div",
            props: {
              style: {
                flex: 1, fontSize: 30, fontWeight: 700, color: C.textPrimary,
                display: "flex", alignItems: "center",
              },
              children: ex.exercise.length > 22 ? ex.exercise.slice(0, 21) + "…" : ex.exercise,
            },
          },
          // Pill
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
                  children: pill,
                },
              },
            },
          },
        ],
      },
    };
  });

  // If more than 6 exercises, show a "+N more" line
  const moreCount = exercises.length - visibleExercises.length;
  const moreRow = moreCount > 0 ? {
    type: "div",
    props: {
      style: {
        display: "flex", alignItems: "center", justifyContent: "center",
        paddingTop: 20,
      },
      children: {
        type: "div",
        props: {
          style: { fontSize: 24, color: C.textMuted, fontWeight: 600, display: "flex" },
          children: `+${moreCount} more exercise${moreCount > 1 ? "s" : ""}`,
        },
      },
    },
  } : null;

  // ── Full-bleed story canvas ───────────────────────────────────────────────
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

        // ── TOP: Logo + date ────────────────────────────────────────────────
        {
          type: "div",
          props: {
            style: {
              display: "flex", alignItems: "center", gap: 24,
              marginBottom: 64,
            },
            children: [
              {
                type: "img",
                props: {
                  src: isDark ? FLEXTAB_ICON_WHITE_B64 : FLEXTAB_ICON_B64,
                  width: 72, height: 72,
                  style: { borderRadius: 16 },
                },
              },
              {
                type: "div",
                props: {
                  style: { display: "flex", flexDirection: "column", gap: 6 },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: 34, fontWeight: 800,
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
            ],
          },
        },

        // ── STAT TILES: 2×2 grid ────────────────────────────────────────────
        {
          type: "div",
          props: {
            style: {
              display: "flex", flexDirection: "column", gap: 20,
              marginBottom: 60,
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

        // ── DIVIDER ─────────────────────────────────────────────────────────
        {
          type: "div",
          props: {
            style: {
              height: 1, background: C.divider,
              marginBottom: 40, display: "flex",
            },
          },
        },

        // ── EXERCISES HEADING ───────────────────────────────────────────────
        {
          type: "div",
          props: {
            style: {
              fontSize: 24, fontWeight: 800, color: C.textMuted,
              marginBottom: 8, textTransform: "uppercase",
              letterSpacing: "0.1em", display: "flex",
            },
            children: "Exercises",
          },
        },

        // ── EXERCISE ROWS (flex:1 to fill remaining space) ──────────────────
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

        // ── FOOTER ──────────────────────────────────────────────────────────
        {
          type: "div",
          props: {
            style: {
              display: "flex", alignItems: "center", justifyContent: "center",
              paddingTop: 32,
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

    // Render at 1× (already 1080px wide — no upscaling needed)
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
