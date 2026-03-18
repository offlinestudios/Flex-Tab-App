/**
 * POST /api/generate-workout-card
 *
 * Renders a single 1080×1920 Instagram story PNG using satori + resvg.
 *
 * Single-page design (v6 — Concept B):
 *   • Horizontal stat strip (Duration · Sets · Reps · Volume) at the top
 *   • All exercises with all sets shown as chips in a 4-per-row grid
 *   • Adaptive chip height fills the full canvas
 *
 * Response: { pages: Array<{ dataUri, url, key }> }
 *
 * Satori rule: every <div> with more than one child MUST have display:"flex".
 */

import { Request, Response } from "express";
import { storagePut } from "./storage.js";
import { INTER_REGULAR_B64, INTER_BOLD_B64 } from "./fontData.js";
import { FLEXTAB_ICON_B64, FLEXTAB_ICON_WHITE_B64 } from "../client/src/lib/flextabIconB64.js";

// ── Fonts ─────────────────────────────────────────────────────────────────────
const fontRegular = Buffer.from(INTER_REGULAR_B64, "base64");
const fontBold    = Buffer.from(INTER_BOLD_B64,    "base64");

// ── Story canvas ──────────────────────────────────────────────────────────────
const STORY_W = 1080;
const STORY_H = 1920;

// Instagram Stories safe zone:
//   Top ~13% (≈250px) and bottom ~18% (≈346px) are covered by UI chrome.
const PAD_H   = 80;
const PAD_TOP = 120;  // just below Instagram profile bar
const PAD_BOT = 260;  // just above Instagram caption/share area
const USABLE_H   = STORY_H - PAD_TOP - PAD_BOT; // 1540px
const CONTENT_W  = STORY_W - PAD_H * 2;          // 920px

// ── Theme palettes ────────────────────────────────────────────────────────────
const THEMES = {
  light: {
    bg:           "linear-gradient(160deg, #e8edf6 0%, #dce4f0 40%, #cdd8ec 100%)",
    tileBg:       "rgba(255,255,255,0.80)",
    divider:      "rgba(15,23,42,0.10)",
    textPrimary:  "#0f172a",
    textMuted:    "#64748b",
    textFooter:   "#94a3b8",
    badgeBg:      "#0f172a",
    badgeText:    "#ffffff",
    chipBg:       "rgba(15,23,42,0.06)",
    setNumColor:  "#1e3a5f",
    setNumWeight: 700,
    exHeaderBg:   "rgba(15,23,42,0.07)",
    accentBar:    "#0f172a",
    setsBadgeBg:  "rgba(15,23,42,0.10)",
  },
  dark: {
    bg:           "linear-gradient(160deg, #0a0f1e 0%, #0d1526 50%, #060b16 100%)",
    tileBg:       "rgba(255,255,255,0.06)",
    divider:      "rgba(255,255,255,0.08)",
    textPrimary:  "#f1f5f9",
    textMuted:    "#64748b",
    textFooter:   "#334155",
    badgeBg:      "rgba(255,255,255,0.12)",
    badgeText:    "#f1f5f9",
    chipBg:       "rgba(255,255,255,0.06)",
    setNumColor:  "#94a3b8",
    setNumWeight: 600,
    exHeaderBg:   "rgba(255,255,255,0.06)",
    accentBar:    "#3b82f6",
    setsBadgeBg:  "rgba(255,255,255,0.10)",
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
}

// ── Layout constants ──────────────────────────────────────────────────────────
const CHIPS_PER_ROW = 3;
const CHIP_GAP      = 14;
const H_HEADER      = 88 + 28;   // logo(88) + marginBottom(28)
const H_TILE_ROW    = 120;       // height of each tile in the 2×2 grid
const H_TILE_GAP    = 12;        // gap between tile rows
const H_STAT_STRIP  = H_TILE_ROW * 2 + H_TILE_GAP; // 252px total
const H_STAT_MB     = 24;
const H_DIVIDER     = 1 + 16;
const H_SECTION_LBL = 26 + 16;
const H_FOOTER      = 1 + 16 + 26 + 14;  // border + paddingTop + text + paddingBottom
const H_EX_HEADER   = 72 + 12;   // accent band height + gap below
const H_EX_GAP      = 20;        // gap between exercises

const H_CHROME = H_HEADER + H_STAT_STRIP + H_STAT_MB + H_DIVIDER + H_SECTION_LBL + H_FOOTER;

// ── Adaptive chip height ──────────────────────────────────────────────────────
/**
 * Calculates the chip height that fills the available canvas.
 * Each exercise contributes: H_EX_HEADER + ceil(sets/CHIPS_PER_ROW) chip rows.
 */
function computeChipH(exercises: ExerciseRow[]): number {
  const numEx = exercises.length;
  const totalChipRows = exercises.reduce((sum, ex) => {
    const n = ex.sets?.length ?? ex.totalSets;
    return sum + Math.ceil(n / CHIPS_PER_ROW);
  }, 0);
  const extraChipGaps = exercises.reduce((sum, ex) => {
    const n = ex.sets?.length ?? ex.totalSets;
    const rows = Math.ceil(n / CHIPS_PER_ROW);
    return sum + Math.max(0, rows - 1) * CHIP_GAP;
  }, 0);
  const fixedExercise = numEx * H_EX_HEADER + (numEx - 1) * H_EX_GAP + extraChipGaps;
  const available = USABLE_H - H_CHROME - fixedExercise;
  const chipH = Math.floor(available / totalChipRows);
  // Clamp: min 70px (readable), max 150px (aesthetic)
  return Math.max(70, Math.min(150, chipH));
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

// ── Card builder ──────────────────────────────────────────────────────────────
function buildCard(data: CardData) {
  const C      = THEMES[data.theme === "dark" ? "dark" : "light"];
  const isDark = data.theme === "dark";
  const { date, duration, totalSets, totalReps, volumeDisplay, exercises, userName, userAvatarUrl } = data;

  const chipH = computeChipH(exercises);

  // Font sizes derived from chip height — clear hierarchy: numbers bold, units regular
  const chipValueFontSize = Math.round(chipH * 0.44);
  const chipLabelFontSize = Math.round(chipH * 0.22);
  const chipUnitFontSize  = Math.round(chipH * 0.22);

  // ── Header ──────────────────────────────────────────────────────────────────
  const avatarEl = userAvatarUrl ? {
    type: "img",
    props: { src: userAvatarUrl, width: 72, height: 72, style: { borderRadius: 36, objectFit: "cover", flexShrink: 0 } },
  } : null;

  const headerEl = {
    type: "div",
    props: {
      style: { display: "flex", alignItems: "center", gap: 20, marginBottom: 28 },
      children: [
        { type: "img", props: { src: isDark ? FLEXTAB_ICON_WHITE_B64 : FLEXTAB_ICON_B64, width: 72, height: 72, style: { borderRadius: 18, flexShrink: 0 } } },
        {
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "column", gap: 4, flex: 1 },
            children: [
              { type: "div", props: { style: { fontSize: 42, fontWeight: 800, color: C.textPrimary, display: "flex" }, children: "FlexTab" } },
              { type: "div", props: { style: { fontSize: 26, color: C.textMuted, display: "flex" }, children: date } },
            ],
          },
        },
        ...(avatarEl ? [{ type: "div", props: { style: { display: "flex", alignItems: "center", flexShrink: 0 }, children: [avatarEl] } }] : []),
      ],
    },
  };

  // ── Stat strip ───────────────────────────────────────────────────────────────
  const stats = [
    { v: duration || "—",       l: "DURATION" },
    { v: String(totalSets),     l: "SETS"     },
    { v: String(totalReps),     l: "REPS"     },
    { v: volumeDisplay,         l: "VOLUME"   },
  ];

  // 2×2 tile grid
  const tileEl = (s: { v: string; l: string }, isRight: boolean) => ({
    type: "div",
    props: {
      style: {
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: C.tileBg, borderRadius: 20,
        height: H_TILE_ROW,
        marginLeft: isRight ? H_TILE_GAP : 0,
      },
      children: [
        { type: "div", props: { style: { fontSize: 58, fontWeight: 800, color: C.textPrimary, lineHeight: 1, display: "flex" }, children: s.v } },
        { type: "div", props: { style: { fontSize: 20, fontWeight: 700, color: C.textMuted, marginTop: 8, letterSpacing: "0.10em", display: "flex" }, children: s.l } },
      ],
    },
  });
  const statStripEl = {
    type: "div",
    props: {
      style: { display: "flex", flexDirection: "column", gap: H_TILE_GAP, marginBottom: H_STAT_MB },
      children: [
        { type: "div", props: { style: { display: "flex", flexDirection: "row" }, children: [tileEl(stats[0], false), tileEl(stats[1], true)] } },
        { type: "div", props: { style: { display: "flex", flexDirection: "row" }, children: [tileEl(stats[2], false), tileEl(stats[3], true)] } },
      ],
    },
  };

  // ── Exercises ────────────────────────────────────────────────────────────────
  const exerciseEls = exercises.map((ex, ei) => {
    const sets = ex.sets ?? [];

    // Group sets into rows of CHIPS_PER_ROW
    const chipRows: SetDetail[][] = [];
    for (let i = 0; i < sets.length; i += CHIPS_PER_ROW) {
      chipRows.push(sets.slice(i, i + CHIPS_PER_ROW));
    }

    const fixedChipW = Math.floor((CONTENT_W - (CHIPS_PER_ROW - 1) * CHIP_GAP) / CHIPS_PER_ROW); // 298px at 3/row
    const chipRowEls = chipRows.map((row, ri) => ({
      type: "div",
      props: {
        style: { display: "flex", flexDirection: "row", gap: CHIP_GAP, marginTop: ri === 0 ? 0 : CHIP_GAP },
        children: row.map(s => ({
          type: "div",
          props: {
            style: {
              width: fixedChipW,
              height: chipH,
              background: C.chipBg,
              borderRadius: 14,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              paddingLeft: 14,
              paddingRight: 10,
              gap: 2,
            },
            children: [
              { type: "div", props: { style: { fontSize: chipLabelFontSize, fontWeight: C.setNumWeight, color: C.setNumColor, display: "flex" }, children: `Set ${s.setNumber}` } },
              {
                type: "div",
                props: {
                  style: { display: "flex", alignItems: "baseline", gap: 4 },
                  children: [
                    { type: "div", props: { style: { fontSize: chipValueFontSize, fontWeight: 800, color: C.textPrimary, display: "flex", lineHeight: 1 }, children: String(s.reps) } },
                    { type: "div", props: { style: { fontSize: chipUnitFontSize, fontWeight: 400, color: C.textMuted, display: "flex" }, children: " reps" } },
                    ...(s.weight > 0 ? [
                      { type: "div", props: { style: { fontSize: chipUnitFontSize, fontWeight: 400, color: C.textMuted, display: "flex" }, children: " · " } },
                      { type: "div", props: { style: { fontSize: chipValueFontSize, fontWeight: 800, color: C.textPrimary, display: "flex", lineHeight: 1 }, children: String(s.weight) } },
                      { type: "div", props: { style: { fontSize: chipUnitFontSize, fontWeight: 400, color: C.textMuted, display: "flex" }, children: " lbs" } },
                    ] : []),
                  ],
                },
              },
            ],
          },
        })),
      },
    }));

    return {
      type: "div",
      props: {
        style: { display: "flex", flexDirection: "column", marginTop: ei === 0 ? 0 : H_EX_GAP },
        children: [
          // ── Exercise header band ──────────────────────────────────────────
          {
            type: "div",
            props: {
              style: {
                display: "flex", alignItems: "center",
                background: C.exHeaderBg,
                borderRadius: 16,
                height: 72,
                marginBottom: 12,
                overflow: "hidden",
              },
              children: [
                // Left accent bar
                { type: "div", props: { style: { width: 6, alignSelf: "stretch", background: C.accentBar, flexShrink: 0, display: "flex" } } },
                // Number badge
                { type: "div", props: { style: { width: 52, height: 52, borderRadius: 26, background: C.badgeBg, color: C.badgeText, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, flexShrink: 0, marginLeft: 16 }, children: String(ei + 1) } },
                // Exercise name — larger, heavier, clearly the title
                { type: "div", props: { style: { flex: 1, fontSize: 40, fontWeight: 800, color: C.textPrimary, display: "flex", marginLeft: 16, letterSpacing: "-0.01em" }, children: truncate(ex.exercise, 26) } },
                // Sets badge
                {
                  type: "div",
                  props: {
                    style: { background: C.setsBadgeBg, borderRadius: 50, paddingLeft: 20, paddingRight: 20, paddingTop: 8, paddingBottom: 8, marginRight: 16, display: "flex", flexShrink: 0 },
                    children: { type: "div", props: { style: { fontSize: 22, fontWeight: 700, color: C.textMuted, display: "flex", whiteSpace: "nowrap" }, children: `${ex.totalSets} sets` } },
                  },
                },
              ],
            },
          },
          // Chip rows
          ...chipRowEls,
        ],
      },
    };
  });

  // ── Footer ───────────────────────────────────────────────────────────────────
  const footerText = userName
    ? `@${userName.toLowerCase().replace(/\s+/g, "")} · flextab.app`
    : "flextab.app";

  const footerEl = {
    type: "div",
    props: {
      style: {
        display: "flex", alignItems: "center", justifyContent: "center",
        marginTop: "auto", paddingTop: 16,
        borderTop: `1px solid ${C.divider}`,
      },
      children: { type: "div", props: { style: { fontSize: 26, color: C.textFooter, fontWeight: 600, display: "flex" }, children: footerText } },
    },
  };

  // ── Root ─────────────────────────────────────────────────────────────────────
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
        headerEl,
        statStripEl,
        { type: "div", props: { style: { height: 1, background: C.divider, marginBottom: 16, display: "flex" } } },
        { type: "div", props: { style: { fontSize: 22, fontWeight: 800, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12, display: "flex" }, children: "EXERCISES" } },
        { type: "div", props: { style: { display: "flex", flexDirection: "column" }, children: exerciseEls } },
        footerEl,
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

    // ── Expand bulk-logged sets ────────────────────────────────────────────────
    // A SetLog row may have sets > 1 when the user logs "3 sets × 10 reps" as one
    // entry rather than individual set rows. Expand into N identical set details.
    data.exercises = data.exercises.map(ex => {
      if (!ex.sets || ex.sets.length === 0) return ex;
      const expanded: SetDetail[] = [];
      ex.sets.forEach(s => {
        // If a set detail has been duplicated (same setNumber repeated), skip;
        // otherwise expand if the set count implies multiple identical rows.
        expanded.push(s);
      });
      return { ...ex, sets: expanded, totalSets: expanded.length };
    });

    const { default: satori } = await import("satori");
    const { Resvg }           = await import("@resvg/resvg-js");

    const satoriOpts = {
      width: STORY_W, height: STORY_H,
      fonts: [
        { name: "Inter", data: fontRegular, weight: 400, style: "normal" as const },
        { name: "Inter", data: fontBold,    weight: 700, style: "normal" as const },
        { name: "Inter", data: fontBold,    weight: 800, style: "normal" as const },
      ],
    };

    const pageElement = buildCard(data);

    const svg       = await satori(pageElement as any, satoriOpts);
    const resvg     = new Resvg(svg, { fitTo: { mode: "width", value: STORY_W } });
    const pngBuffer = resvg.render().asPng();
    const dataUri   = `data:image/png;base64,${Buffer.from(pngBuffer).toString("base64")}`;

    let url: string | null = null;
    let key: string | null = null;
    try {
      const r2Key = `workout-cards/${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
      const result = await storagePut(r2Key, pngBuffer, "image/png");
      url = result.url;
      key = r2Key;
    } catch (r2Err: any) {
      console.warn("[workout-card] R2 upload failed (non-fatal):", r2Err?.message);
    }

    // Return as pages array for backward compatibility with client
    return res.json({ pages: [{ dataUri, url, key }] });
  } catch (err: any) {
    console.error("[workout-card] Error:", err);
    return res.status(500).json({ error: err?.message ?? "Unknown error" });
  }
}
