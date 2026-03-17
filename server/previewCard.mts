/**
 * Standalone preview script — renders the redesigned workout card to PNG.
 * Run with:  npx tsx server/previewCard.mts
 */
import { writeFileSync } from "fs";
import { INTER_REGULAR_B64, INTER_BOLD_B64 } from "./fontData.js";
import { FLEXTAB_ICON_B64, FLEXTAB_ICON_WHITE_B64 } from "../client/src/lib/flextabIconB64.js";

const fontRegular = Buffer.from(INTER_REGULAR_B64, "base64");
const fontBold    = Buffer.from(INTER_BOLD_B64,    "base64");

const STORY_W = 1080;
const STORY_H = 1920;

// Instagram Stories safe zone:
//   Top ~13% (≈250px) and bottom ~18% (≈346px) are covered by UI chrome.
const PAD_H   = 80;    // horizontal padding
const PAD_TOP = 200;   // raised — header now sits higher on the card
const PAD_BOT = 380;   // bottom safe-zone padding

// ── Themes ────────────────────────────────────────────────────────────────────
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
  },
} as const;

type ThemeKey = keyof typeof THEMES;

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function buildCard(themeName: ThemeKey) {
  const C      = THEMES[themeName];
  const isDark = themeName === "dark";

  // ── Sample data (5 exercises, 3-4 sets each) ─────────────────────────────
  const allExercises = [
    {
      exercise: "Chest Dips",
      totalSets: 4,
      bestReps: 5, bestWeight: 100,
      category: "Chest",
      sets: [
        { setNumber: 1, reps: 8,  weight: 80  },
        { setNumber: 2, reps: 6,  weight: 90  },
        { setNumber: 3, reps: 5,  weight: 100 },
        { setNumber: 4, reps: 5,  weight: 100 },
      ],
    },
    {
      exercise: "Standing Military Press",
      totalSets: 3,
      bestReps: 3, bestWeight: 185,
      category: "Shoulders",
      sets: [
        { setNumber: 1, reps: 5, weight: 165 },
        { setNumber: 2, reps: 4, weight: 175 },
        { setNumber: 3, reps: 3, weight: 185 },
      ],
    },
    {
      exercise: "Upright Rows",
      totalSets: 3,
      bestReps: 7, bestWeight: 135,
      category: "Shoulders",
      sets: [
        { setNumber: 1, reps: 10, weight: 115 },
        { setNumber: 2, reps: 8,  weight: 125 },
        { setNumber: 3, reps: 7,  weight: 135 },
      ],
    },
    {
      exercise: "Seated Dumbbell Press",
      totalSets: 3,
      bestReps: 6, bestWeight: 160,
      category: "Shoulders",
      sets: [
        { setNumber: 1, reps: 8, weight: 140 },
        { setNumber: 2, reps: 7, weight: 150 },
        { setNumber: 3, reps: 6, weight: 160 },
      ],
    },
    {
      exercise: "Lateral Raises",
      totalSets: 3,
      bestReps: 10, bestWeight: 40,
      category: "Shoulders",
      sets: [
        { setNumber: 1, reps: 12, weight: 30 },
        { setNumber: 2, reps: 10, weight: 35 },
        { setNumber: 3, reps: 10, weight: 40 },
      ],
    },
  ];

  const exercises = allExercises;

  const totalSets   = exercises.reduce((s, e) => s + e.totalSets, 0);
  const totalReps   = exercises.reduce((s, e) => s + e.totalSets * e.bestReps, 0);
  const totalVolume = exercises.reduce((s, e) => s + e.totalSets * e.bestReps * e.bestWeight, 0);
  const volDisplay  = totalVolume >= 10000
    ? `${(totalVolume / 1000).toFixed(1)}k`
    : totalVolume.toLocaleString();

  const date     = "Monday, Mar 16, 2026";
  const duration = "51:45";
  const userName = "julianross";

  // ── Adaptive layout ────────────────────────────────────────────────────────
  // Budget: ~813px for exercises (no chart).
  // 5 exercises × 2 sets = ~810px  ✓  (tight but fits)
  // 4 exercises × 2 sets = 768px   ✓  (comfortable)
  // 3 exercises × 3 sets = 744px   ✓  (comfortable)
  // 6+ exercises → show best-set pill (no expanded sets)
  const numEx        = exercises.length;
  const expandSets   = numEx <= 5;
  // 5 exercises: cap at 2 sets; 4 exercises: cap at 2 sets; ≤3: cap at 3 sets
  const maxSetsPerEx = numEx >= 4 ? 2 : 3;

  // ── Stat tiles ─────────────────────────────────────────────────────────────
  const statTiles = [
    { value: duration,          label: "DURATION" },
    { value: String(totalSets), label: "SETS"     },
    { value: String(totalReps), label: "REPS"     },
    { value: volDisplay,        label: "VOLUME"   },
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

  // ── Exercise rows ──────────────────────────────────────────────────────────
  const exerciseRows = exercises.map((ex, i) => {
    const isLast = i === exercises.length - 1;

    // Best-set pill text (fallback when not expanding)
    const pillText = ex.bestWeight > 0
      ? `Best: ${ex.bestReps} reps @ ${ex.bestWeight} lbs`
      : `Best: ${ex.bestReps} reps`;

    // Expanded set rows
    const setChildren = expandSets
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
          // Header row: badge + name + pill or sets-count
          {
            type: "div",
            props: {
              style: { display: "flex", alignItems: "center", gap: 24 },
              children: [
                { type: "div", props: { style: { width: 56, height: 56, borderRadius: 28, background: C.badgeBg, color: C.badgeText, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, flexShrink: 0 }, children: String(i + 1) } },
                { type: "div", props: { style: { flex: 1, fontSize: 40, fontWeight: 800, color: C.textPrimary, display: "flex", alignItems: "center" }, children: truncate(ex.exercise, 30) } },
                {
                  type: "div",
                  props: {
                    style: { background: C.pillBg, borderRadius: 50, paddingTop: 10, paddingBottom: 10, paddingLeft: 24, paddingRight: 24, flexShrink: 0, display: "flex", alignItems: "center" },
                    children: {
                      type: "div",
                      props: {
                        style: { fontSize: 26, fontWeight: 700, color: C.pillText, whiteSpace: "nowrap", display: "flex" },
                        children: expandSets
                          ? `${ex.totalSets} set${ex.totalSets !== 1 ? "s" : ""}`
                          : pillText,
                      },
                    },
                  },
                },
              ],
            },
          },
          // Expanded set rows
          ...setChildren,
        ],
      },
    };
  });

  // ── Section label ──────────────────────────────────────────────────────────
  const sectionLabel = (text: string) => ({
    type: "div",
    props: {
      style: { display: "flex", flexDirection: "column", marginBottom: 16 },
      children: [
        { type: "div", props: { style: { fontSize: 26, fontWeight: 800, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.12em", display: "flex" }, children: text } },
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

        // ── DIVIDER ──────────────────────────────────────────────────────────
        { type: "div", props: { style: { height: 1, background: C.divider, marginBottom: 16, display: "flex" } } },

        // ── EXERCISES HEADING ────────────────────────────────────────────────
        sectionLabel("Exercises"),

        // ── EXERCISE ROWS ────────────────────────────────────────────────────
        {
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "column" },
            children: exerciseRows,
          },
        },

        // ── FOOTER ───────────────────────────────────────────────────────────
        {
          type: "div",
          props: {
            style: { display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 20, marginTop: "auto", borderTop: `1px solid ${C.divider}` },
            children: { type: "div", props: { style: { fontSize: 26, color: C.textFooter, fontWeight: 600, display: "flex" }, children: `@${userName} · flextab.app` } },
          },
        },

      ],
    },
  };
}

async function main() {
  const { default: satori } = await import("satori");
  const { Resvg }           = await import("@resvg/resvg-js");

  const renders = [
    { element: buildCard("light"), out: "/home/ubuntu/workout-card-preview-light.png" },
    { element: buildCard("dark"),  out: "/home/ubuntu/workout-card-preview-dark.png"  },
  ];

  for (const { element, out } of renders) {
    const svg = await satori(element as any, {
      width: STORY_W, height: STORY_H,
      fonts: [
        { name: "Inter", data: fontRegular, weight: 400, style: "normal" },
        { name: "Inter", data: fontBold,    weight: 700, style: "normal" },
        { name: "Inter", data: fontBold,    weight: 800, style: "normal" },
      ],
    });
    const resvg = new Resvg(svg, { fitTo: { mode: "width", value: STORY_W } });
    const png   = resvg.render().asPng();
    writeFileSync(out, png);
    console.log(`✅  Saved ${out}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
