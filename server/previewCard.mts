/**
 * Standalone preview script — renders all pages of the multi-page workout card.
 * Run with:  npx tsx server/previewCard.mts
 */
import { writeFileSync } from "fs";
import { INTER_REGULAR_B64, INTER_BOLD_B64 } from "./fontData.js";
import { FLEXTAB_ICON_B64, FLEXTAB_ICON_WHITE_B64 } from "../client/src/lib/flextabIconB64.js";

const fontRegular = Buffer.from(INTER_REGULAR_B64, "base64");
const fontBold    = Buffer.from(INTER_BOLD_B64,    "base64");

const STORY_W = 1080;
const STORY_H = 1920;

const PAD_H   = 80;
const PAD_TOP = 200;
const PAD_BOT = 380;

// ── Themes ────────────────────────────────────────────────────────────────────
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

type ThemeKey = keyof typeof THEMES;
type C = typeof THEMES["light"];

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

// ── Sample data (7 exercises to demonstrate pagination) ───────────────────────
const ALL_EXERCISES = [
  {
    exercise: "Chest Dips",       totalSets: 4, bestReps: 5,  bestWeight: 100, category: "Chest",
    sets: [
      { setNumber: 1, reps: 8,  weight: 80  },
      { setNumber: 2, reps: 6,  weight: 90  },
      { setNumber: 3, reps: 5,  weight: 100 },
      { setNumber: 4, reps: 5,  weight: 100 },
    ],
  },
  {
    exercise: "Standing Military Press", totalSets: 3, bestReps: 3, bestWeight: 185, category: "Shoulders",
    sets: [
      { setNumber: 1, reps: 5, weight: 165 },
      { setNumber: 2, reps: 4, weight: 175 },
      { setNumber: 3, reps: 3, weight: 185 },
    ],
  },
  {
    exercise: "Upright Rows",     totalSets: 3, bestReps: 7,  bestWeight: 135, category: "Shoulders",
    sets: [
      { setNumber: 1, reps: 10, weight: 115 },
      { setNumber: 2, reps: 8,  weight: 125 },
      { setNumber: 3, reps: 7,  weight: 135 },
    ],
  },
  {
    exercise: "Seated Dumbbell Press", totalSets: 3, bestReps: 6, bestWeight: 160, category: "Shoulders",
    sets: [
      { setNumber: 1, reps: 8, weight: 140 },
      { setNumber: 2, reps: 7, weight: 150 },
      { setNumber: 3, reps: 6, weight: 160 },
    ],
  },
  {
    exercise: "Lateral Raises",   totalSets: 3, bestReps: 10, bestWeight: 40,  category: "Shoulders",
    sets: [
      { setNumber: 1, reps: 12, weight: 30 },
      { setNumber: 2, reps: 10, weight: 35 },
      { setNumber: 3, reps: 10, weight: 40 },
    ],
  },
  {
    exercise: "Rear Delt Fly",    totalSets: 3, bestReps: 12, bestWeight: 30,  category: "Shoulders",
    sets: [
      { setNumber: 1, reps: 15, weight: 20 },
      { setNumber: 2, reps: 12, weight: 25 },
      { setNumber: 3, reps: 12, weight: 30 },
    ],
  },
  {
    exercise: "Triceps Pushdown", totalSets: 4, bestReps: 10, bestWeight: 70,  category: "Triceps",
    sets: [
      { setNumber: 1, reps: 12, weight: 55 },
      { setNumber: 2, reps: 10, weight: 65 },
      { setNumber: 3, reps: 10, weight: 70 },
      { setNumber: 4, reps: 8,  weight: 70 },
    ],
  },
];

const TOTAL_SETS   = ALL_EXERCISES.reduce((s, e) => s + e.totalSets, 0);
const TOTAL_REPS   = ALL_EXERCISES.reduce((s, e) => s + e.totalSets * e.bestReps, 0);
const TOTAL_VOL    = ALL_EXERCISES.reduce((s, e) => s + e.totalSets * e.bestReps * e.bestWeight, 0);
const VOL_DISPLAY  = `${(TOTAL_VOL / 1000).toFixed(1)}k`;
const DATE         = "Monday, Mar 16, 2026";
const DURATION     = "51:45";
const USER_NAME    = "julianross";

// ── Shared builders ───────────────────────────────────────────────────────────
function makeHeader(C: any, isDark: boolean, date: string) {
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
      ],
    },
  };
}

function makeFooter(C: any, userName: string, pageNum: number, totalPages: number) {
  const dots = Array.from({ length: totalPages }, (_, i) => ({
    type: "div",
    props: {
      style: {
        width: i === pageNum - 1 ? 24 : 10,
        height: 10, borderRadius: 5,
        background: i === pageNum - 1 ? C.dotActive : C.dotInactive,
        display: "flex",
      },
    },
  }));

  return {
    type: "div",
    props: {
      style: { display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 20, marginTop: "auto", borderTop: `1px solid ${C.divider}`, gap: 14 },
      children: [
        ...(totalPages > 1 ? [{ type: "div", props: { style: { display: "flex", flexDirection: "row", gap: 8, alignItems: "center" }, children: dots } }] : []),
        { type: "div", props: { style: { fontSize: 26, color: C.textFooter, fontWeight: 600, display: "flex" }, children: `@${userName} · flextab.app` } },
      ],
    },
  };
}

function makeSectionLabel(C: any, text: string) {
  return {
    type: "div",
    props: {
      style: { display: "flex", marginBottom: 16 },
      children: { type: "div", props: { style: { fontSize: 26, fontWeight: 800, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.12em", display: "flex" }, children: text } },
    },
  };
}

function makeExerciseRow(C: any, ex: any, globalIndex: number, isLast: boolean, maxSets: number | null) {
  const visibleSets: any[] = ex.sets ? (maxSets !== null ? ex.sets.slice(0, maxSets) : ex.sets) : [];
  const hiddenCount = ex.sets ? ex.sets.length - visibleSets.length : 0;

  const setChildren = visibleSets.map((s: any, si: number) => ({
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
              { type: "div", props: { style: { width: 56, height: 56, borderRadius: 28, background: C.badgeBg, color: C.badgeText, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, flexShrink: 0 }, children: String(globalIndex + 1) } },
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
const EXERCISES_PER_DETAIL_PAGE = 3;

function buildSummaryPage(C: any, isDark: boolean, totalPages: number) {
  const statTiles = [
    { value: DURATION,           label: "DURATION" },
    { value: String(TOTAL_SETS), label: "SETS"     },
    { value: String(TOTAL_REPS), label: "REPS"     },
    { value: VOL_DISPLAY,        label: "VOLUME"   },
  ];

  const makeTile = ({ value, label }: any) => ({
    type: "div",
    props: {
      style: { background: C.tileBg, borderRadius: 24, paddingTop: 18, paddingBottom: 14, paddingLeft: 16, paddingRight: 16, flex: 1, display: "flex", flexDirection: "column", alignItems: "center" },
      children: [
        { type: "div", props: { style: { fontSize: 58, fontWeight: 800, color: C.textPrimary, lineHeight: 1, display: "flex" }, children: value } },
        { type: "div", props: { style: { fontSize: 20, fontWeight: 700, color: C.textMuted, marginTop: 8, textTransform: "uppercase", letterSpacing: "0.12em", display: "flex" }, children: label } },
      ],
    },
  });

  const previewExercises = ALL_EXERCISES.slice(0, 3);
  const exerciseRows = previewExercises.map((ex, i) =>
    makeExerciseRow(C, ex, i, i === previewExercises.length - 1, 3)
  );

  const moreExCount = ALL_EXERCISES.length - previewExercises.length;
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
      style: { display: "flex", flexDirection: "column", width: STORY_W, height: STORY_H, background: C.bg, paddingTop: PAD_TOP, paddingBottom: PAD_BOT, paddingLeft: PAD_H, paddingRight: PAD_H },
      children: [
        makeHeader(C, isDark, DATE),
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
        { type: "div", props: { style: { height: 1, background: C.divider, marginBottom: 16, display: "flex" } } },
        makeSectionLabel(C, "Exercises"),
        {
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "column" },
            children: moreExHint ? [...exerciseRows, moreExHint] : exerciseRows,
          },
        },
        makeFooter(C, USER_NAME, 1, totalPages),
      ],
    },
  };
}

function buildDetailPage(C: any, isDark: boolean, exerciseSlice: any[], globalOffset: number, pageNum: number, totalPages: number) {
  const exerciseRows = exerciseSlice.map((ex, i) =>
    makeExerciseRow(C, ex, globalOffset + i, i === exerciseSlice.length - 1, null)
  );

  return {
    type: "div",
    props: {
      style: { display: "flex", flexDirection: "column", width: STORY_W, height: STORY_H, background: C.bg, paddingTop: PAD_TOP, paddingBottom: PAD_BOT, paddingLeft: PAD_H, paddingRight: PAD_H },
      children: [
        makeHeader(C, isDark, DATE),
        { type: "div", props: { style: { height: 1, background: C.divider, marginBottom: 16, display: "flex" } } },
        makeSectionLabel(C, `Exercises — Page ${pageNum} of ${totalPages}`),
        {
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "column" },
            children: exerciseRows,
          },
        },
        makeFooter(C, USER_NAME, pageNum, totalPages),
      ],
    },
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
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

  for (const themeName of ["light", "dark"] as ThemeKey[]) {
    const C      = THEMES[themeName];
    const isDark = themeName === "dark";

    // Paginate exercises into detail pages
    const detailSlices: { slice: any[]; offset: number }[] = [];
    for (let i = 0; i < ALL_EXERCISES.length; i += EXERCISES_PER_DETAIL_PAGE) {
      detailSlices.push({ slice: ALL_EXERCISES.slice(i, i + EXERCISES_PER_DETAIL_PAGE), offset: i });
    }
    const totalPages = 1 + detailSlices.length;

    const pages = [
      buildSummaryPage(C, isDark, totalPages),
      ...detailSlices.map(({ slice, offset }, i) =>
        buildDetailPage(C, isDark, slice, offset, i + 2, totalPages)
      ),
    ];

    for (let i = 0; i < pages.length; i++) {
      const svg   = await satori(pages[i] as any, satoriOpts);
      const resvg = new Resvg(svg, { fitTo: { mode: "width", value: STORY_W } });
      const png   = resvg.render().asPng();
      const out   = `/home/ubuntu/workout-card-${themeName}-p${i + 1}.png`;
      writeFileSync(out, png);
      console.log(`✅  Saved ${out}`);
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
