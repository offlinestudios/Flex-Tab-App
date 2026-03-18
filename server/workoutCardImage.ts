/**
 * POST /api/generate-workout-card
 *
 * Renders a single 1080×1920 Instagram story PNG using satori + resvg.
 *
 * Design (v7 — cardio-aware):
 *   • Stat strip adapts for pure-cardio sessions (Duration · Distance · Avg Pace · Activities)
 *   • Cardio exercises render a 3-slot info block (Duration / Distance / Pace) instead of set chips
 *   • Pure-cardio cards show a decorative runner graphic in the empty lower space
 *   • Mixed sessions keep the strength stat strip; cardio exercises use the info block
 *
 * Response: { pages: Array<{ dataUri, url, key }> }
 *
 * Satori rule: every <div> with more than one child MUST have display:"flex".
 */

import { Request, Response } from "express";
import { storagePut } from "./storage.js";
import { INTER_REGULAR_B64, INTER_BOLD_B64 } from "./fontData.js";
import { FLEXTAB_ICON_B64, FLEXTAB_ICON_WHITE_B64 } from "../client/src/lib/flextabIconB64.js";
import { CARDIO_GRAPHIC_B64 } from "../client/src/lib/cardioGraphicB64.js";

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
    cardioBg:     "rgba(59,130,246,0.10)",
    cardioAccent: "#3b82f6",
    cardioText:   "#1d4ed8",
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
    cardioBg:     "rgba(59,130,246,0.12)",
    cardioAccent: "#3b82f6",
    cardioText:   "#60a5fa",
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
const CHIPS_PER_ROW  = 3;
const CHIP_GAP       = 14;
const H_CARDIO_CHIP  = 110;   // height of a cardio info block
const H_HEADER       = 88 + 28;   // logo(88) + marginBottom(28)
const H_TILE_ROW     = 120;       // height of each tile in the 2×2 grid
const H_TILE_GAP     = 12;        // gap between tile rows
const H_STAT_STRIP   = H_TILE_ROW * 2 + H_TILE_GAP; // 252px total
const H_STAT_MB      = 24;
const H_DIVIDER      = 1 + 16;
const H_SECTION_LBL  = 26 + 16;
const H_FOOTER       = 1 + 16 + 26 + 14;  // border + paddingTop + text + paddingBottom
const H_EX_HEADER    = 72 + 12;   // accent band height + gap below
const H_EX_GAP       = 20;        // gap between exercises

const H_CHROME = H_HEADER + H_STAT_STRIP + H_STAT_MB + H_DIVIDER + H_SECTION_LBL + H_FOOTER;

// ── Cardio detection ──────────────────────────────────────────────────────────
const CARDIO_CATEGORIES = new Set(["cardio", "running", "cycling", "swimming", "rowing", "walking"]);

function isCardio(ex: ExerciseRow): boolean {
  if (CARDIO_CATEGORIES.has((ex.category ?? "").toLowerCase())) return true;
  // Fallback: if the exercise has duration/distance but no meaningful sets/reps
  if ((ex.duration ?? 0) > 0 && (ex.sets?.length ?? ex.totalSets) <= 1 && (ex.bestReps ?? 0) === 0) return true;
  return false;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function formatDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatPace(totalSec: number, distance: number, unit: string): string {
  if (!distance || !totalSec) return "—";
  const secPerUnit = totalSec / distance;
  const m = Math.floor(secPerUnit / 60);
  const s = Math.round(secPerUnit % 60);
  return `${m}:${String(s).padStart(2, "0")}/${unit}`;
}

// ── Adaptive chip height ──────────────────────────────────────────────────────
function computeChipH(exercises: ExerciseRow[]): number {
  const numEx = exercises.length;
  const totalChipRows = exercises.reduce((sum, ex) => {
    if (isCardio(ex)) return sum + 1; // cardio = 1 row (the info block)
    const n = ex.sets?.length ?? ex.totalSets;
    return sum + Math.ceil(n / CHIPS_PER_ROW);
  }, 0);
  const extraChipGaps = exercises.reduce((sum, ex) => {
    if (isCardio(ex)) return sum;
    const n = ex.sets?.length ?? ex.totalSets;
    const rows = Math.ceil(n / CHIPS_PER_ROW);
    return sum + Math.max(0, rows - 1) * CHIP_GAP;
  }, 0);
  const fixedExercise = numEx * H_EX_HEADER + (numEx - 1) * H_EX_GAP + extraChipGaps;
  const available = USABLE_H - H_CHROME - fixedExercise;
  const chipH = Math.floor(available / Math.max(1, totalChipRows));
  return Math.max(70, Math.min(150, chipH));
}

// ── Card builder ──────────────────────────────────────────────────────────────
function buildCard(data: CardData) {
  const C      = THEMES[data.theme === "dark" ? "dark" : "light"];
  const isDark = data.theme === "dark";
  const { date, duration, totalSets, totalReps, volumeDisplay, exercises, userName, userAvatarUrl } = data;

  const chipH = computeChipH(exercises);
  const chipValueFontSize = Math.round(chipH * 0.44);
  const chipLabelFontSize = Math.round(chipH * 0.22);
  const chipUnitFontSize  = Math.round(chipH * 0.22);

  // ── Cardio session detection ─────────────────────────────────────────────────
  const pureCardio = exercises.length > 0 && exercises.every(isCardio);

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
  let stats: Array<{ v: string; l: string }>;

  if (pureCardio) {
    // Cardio-specific stat strip
    const totalDistKm = exercises.reduce((s, ex) => {
      if (!ex.distance) return s;
      const km = (ex.distanceUnit ?? "km") === "miles" ? ex.distance * 1.60934 : ex.distance;
      return s + km;
    }, 0);
    const totalDurSec = exercises.reduce((s, ex) => s + (ex.duration ?? 0), 0);
    const distDisplay = totalDistKm > 0 ? `${totalDistKm.toFixed(1)} km` : "—";
    const paceDisplay = totalDurSec > 0 && totalDistKm > 0
      ? formatPace(totalDurSec, totalDistKm, "km")
      : "—";
    stats = [
      { v: duration || "—",                  l: "DURATION"   },
      { v: distDisplay,                       l: "DISTANCE"   },
      { v: paceDisplay,                       l: "AVG PACE"   },
      { v: String(exercises.length),          l: "ACTIVITIES" },
    ];
  } else {
    stats = [
      { v: duration || "—",   l: "DURATION" },
      { v: String(totalSets), l: "SETS"     },
      { v: String(totalReps), l: "REPS"     },
      { v: volumeDisplay,     l: "VOLUME"   },
    ];
  }

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

  // ── Cardio info block builder ─────────────────────────────────────────────────
  function buildCardioBlock(ex: ExerciseRow) {
    const distStr = ex.distance ? `${ex.distance} ${ex.distanceUnit ?? "km"}` : null;
    const durStr  = ex.duration ? formatDuration(ex.duration) : null;
    const paceStr = ex.duration && ex.distance
      ? formatPace(ex.duration, ex.distance, ex.distanceUnit ?? "km")
      : null;

    const statItems: Array<{ v: string; l: string }> = [];
    if (durStr)  statItems.push({ v: durStr,  l: "DURATION" });
    if (distStr) statItems.push({ v: distStr, l: "DISTANCE" });
    if (paceStr) statItems.push({ v: paceStr, l: "PACE" });
    while (statItems.length < 3) statItems.push({ v: "—", l: "" });

    const slotW = Math.floor((CONTENT_W - 2 * CHIP_GAP) / 3);

    return {
      type: "div",
      props: {
        style: { display: "flex", flexDirection: "row", gap: CHIP_GAP, height: H_CARDIO_CHIP },
        children: statItems.map(s => ({
          type: "div",
          props: {
            style: {
              width: slotW, height: H_CARDIO_CHIP,
              background: C.cardioBg, borderRadius: 14,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 6,
            },
            children: [
              { type: "div", props: { style: { fontSize: 38, fontWeight: 800, color: C.cardioText, display: "flex", lineHeight: 1 }, children: s.v } },
              { type: "div", props: { style: { fontSize: 18, fontWeight: 700, color: C.textMuted, letterSpacing: "0.10em", display: "flex" }, children: s.l } },
            ],
          },
        })),
      },
    };
  }

  // ── Exercises ────────────────────────────────────────────────────────────────
  const exerciseEls = exercises.map((ex, ei) => {
    const cardio = isCardio(ex);
    const sets   = ex.sets ?? [];

    // Strength chip rows
    const chipRows: SetDetail[][] = [];
    for (let i = 0; i < sets.length; i += CHIPS_PER_ROW) {
      chipRows.push(sets.slice(i, i + CHIPS_PER_ROW));
    }

    const fixedChipW = Math.floor((CONTENT_W - (CHIPS_PER_ROW - 1) * CHIP_GAP) / CHIPS_PER_ROW);
    const chipRowEls = chipRows.map((row, ri) => ({
      type: "div",
      props: {
        style: { display: "flex", flexDirection: "row", gap: CHIP_GAP, marginTop: ri === 0 ? 0 : CHIP_GAP },
        children: row.map(s => ({
          type: "div",
          props: {
            style: {
              width: fixedChipW, height: chipH,
              background: C.chipBg, borderRadius: 14,
              display: "flex", flexDirection: "column",
              justifyContent: "center", paddingLeft: 14, paddingRight: 10, gap: 2,
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

    // Right badge — only for strength exercises
    const rightBadge = cardio ? null : {
      type: "div",
      props: {
        style: { background: C.setsBadgeBg, borderRadius: 50, paddingLeft: 20, paddingRight: 20, paddingTop: 8, paddingBottom: 8, marginRight: 16, display: "flex", flexShrink: 0 },
        children: { type: "div", props: { style: { fontSize: 22, fontWeight: 700, color: C.textMuted, display: "flex", whiteSpace: "nowrap" }, children: `${ex.totalSets} sets` } },
      },
    };

    return {
      type: "div",
      props: {
        style: { display: "flex", flexDirection: "column", marginTop: ei === 0 ? 0 : H_EX_GAP },
        children: [
          // Exercise header band
          {
            type: "div",
            props: {
              style: {
                display: "flex", alignItems: "center",
                background: cardio ? C.cardioBg : C.exHeaderBg,
                borderRadius: 16, height: 72, marginBottom: 12,
                overflow: "hidden", paddingLeft: 20,
                borderBottom: `2px solid ${cardio ? C.cardioAccent : C.accentBar}`,
              },
              children: [
                { type: "div", props: { style: { width: 52, height: 52, borderRadius: 26, background: C.badgeBg, color: C.badgeText, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, flexShrink: 0 }, children: String(ei + 1) } },
                { type: "div", props: { style: { flex: 1, fontSize: 40, fontWeight: 800, color: C.textPrimary, display: "flex", marginLeft: 16, letterSpacing: "-0.01em" }, children: truncate(ex.exercise, 26) } },
                ...(rightBadge ? [rightBadge] : []),
              ],
            },
          },
          // Cardio info block OR strength chip rows
          ...(cardio ? [buildCardioBlock(ex)] : chipRowEls),
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

  // ── Cardio graphic filler (pure-cardio only) ──────────────────────────────
  const cardioGraphicEl = pureCardio ? {
    type: "div",
    props: {
      style: { display: "flex", flex: 1, alignItems: "center", justifyContent: "center", marginTop: 24 },
      children: [{
        type: "img",
        props: {
          src: CARDIO_GRAPHIC_B64,
          width: CONTENT_W,
          height: Math.round(CONTENT_W * 640 / 920),
          style: { opacity: 0.92 },
        },
      }],
    },
  } : null;

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
        ...(cardioGraphicEl ? [cardioGraphicEl] : []),
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

    // Expand bulk-logged sets
    data.exercises = data.exercises.map(ex => {
      if (!ex.sets || ex.sets.length === 0) return ex;
      const expanded: SetDetail[] = [];
      ex.sets.forEach(s => { expanded.push(s); });
      return { ...ex, sets: expanded, totalSets: expanded.length };
    });

    const { default: satori } = await import("satori");
    const { Resvg }           = await import("@resvg/resvg-js");

    const satoriOpts = {
      width: STORY_W, height: STORY_H,
      fonts: [
        { name: "Inter", data: fontRegular, weight: 400 as const, style: "normal" as const },
        { name: "Inter", data: fontBold,    weight: 700 as const, style: "normal" as const },
        { name: "Inter", data: fontBold,    weight: 800 as const, style: "normal" as const },
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

    return res.json({ pages: [{ dataUri, url, key }] });
  } catch (err: any) {
    console.error("[workout-card] Error:", err);
    return res.status(500).json({ error: err?.message ?? "Unknown error" });
  }
}
