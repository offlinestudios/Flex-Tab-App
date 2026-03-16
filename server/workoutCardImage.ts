/**
 * POST /api/generate-workout-card
 *
 * Renders a full 1080×1920 Instagram story/reel PNG using satori + resvg.
 * Content is centered in the story safe zone (top 260px + bottom 340px reserved
 * for Instagram's UI chrome so nothing is obscured).
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

// Safe zone: leave top 260px and bottom 340px clear of Instagram chrome
const SAFE_TOP    = 260;
const SAFE_BOTTOM = 340;
const SAFE_H      = STORY_H - SAFE_TOP - SAFE_BOTTOM; // 1320px usable

// Card sits inside the safe zone with horizontal padding
const CARD_H_PAD = 60; // px each side
const CARD_W     = STORY_W - CARD_H_PAD * 2; // 960px

// ── Theme palettes ────────────────────────────────────────────────────────────
const THEMES = {
  light: {
    // Full-bleed gradient background (light warm grey → white)
    bgTop:         "#e8edf2",
    bgBottom:      "#f8fafc",
    cardBg:        "#ffffff",
    // Stat tiles: no border, just a very subtle fill
    tileBg:        "#f1f5f9",
    pillBg:        "#f1f5f9",
    divider:       "#e2e8f0",
    textPrimary:   "#0f172a",
    textMuted:     "#94a3b8",
    textPill:      "#475569",
    textFooter:    "#cbd5e1",
    badgeBg:       "#0f172a",
    badgeText:     "#ffffff",
    shadow:        "0 8px 48px rgba(0,0,0,0.12)",
  },
  dark: {
    // Full-bleed gradient background (deep navy → near-black)
    bgTop:         "#0a0f1e",
    bgBottom:      "#0f172a",
    cardBg:        "#131c2e",
    tileBg:        "#1e293b",
    pillBg:        "#1e293b",
    divider:       "#1e293b",
    textPrimary:   "#f1f5f9",
    textMuted:     "#64748b",
    textPill:      "#94a3b8",
    textFooter:    "#334155",
    badgeBg:       "#334155",
    badgeText:     "#f1f5f9",
    shadow:        "0 8px 48px rgba(0,0,0,0.5)",
  },
} as const;

const GRADE_COLORS: Record<string, string> = {
  Novice:       "#9ca3af",
  Intermediate: "#3b82f6",
  Advanced:     "#8b5cf6",
  Elite:        "#f59e0b",
  Legend:       "#ef4444",
};

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
  const { date, duration, totalSets, totalReps, volumeDisplay, exercises, userName, lifterGrade } = data;
  const C = THEMES[data.theme === "dark" ? "dark" : "light"];

  const statTiles = [
    { value: duration || "—", label: "DURATION" },
    { value: String(totalSets),    label: "SETS"     },
    { value: String(totalReps),    label: "REPS"     },
    { value: volumeDisplay,        label: "VOLUME"   },
  ];

  // ── Stat tile (no border — just subtle background + rounded corners) ────────
  const makeTile = ({ value, label }: { value: string; label: string }) => ({
    type: "div",
    props: {
      style: {
        background: C.tileBg,
        borderRadius: 24,
        paddingTop: 28, paddingBottom: 22,
        paddingLeft: 16, paddingRight: 16,
        flex: 1,
        display: "flex", flexDirection: "column", alignItems: "center",
      },
      children: [
        {
          type: "div",
          props: {
            style: { fontSize: 52, fontWeight: 800, color: C.textPrimary, lineHeight: 1, display: "flex" },
            children: value,
          },
        },
        {
          type: "div",
          props: {
            style: {
              fontSize: 18, fontWeight: 700, color: C.textMuted,
              marginTop: 10, textTransform: "uppercase", letterSpacing: "0.08em", display: "flex",
            },
            children: label,
          },
        },
      ],
    },
  });

  // ── Exercise rows ─────────────────────────────────────────────────────────
  const exerciseRows = exercises.map((ex, i) => {
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

    const isLast = i === exercises.length - 1;

    return {
      type: "div",
      props: {
        style: {
          display: "flex", alignItems: "center", gap: 20,
          paddingTop: 18, paddingBottom: 18,
          borderBottom: isLast ? "none" : `1px solid ${C.divider}`,
        },
        children: [
          // Number badge
          {
            type: "div",
            props: {
              style: {
                width: 46, height: 46, borderRadius: 23,
                background: C.badgeBg, color: C.badgeText,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, fontWeight: 800, flexShrink: 0,
              },
              children: String(i + 1),
            },
          },
          // Exercise name
          {
            type: "div",
            props: {
              style: {
                flex: 1, fontSize: 26, fontWeight: 700, color: C.textPrimary,
                overflow: "hidden", display: "flex", alignItems: "center",
              },
              children: ex.exercise.length > 24 ? ex.exercise.slice(0, 23) + "…" : ex.exercise,
            },
          },
          // Pill
          {
            type: "div",
            props: {
              style: {
                background: C.pillBg, borderRadius: 50,
                paddingTop: 8, paddingBottom: 8, paddingLeft: 20, paddingRight: 20,
                flexShrink: 0, display: "flex", alignItems: "center",
              },
              children: {
                type: "div",
                props: {
                  style: {
                    fontSize: 20, fontWeight: 700, color: C.textPill,
                    whiteSpace: "nowrap", display: "flex", alignItems: "center",
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

  // ── Header ────────────────────────────────────────────────────────────────
  const headerElement = {
    type: "div",
    props: {
      style: {
        display: "flex", alignItems: "center",
        marginBottom: 36,
        paddingBottom: 32,
        borderBottom: `1px solid ${C.divider}`,
      },
      children: {
        type: "div",
        props: {
          style: { display: "flex", alignItems: "center", gap: 20 },
          children: [
            {
              type: "div",
              props: {
                style: {
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 72, height: 72, borderRadius: 18, background: "transparent", flexShrink: 0,
                },
                children: {
                  type: "img",
                  props: {
                    src: data.theme === "dark" ? FLEXTAB_ICON_WHITE_B64 : FLEXTAB_ICON_B64,
                    width: 64, height: 64,
                    style: { borderRadius: 14 },
                  },
                },
              },
            },
            {
              type: "div",
              props: {
                style: { display: "flex", flexDirection: "column", gap: 4 },
                children: [
                  {
                    type: "div",
                    props: {
                      style: { fontSize: 28, fontWeight: 800, color: C.textPrimary, display: "flex" },
                      children: "FlexTab",
                    },
                  },
                  {
                    type: "div",
                    props: {
                      style: { fontSize: 22, color: C.textMuted, display: "flex" },
                      children: date,
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    },
  };

  // ── Footer ────────────────────────────────────────────────────────────────
  const footerText = userName
    ? `@${userName.toLowerCase().replace(/\s+/g, "")} · flextab.app`
    : "flextab.app";

  const footerElement = {
    type: "div",
    props: {
      style: {
        marginTop: 28, paddingTop: 24,
        borderTop: `1px solid ${C.divider}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      },
      children: {
        type: "div",
        props: {
          style: { fontSize: 22, color: C.textFooter, display: "flex" },
          children: footerText,
        },
      },
    },
  };

  // ── Card (white/dark rounded panel) ──────────────────────────────────────
  const cardElement = {
    type: "div",
    props: {
      style: {
        display: "flex", flexDirection: "column",
        background: C.cardBg,
        borderRadius: 40,
        paddingTop: 48, paddingBottom: 40,
        paddingLeft: 48, paddingRight: 48,
        width: CARD_W,
        boxShadow: C.shadow,
      },
      children: [
        headerElement,

        // Stat tiles 2×2
        {
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 },
            children: [
              {
                type: "div",
                props: {
                  style: { display: "flex", flexDirection: "row", gap: 16 },
                  children: statTiles.slice(0, 2).map(makeTile),
                },
              },
              {
                type: "div",
                props: {
                  style: { display: "flex", flexDirection: "row", gap: 16 },
                  children: statTiles.slice(2, 4).map(makeTile),
                },
              },
            ],
          },
        },

        // Divider
        {
          type: "div",
          props: {
            style: { height: 1, background: C.divider, marginBottom: 28, display: "flex" },
          },
        },

        // Exercises heading
        {
          type: "div",
          props: {
            style: {
              fontSize: 22, fontWeight: 800, color: C.textPrimary,
              marginBottom: 4, textTransform: "uppercase",
              letterSpacing: "0.08em", display: "flex",
            },
            children: "Exercises",
          },
        },

        // Exercise rows
        {
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "column" },
            children: exerciseRows,
          },
        },

        footerElement,
      ],
    },
  };

  // ── Full story canvas — gradient background + centered card ──────────────
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        width: STORY_W,
        height: STORY_H,
        // Simulate a vertical gradient via two nested divs (satori doesn't support CSS gradients)
        background: C.bgBottom,
        alignItems: "center",
        justifyContent: "center",
        // Pad top/bottom to respect safe zone — card will be vertically centered in safe zone
        paddingTop: SAFE_TOP,
        paddingBottom: SAFE_BOTTOM,
      },
      children: cardElement,
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
