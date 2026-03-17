/**
 * POST /api/generate-workout-card
 *
 * Renders one or more 1080×1920 Instagram story PNGs using satori + resvg.
 *
 * Multi-page design (v5):
 *   Page 1 — Summary: stat tiles + first 3 exercises (3 sets each)
 *   Page 2+ — Detail: 3 exercises per page, ALL sets shown, no truncation
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
const PAD_TOP = 200;
const PAD_BOT = 380;

// ── Theme palettes ────────────────────────────────────────────────────────────
const THEMES = {
  light: {
    bg:          "linear-gradient(160deg, #e8edf6 0%, #dce4f0 40%, #cdd8ec 100%)",
    tileBg:      "rgba(255,255,255,0.80)",
    divider:     "rgba(15,23,42,0.10)",
    textPrimary: "#0f172a",
    textMuted:   "#64748b",
    textFooter:  "#94a3b8",
    badgeBg:     "#0f172a",
    badgeText:   "#ffffff",
    pillBg:      "rgba(15,23,42,0.07)",
    pillText:    "#334155",
    setRowBg:    "rgba(15,23,42,0.04)",
    dotActive:   "#0f172a",
    dotInactive: "rgba(15,23,42,0.20)",
  },
  dark: {
    bg:          "linear-gradient(160deg, #0a0f1e 0%, #0d1526 50%, #060b16 100%)",
    tileBg:      "rgba(255,255,255,0.06)",
    divider:     "rgba(255,255,255,0.08)",
    textPrimary: "#f1f5f9",
    textMuted:   "#64748b",
    textFooter:  "#334155",
    badgeBg:     "rgba(255,255,255,0.12)",
    badgeText:   "#f1f5f9",
    pillBg:      "rgba(255,255,255,0.07)",
    pillText:    "#94a3b8",
    setRowBg:    "rgba(255,255,255,0.03)",
    dotActive:   "#f1f5f9",
    dotInactive: "rgba(255,255,255,0.20)",
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

// ── Helpers ───────────────────────────────────────────────────────────────────
function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

// ── Shared sub-builders ───────────────────────────────────────────────────────

function makeHeader(C: typeof THEMES["light"], isDark: boolean, date: string, userAvatarUrl?: string) {
  const avatarEl = userAvatarUrl ? {
    type: "img",
    props: { src: userAvatarUrl, width: 72, height: 72, style: { borderRadius: 36, objectFit: "cover", flexShrink: 0 } },
  } : null;

  return {
    type: "div",
    props: {
      style: { display: "flex", alignItems: "center", gap: 24, marginBottom: 28 },
      children: [
        { type: "img", props: { src: isDark ? FLEXTAB_ICON_WHITE_B64 : FLEXTAB_ICON_B64, width: 88, height: 88, style: { borderRadius: 22, flexShrink: 0 } } },
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
        ...(avatarEl ? [{ type: "div", props: { style: { display: "flex", alignItems: "center", flexShrink: 0 }, children: [avatarEl] } }] : []),
      ],
    },
  };
}

function makeFooter(C: typeof THEMES["light"], userName: string | undefined, pageNum: number, totalPages: number) {
  const footerText = userName
    ? `@${userName.toLowerCase().replace(/\s+/g, "")} · flextab.app`
    : "flextab.app";

  // Page indicator dots
  const dots = Array.from({ length: totalPages }, (_, i) => ({
    type: "div",
    props: {
      style: {
        width: i === pageNum - 1 ? 24 : 10,
        height: 10,
        borderRadius: 5,
        background: i === pageNum - 1 ? C.dotActive : C.dotInactive,
        display: "flex",
      },
    },
  }));

  return {
    type: "div",
    props: {
      style: {
        display: "flex", flexDirection: "column", alignItems: "center",
        paddingTop: 20, marginTop: "auto",
        borderTop: `1px solid ${C.divider}`,
        gap: 14,
      },
      children: [
        // Dots
        ...(totalPages > 1 ? [{
          type: "div",
          props: { style: { display: "flex", flexDirection: "row", gap: 8, alignItems: "center" }, children: dots },
        }] : []),
        // Username
        { type: "div", props: { style: { fontSize: 26, color: C.textFooter, fontWeight: 600, display: "flex" }, children: footerText } },
      ],
    },
  };
}

function makeSectionLabel(C: typeof THEMES["light"], text: string) {
  return {
    type: "div",
    props: {
      style: { display: "flex", marginBottom: 16 },
      children: { type: "div", props: { style: { fontSize: 26, fontWeight: 800, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.12em", display: "flex" }, children: text } },
    },
  };
}

function makeExerciseRow(
  C: typeof THEMES["light"],
  ex: ExerciseRow,
  index: number,
  isLast: boolean,
  maxSets: number | null,   // null = show all sets
) {
  const visibleSets = ex.sets ? (maxSets !== null ? ex.sets.slice(0, maxSets) : ex.sets) : [];
  const hiddenCount = ex.sets ? ex.sets.length - visibleSets.length : 0;

  const setChildren: any[] = visibleSets.map((s, si) => ({
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
        { type: "div", props: { style: { fontSize: 24, fontWeight: 700, color: C.textMuted, width: 90, display: "flex" }, children: `Set ${s.setNumber}` } },
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
  }));

  // "+N more sets" hint
  const moreHint = hiddenCount > 0 ? {
    type: "div",
    props: {
      style: { display: "flex", marginTop: 6, paddingLeft: 14 },
      children: { type: "div", props: { style: { fontSize: 22, color: C.textMuted, fontWeight: 600, display: "flex" }, children: `+${hiddenCount} more set${hiddenCount > 1 ? "s" : ""} — see next page` } },
    },
  } : null;

  return {
    type: "div",
    props: {
      style: {
        display: "flex", flexDirection: "column",
        paddingTop: 10, paddingBottom: 10,
        borderBottom: isLast ? "none" : `1px solid ${C.divider}`,
      },
      children: [
        {
          type: "div",
          props: {
            style: { display: "flex", alignItems: "center", gap: 24 },
            children: [
              { type: "div", props: { style: { width: 56, height: 56, borderRadius: 28, background: C.badgeBg, color: C.badgeText, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, flexShrink: 0 }, children: String(index + 1) } },
              { type: "div", props: { style: { flex: 1, fontSize: 40, fontWeight: 800, color: C.textPrimary, display: "flex", alignItems: "center" }, children: truncate(ex.exercise, 30) } },
              {
                type: "div",
                props: {
                  style: { background: C.pillBg, borderRadius: 50, paddingTop: 10, paddingBottom: 10, paddingLeft: 24, paddingRight: 24, flexShrink: 0, display: "flex", alignItems: "center" },
                  children: { type: "div", props: { style: { fontSize: 26, fontWeight: 700, color: C.pillText, whiteSpace: "nowrap", display: "flex" }, children: `${ex.totalSets} set${ex.totalSets !== 1 ? "s" : ""}` } },
                },
              },
            ],
          },
        },
        ...setChildren,
        ...(moreHint ? [moreHint] : []),
      ],
    },
  };
}

// ── Page builders ─────────────────────────────────────────────────────────────

/** Page 1: stat tiles + first 3 exercises (3 sets each) */
function buildSummaryPage(data: CardData, totalPages: number) {
  const C      = THEMES[data.theme === "dark" ? "dark" : "light"];
  const isDark = data.theme === "dark";
  const { date, duration, totalSets, totalReps, volumeDisplay, exercises, userName, userAvatarUrl } = data;

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
        background: C.tileBg, borderRadius: 24,
        paddingTop: 18, paddingBottom: 14,
        paddingLeft: 16, paddingRight: 16,
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
      },
      children: [
        { type: "div", props: { style: { fontSize: 58, fontWeight: 800, color: C.textPrimary, lineHeight: 1, display: "flex" }, children: value } },
        { type: "div", props: { style: { fontSize: 20, fontWeight: 700, color: C.textMuted, marginTop: 8, textTransform: "uppercase", letterSpacing: "0.12em", display: "flex" }, children: label } },
      ],
    },
  });

  // Show first 3 exercises, 3 sets each, with "+N more sets" hint if truncated
  const previewExercises = exercises.slice(0, 3);
  const exerciseRows = previewExercises.map((ex, i) =>
    makeExerciseRow(C, ex, i, i === previewExercises.length - 1, 3)
  );

  // "+N more exercises" hint
  const moreExCount = exercises.length - previewExercises.length;
  const moreExHint = moreExCount > 0 ? {
    type: "div",
    props: {
      style: { display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 20 },
      children: { type: "div", props: { style: { fontSize: 28, color: C.textMuted, fontWeight: 600, display: "flex" }, children: `+${moreExCount} more exercise${moreExCount > 1 ? "s" : ""} — swipe for details →` } },
    },
  } : null;

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
        makeHeader(C, isDark, date, userAvatarUrl),

        // Stat tiles 2×2
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

        // Divider
        { type: "div", props: { style: { height: 1, background: C.divider, marginBottom: 16, display: "flex" } } },

        // Exercises heading
        makeSectionLabel(C, "Exercises"),

        // Exercise rows
        {
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "column" },
            children: moreExHint ? [...exerciseRows, moreExHint] : exerciseRows,
          },
        },

        makeFooter(C, userName, 1, totalPages),
      ],
    },
  };
}

/** Detail page: shows a slice of exercises with ALL sets expanded */
function buildDetailPage(
  data: CardData,
  exerciseSlice: ExerciseRow[],
  globalOffset: number,  // index of first exercise in this slice (for numbering)
  pageNum: number,
  totalPages: number,
) {
  const C      = THEMES[data.theme === "dark" ? "dark" : "light"];
  const isDark = data.theme === "dark";
  const { date, userName, userAvatarUrl } = data;

  const exerciseRows = exerciseSlice.map((ex, i) =>
    makeExerciseRow(C, ex, globalOffset + i, i === exerciseSlice.length - 1, null)
  );

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
        makeHeader(C, isDark, date, userAvatarUrl),

        // Divider
        { type: "div", props: { style: { height: 1, background: C.divider, marginBottom: 16, display: "flex" } } },

        // Section label with page context
        makeSectionLabel(C, `Exercises — Page ${pageNum} of ${totalPages}`),

        // Exercise rows
        {
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "column" },
            children: exerciseRows,
          },
        },

        makeFooter(C, userName, pageNum, totalPages),
      ],
    },
  };
}

// ── Paginate exercises into detail pages ──────────────────────────────────────
// Each detail page holds 3 exercises (with all sets).
const EXERCISES_PER_DETAIL_PAGE = 3;

function paginateExercises(exercises: ExerciseRow[]): { slice: ExerciseRow[]; offset: number }[] {
  const pages: { slice: ExerciseRow[]; offset: number }[] = [];
  for (let i = 0; i < exercises.length; i += EXERCISES_PER_DETAIL_PAGE) {
    pages.push({ slice: exercises.slice(i, i + EXERCISES_PER_DETAIL_PAGE), offset: i });
  }
  return pages;
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

    const satoriOpts = {
      width: STORY_W, height: STORY_H,
      fonts: [
        { name: "Inter", data: fontRegular, weight: 400, style: "normal" as const },
        { name: "Inter", data: fontBold,    weight: 700, style: "normal" as const },
        { name: "Inter", data: fontBold,    weight: 800, style: "normal" as const },
      ],
    };

    // Build page list
    const detailPages = paginateExercises(data.exercises);
    const totalPages  = 1 + detailPages.length;

    const pageElements: any[] = [
      buildSummaryPage(data, totalPages),
      ...detailPages.map(({ slice, offset }, i) =>
        buildDetailPage(data, slice, offset, i + 2, totalPages)
      ),
    ];

    // Render each page
    const results: Array<{ dataUri: string; url: string | null; key: string | null }> = [];

    for (let i = 0; i < pageElements.length; i++) {
      const svg       = await satori(pageElements[i] as any, satoriOpts);
      const resvg     = new Resvg(svg, { fitTo: { mode: "width", value: STORY_W } });
      const pngBuffer = resvg.render().asPng();
      const dataUri   = `data:image/png;base64,${Buffer.from(pngBuffer).toString("base64")}`;

      let url: string | null = null;
      let key: string | null = null;
      try {
        const r2Key = `workout-cards/${Date.now()}-p${i + 1}-${Math.random().toString(36).slice(2)}.png`;
        const result = await storagePut(r2Key, pngBuffer, "image/png");
        url = result.url;
        key = r2Key;
      } catch (r2Err: any) {
        console.warn(`[workout-card] R2 upload failed for page ${i + 1} (non-fatal):`, r2Err?.message);
      }

      results.push({ dataUri, url, key });
    }

    return res.json({ pages: results });
  } catch (err: any) {
    console.error("[workout-card] Error:", err);
    return res.status(500).json({ error: err?.message ?? "Unknown error" });
  }
}
