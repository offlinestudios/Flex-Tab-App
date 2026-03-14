/**
 * POST /api/generate-workout-card
 *
 * Accepts workout data as JSON, renders a PNG workout card using satori + resvg,
 * uploads it to R2, and returns the public URL.
 *
 * Satori rule: every <div> that has more than one child MUST have an explicit
 * display property set to "flex", "contents", or "none". Block layout is not
 * supported. All divs in this file are audited to comply with this requirement.
 */

import { Request, Response } from "express";
import { storagePut } from "./storage.js";
import { INTER_REGULAR_B64, INTER_BOLD_B64 } from "./fontData.js";
import { FLEXTAB_ICON_B64 } from "../client/src/lib/flextabIconB64.js";

// ── Fonts (decoded from embedded base64 — no file system access needed) ──────
const fontRegular = Buffer.from(INTER_REGULAR_B64, "base64");
const fontBold = Buffer.from(INTER_BOLD_B64, "base64");
const fontExtraBold = fontBold; // Use bold as fallback for extra-bold

// ── FlexTab logo ─────────────────────────────────────────────────────────────
const LOGO_DATA_URI = FLEXTAB_ICON_B64;

// ── Theme palettes ────────────────────────────────────────────────────────────
const THEMES = {
  light: {
    outerBg:      "#f1f5f9",  // opaque outer canvas (no transparency)
    cardBg:        "#ffffff",
    tileBg:        "#f8fafc",
    pillBg:        "#f1f5f9",
    divider:       "#f1f5f9",
    textPrimary:   "#0f172a",
    textMuted:     "#94a3b8",
    textPill:      "#475569",
    textFooter:    "#cbd5e1",
    badgeBg:       "#0f172a",
    badgeText:     "#ffffff",
    gradeBg:       "#f1f5f9",
    gradeText:     "#475569",
    headerDivider: "#e2e8f0",
  },
  dark: {
    outerBg:      "#0f172a",  // opaque outer canvas (no transparency)
    cardBg:        "#0f172a",
    tileBg:        "#1e293b",
    pillBg:        "#1e293b",
    divider:       "#1e293b",
    textPrimary:   "#f1f5f9",
    textMuted:     "#64748b",
    textPill:      "#94a3b8",
    textFooter:    "#94a3b8",
    badgeBg:       "#334155",
    badgeText:     "#f1f5f9",
    gradeBg:       "#1e293b",
    gradeText:     "#94a3b8",
    headerDivider: "#1e293b",
  },
} as const;

// Grade accent colours (same in both themes — they're vivid enough)
const GRADE_COLORS: Record<string, string> = {
  Novice:       "#9ca3af",
  Intermediate: "#3b82f6",
  Advanced:     "#8b5cf6",
  Elite:        "#f59e0b",
  Legend:       "#ef4444",
};

type Theme = keyof typeof THEMES;

// ── Types ────────────────────────────────────────────────────────────────────
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
  date: string;           // e.g. "Monday, Mar 9, 2026"
  duration?: string;      // e.g. "36:12"
  totalSets: number;
  totalReps: number;
  volumeDisplay: string;  // e.g. "13.8k"
  exercises: ExerciseRow[];
  theme?: Theme;          // "light" (default) | "dark"
  userName?: string;      // e.g. "Alex Johnson"
  lifterGrade?: string;   // e.g. "Advanced"
}

// ── Build the satori element tree ────────────────────────────────────────────
function buildCardElement(data: CardData) {
  const { date, duration, totalSets, totalReps, volumeDisplay, exercises, userName, lifterGrade } = data;
  const C = THEMES[data.theme === "dark" ? "dark" : "light"];
  const gradeColor = lifterGrade ? (GRADE_COLORS[lifterGrade] ?? C.gradeText) : C.gradeText;

  const statTiles = [
    { value: duration || "—", label: "DURATION" },
    { value: String(totalSets), label: "SETS" },
    { value: String(totalReps), label: "REPS" },
    { value: volumeDisplay, label: "VOLUME" },
  ];

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
          display: "flex",
          alignItems: "center",
          gap: 10,
          paddingTop: 9,
          paddingBottom: 9,
          borderBottom: isLast ? "none" : `1px solid ${C.divider}`,
        },
        children: [
          // Number badge
          {
            type: "div",
            props: {
              style: {
                width: 26,
                height: 26,
                borderRadius: 13,
                background: C.badgeBg,
                color: C.badgeText,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 800,
                flexShrink: 0,
              },
              children: String(i + 1),
            },
          },
          // Exercise name
          {
            type: "div",
            props: {
              style: {
                flex: 1,
                fontSize: 13,
                fontWeight: 700,
                color: C.textPrimary,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
              },
              children: ex.exercise.length > 22 ? ex.exercise.slice(0, 21) + "…" : ex.exercise,
            },
          },
          // Pill
          {
            type: "div",
            props: {
              style: {
                background: C.pillBg,
                borderRadius: 50,
                paddingTop: 4,
                paddingBottom: 4,
                paddingLeft: 10,
                paddingRight: 10,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
              },
              children: {
                type: "div",
                props: {
                  style: {
                    fontSize: 11,
                    fontWeight: 700,
                    color: C.textPill,
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
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

  // Helper to build a stat tile
  const makeTile = ({ value, label }: { value: string; label: string }) => ({
    type: "div",
    props: {
      style: {
        background: C.tileBg,
        borderRadius: 14,
        padding: "14px 8px 10px",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      },
      children: [
        {
          type: "div",
          props: {
            style: { fontSize: 28, fontWeight: 800, color: C.textPrimary, lineHeight: 1, display: "flex" },
            children: value,
          },
        },
        {
          type: "div",
          props: {
            style: { fontSize: 10, fontWeight: 700, color: C.textMuted, marginTop: 5, textTransform: "uppercase", letterSpacing: "0.07em", display: "flex" },
            children: label,
          },
        },
      ],
    },
  });

  // ── Grade badge pill ──────────────────────────────────────────────────────
  const gradeBadge = lifterGrade
    ? {
        type: "div",
        props: {
          style: {
            background: C.gradeBg,
            borderRadius: 50,
            paddingTop: 3,
            paddingBottom: 3,
            paddingLeft: 9,
            paddingRight: 9,
            display: "flex",
            alignItems: "center",
            gap: 5,
            flexShrink: 0,
          },
          children: [
            {
              type: "div",
              props: {
                style: {
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  background: gradeColor,
                  display: "flex",
                  flexShrink: 0,
                },
              },
            },
            {
              type: "div",
              props: {
                style: {
                  fontSize: 10,
                  fontWeight: 700,
                  color: gradeColor,
                  display: "flex",
                  letterSpacing: "0.03em",
                },
                children: lifterGrade.toUpperCase(),
              },
            },
          ],
        },
      }
    : null;

  // ── Unified header ────────────────────────────────────────────────────────
  // Layout:
  //   [Logo]  [FlexTab (bold) · date (muted)]          [WORKOUT]
  //           [User name (large)]  [grade badge]
  //
  // The logo is vertically centred against the two text lines on the left.
  // "WORKOUT" sits at the top-right, aligned to the first text line.
  const headerElement = {
    type: "div",
    props: {
      style: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: 18,
        paddingBottom: 16,
        borderBottom: `1px solid ${C.headerDivider}`,
      },
      children: [
        // Left: logo + text block
        {
          type: "div",
          props: {
            style: { display: "flex", alignItems: "flex-start", gap: 11 },
            children: [
              // Logo — vertically centred against the two-line text block
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: data.theme === "dark" ? "#ffffff" : "transparent",
                    marginTop: 2,
                    flexShrink: 0,
                  },
                  children: LOGO_DATA_URI
                    ? {
                        type: "img",
                        props: {
                          src: LOGO_DATA_URI,
                          width: 36,
                          height: 36,
                          style: { borderRadius: 8 },
                        },
                      }
                    : {
                        type: "div",
                        props: {
                          style: {
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            background: C.badgeBg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: C.badgeText,
                            fontSize: 16,
                            fontWeight: 800,
                          },
                          children: "F",
                        },
                      },
                },
              },
              // Text block: app name + date row, then name + grade row
              {
                type: "div",
                props: {
                  style: { display: "flex", flexDirection: "column", gap: 4 },
                  children: [
                    // Row 1: "FlexTab" · date
                    {
                      type: "div",
                      props: {
                        style: { display: "flex", alignItems: "baseline", gap: 7 },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: { fontSize: 14, fontWeight: 800, color: C.textPrimary, display: "flex", lineHeight: 1 },
                              children: "FlexTab",
                            },
                          },
                          {
                            type: "div",
                            props: {
                              style: { fontSize: 11, color: C.textMuted, display: "flex", lineHeight: 1 },
                              children: date,
                            },
                          },
                        ],
                      },
                    },
                    // Row 2: user name (large) + grade badge
                    {
                      type: "div",
                      props: {
                        style: { display: "flex", alignItems: "center", gap: 8 },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: { fontSize: 20, fontWeight: 800, color: C.textPrimary, display: "flex", lineHeight: 1.1 },
                              children: userName || "Athlete",
                            },
                          },
                          ...(gradeBadge ? [gradeBadge] : []),
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        // Right: "WORKOUT" label — top-aligned
        {
          type: "div",
          props: {
            style: {
              fontSize: 10,
              fontWeight: 700,
              color: C.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              display: "flex",
              marginTop: 4,
            },
            children: "Workout",
          },
        },
      ],
    },
  };

  // ── Root card element ─────────────────────────────────────────────────────
  // The outermost div fills the entire satori canvas with an opaque background
  // so that Instagram (and any other app) never shows a black fill behind the card.
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        width: "100%",
        height: "100%",
        background: C.outerBg,
        alignItems: "center",
        justifyContent: "center",
      },
      children: {
        type: "div",
        props: {
          style: {
            display: "flex",
            flexDirection: "column",
            background: C.cardBg,
            borderRadius: 20,
            padding: "20px 20px 16px",
            width: 390,
            fontFamily: "Inter",
          },
          children: [
            // ── Unified header ───────────────────────────────────────────────
            headerElement,

            // ── Stat tiles 2×2 (two explicit rows — satori does not support flexWrap) ──
            {
              type: "div",
              props: {
                style: {
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  marginBottom: 16,
                },
                children: [
                  // Row 1: Duration + Sets
                  {
                    type: "div",
                    props: {
                      style: { display: "flex", flexDirection: "row", gap: 8 },
                      children: statTiles.slice(0, 2).map(makeTile),
                    },
                  },
                  // Row 2: Reps + Volume
                  {
                    type: "div",
                    props: {
                      style: { display: "flex", flexDirection: "row", gap: 8 },
                      children: statTiles.slice(2, 4).map(makeTile),
                    },
                  },
                ],
              },
            },

            // ── Divider ──────────────────────────────────────────────────────────
            {
              type: "div",
              props: {
                style: { height: 1, background: C.divider, marginBottom: 14, display: "flex" },
              },
            },

            // ── Exercises heading ────────────────────────────────────────────────
            {
              type: "div",
              props: {
                style: { fontSize: 13, fontWeight: 800, color: C.textPrimary, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em", display: "flex" },
                children: "Exercises",
              },
            },

            // ── Exercise rows container ──────────────────────────────────────────
            {
              type: "div",
              props: {
                style: { display: "flex", flexDirection: "column" },
                children: exerciseRows,
              },
            },

            // ── Footer ───────────────────────────────────────────────────────────
            {
              type: "div",
              props: {
                style: {
                  marginTop: 14,
                  paddingTop: 12,
                  borderTop: `1px solid ${C.divider}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                },
                children: {
                  type: "div",
                  props: {
                    style: { fontSize: 11, color: C.textFooter, display: "flex" },
                    children: "flextab.app",
                  },
                },
              },
            },
          ],
        },
      },
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

    // Lazy-load satori and resvg to avoid issues at module load time
    const { default: satori } = await import("satori");
    const { Resvg } = await import("@resvg/resvg-js");

    const cardElement = buildCardElement(data);

    // Compute card height dynamically: header + tiles + divider + exercises + footer
    const exerciseHeight = Math.max(data.exercises.length, 1) * 47;
    const cardHeight = 96 + 160 + 20 + 30 + exerciseHeight + 50 + 40;

    const svg = await satori(cardElement as any, {
      width: 390,
      height: cardHeight,
      fonts: [
        { name: "Inter", data: fontRegular, weight: 400, style: "normal" },
        { name: "Inter", data: fontBold, weight: 700, style: "normal" },
        { name: "Inter", data: fontExtraBold, weight: 800, style: "normal" },
      ],
    });

    const resvg = new Resvg(svg, {
      fitTo: { mode: "width", value: 780 }, // 2× for retina
    });
    const pngBuffer = resvg.render().asPng();

    // Convert to base64 data URI for client-side use (avoids cross-origin fetch issues)
    const dataUri = `data:image/png;base64,${Buffer.from(pngBuffer).toString('base64')}`;

    // Also upload to R2 for the community feed flow (best-effort — don't fail if R2 is unavailable)
    let url: string | null = null;
    let key: string | null = null;
    try {
      const r2Key = `workout-cards/${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
      const result = await storagePut(r2Key, pngBuffer, "image/png");
      url = result.url;
      key = r2Key;
    } catch (r2Err: any) {
      console.warn('[workout-card] R2 upload failed (non-fatal):', r2Err?.message);
    }

    return res.json({ url, key, dataUri });
  } catch (err: any) {
    console.error("[workout-card] generation error:", err);
    return res.status(500).json({ error: "Failed to generate card", detail: err?.message });
  }
}
