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
}

// ── Build the satori element tree ────────────────────────────────────────────
function buildCardElement(data: CardData) {
  const { date, duration, totalSets, totalReps, volumeDisplay, exercises } = data;

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
          display: "flex",          // ✓ multi-child row
          alignItems: "center",
          gap: 10,
          paddingTop: 9,
          paddingBottom: 9,
          borderBottom: isLast ? "none" : "1px solid #f1f5f9",
        },
        children: [
          // Number badge — single text child, display:flex for centering
          {
            type: "div",
            props: {
              style: {
                width: 26,
                height: 26,
                borderRadius: 13,
                background: "#0f172a",
                color: "#fff",
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
          // Exercise name — single text child
          {
            type: "div",
            props: {
              style: {
                flex: 1,
                fontSize: 13,
                fontWeight: 700,
                color: "#0f172a",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
              },
              children: ex.exercise.length > 22 ? ex.exercise.slice(0, 21) + "…" : ex.exercise,
            },
          },
          // Pill container — single child div inside, display:flex required
          {
            type: "div",
            props: {
              style: {
                background: "#f1f5f9",
                borderRadius: 50,
                paddingTop: 4,
                paddingBottom: 4,
                paddingLeft: 10,
                paddingRight: 10,
                flexShrink: 0,
                display: "flex",       // ✓ required even for single child
                alignItems: "center",
              },
              children: {
                type: "div",
                props: {
                  style: {
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#475569",
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

  return {
    type: "div",
    props: {
      style: {
        display: "flex",              // ✓ root multi-child column
        flexDirection: "column",
        background: "#ffffff",
        borderRadius: 20,
        padding: "20px 20px 16px",
        width: 390,
        fontFamily: "Inter",
      },
      children: [
        // ── Header ──────────────────────────────────────────────────────────
        {
          type: "div",
          props: {
            style: {
              display: "flex",        // ✓ multi-child row
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            },
            children: [
              {
                type: "div",
                props: {
                  style: { display: "flex", alignItems: "center", gap: 10 }, // ✓
                  children: [
                    LOGO_DATA_URI
                      ? {
                          type: "img",
                          props: {
                            src: LOGO_DATA_URI,
                            width: 32,
                            height: 32,
                            style: { borderRadius: 8 },
                          },
                        }
                      : {
                          type: "div",
                          props: {
                            style: {
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: "#0f172a",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontSize: 14,
                              fontWeight: 800,
                            },
                            children: "F",
                          },
                        },
                    {
                      type: "div",
                      props: {
                        style: { display: "flex", flexDirection: "column" }, // ✓ multi-child column
                        children: [
                          {
                            type: "div",
                            props: {
                              style: { fontSize: 15, fontWeight: 800, color: "#0f172a", lineHeight: 1.2, display: "flex" },
                              children: "FlexTab",
                            },
                          },
                          {
                            type: "div",
                            props: {
                              style: { fontSize: 12, color: "#94a3b8", lineHeight: 1.3, display: "flex" },
                              children: date,
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              {
                type: "div",
                props: {
                  style: { fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex" },
                  children: "Workout",
                },
              },
            ],
          },
        },

        // ── Stat tiles 2×2 ──────────────────────────────────────────────────
        {
          type: "div",
          props: {
            style: {
              display: "flex",        // ✓ multi-child flex-wrap
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 16,
            },
            children: statTiles.map(({ value, label }) => ({
              type: "div",
              props: {
                style: {
                  background: "#f8fafc",
                  borderRadius: 14,
                  padding: "14px 8px 10px",
                  textAlign: "center",
                  width: 175,
                  display: "flex",    // ✓ multi-child column
                  flexDirection: "column",
                  alignItems: "center",
                },
                children: [
                  {
                    type: "div",
                    props: {
                      style: { fontSize: 28, fontWeight: 800, color: "#0f172a", lineHeight: 1, display: "flex" },
                      children: value,
                    },
                  },
                  {
                    type: "div",
                    props: {
                      style: { fontSize: 10, fontWeight: 700, color: "#94a3b8", marginTop: 5, textTransform: "uppercase", letterSpacing: "0.07em", display: "flex" },
                      children: label,
                    },
                  },
                ],
              },
            })),
          },
        },

        // ── Divider — zero children, display:flex still needed ──────────────
        {
          type: "div",
          props: {
            style: { height: 1, background: "#f1f5f9", marginBottom: 14, display: "flex" },
          },
        },

        // ── Exercises heading — single text child ────────────────────────────
        {
          type: "div",
          props: {
            style: { fontSize: 13, fontWeight: 800, color: "#0f172a", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em", display: "flex" },
            children: "Exercises",
          },
        },

        // ── Exercise rows container ──────────────────────────────────────────
        {
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "column" }, // ✓ multi-child column
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
              borderTop: "1px solid #f1f5f9",
              display: "flex",        // ✓ required
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            },
            children: {
              type: "div",
              props: {
                style: { fontSize: 11, color: "#cbd5e1", display: "flex" },
                children: "flextab.app",
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
    console.log('[workout-card] R2_ACCOUNT_ID:', process.env.R2_ACCOUNT_ID ? 'Set' : 'MISSING');
    console.log('[workout-card] R2_ACCESS_KEY_ID:', process.env.R2_ACCESS_KEY_ID ? 'Set' : 'MISSING');
    console.log('[workout-card] R2_SECRET_ACCESS_KEY:', process.env.R2_SECRET_ACCESS_KEY ? 'Set' : 'MISSING');
    console.log('[workout-card] R2_BUCKET_NAME:', process.env.R2_BUCKET_NAME || '(default: flextab-storage)');

    // Lazy-load satori and resvg to avoid issues at module load time
    const { default: satori } = await import("satori");
    const { Resvg } = await import("@resvg/resvg-js");

    const cardElement = buildCardElement(data);

    // Compute card height dynamically: header + tiles + divider + exercises + footer
    const exerciseHeight = Math.max(data.exercises.length, 1) * 47;
    const cardHeight = 80 + 160 + 20 + 30 + exerciseHeight + 50 + 40;

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
      console.warn('[workout-card] R2 error stack:', r2Err?.stack?.split('\n')[0]);
    }

    return res.json({ url, key, dataUri });
  } catch (err: any) {
    console.error("[workout-card] generation error:", err);
    return res.status(500).json({ error: "Failed to generate card", detail: err?.message });
  }
}
