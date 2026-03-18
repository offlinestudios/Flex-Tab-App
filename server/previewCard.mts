/**
 * Standalone preview script — renders the single-page workout card (Concept B).
 * Run with:  npx tsx server/previewCard.mts
 */
import { writeFileSync } from "fs";
import { INTER_REGULAR_B64, INTER_BOLD_B64 } from "./fontData.js";
import { FLEXTAB_ICON_B64, FLEXTAB_ICON_WHITE_B64 } from "../client/src/lib/flextabIconB64.js";

const fontRegular = Buffer.from(INTER_REGULAR_B64, "base64");
const fontBold    = Buffer.from(INTER_BOLD_B64,    "base64");

const STORY_W = 1080;
const STORY_H = 1920;
const PAD_H   = 80;   // left/right padding
const PAD_TOP = 120;  // just below Instagram profile bar
const PAD_BOT = 260;  // just above Instagram caption/share area
const USABLE_H = STORY_H - PAD_TOP - PAD_BOT; // 1540px
const CONTENT_W = STORY_W - PAD_H * 2;        // 920px

// ── Fixed element heights ─────────────────────────────────────────────────────
const H_HEADER      = 88 + 28;   // logo(72) + text + marginBottom = 116
const H_TILE_ROW    = 120;       // height of each tile row in the 2x2 grid
const H_TILE_GAP    = 12;        // gap between the two tile rows
const H_STAT_STRIP  = H_TILE_ROW * 2 + H_TILE_GAP; // 252px total for 2x2 grid
const H_STAT_MB     = 24;
const H_DIVIDER     = 1 + 16;    // line + marginBottom
const H_SECTION_LBL = 26 + 16;   // text + marginBottom
const H_FOOTER      = 1 + 16 + 26 + 14; // border + paddingTop + text + paddingBottom = 57
const H_EX_HEADER   = 72 + 12;   // accent band height + gap below chips
const H_EX_GAP      = 20;        // gap between exercises
const CHIPS_PER_ROW = 3;
const CHIP_GAP      = 14;

const H_CHROME = H_HEADER + H_STAT_STRIP + H_STAT_MB + H_DIVIDER + H_SECTION_LBL + H_FOOTER;

// ── Sample data ───────────────────────────────────────────────────────────────
const SAMPLE = {
  date: "Tuesday, Mar 18, 2026",
  duration: "88:35",
  totalSets: 18,
  totalReps: 188,
  volumeDisplay: "52.0k",
  userName: "julianross",
  exercises: [
    { name: "Hip Thrusts",          totalSets: 5, sets: [{n:1,r:10,w:135},{n:2,r:10,w:225},{n:3,r:10,w:315},{n:4,r:5,w:405},{n:5,r:5,w:405}] },
    { name: "Squats",               totalSets: 4, sets: [{n:1,r:10,w:225},{n:2,r:8,w:275},{n:3,r:5,w:315},{n:4,r:5,w:315}] },
    { name: "Good Mornings",        totalSets: 3, sets: [{n:1,r:10,w:135},{n:2,r:10,w:135},{n:3,r:8,w:155}] },
    { name: "Standing Calf Raises", totalSets: 3, sets: [{n:1,r:20,w:385},{n:2,r:20,w:385},{n:3,r:20,w:385}] },
    { name: "Hip Abductor",         totalSets: 3, sets: [{n:1,r:10,w:215},{n:2,r:10,w:215},{n:3,r:10,w:215}] },
  ],
};

// ── Compute adaptive chip height ──────────────────────────────────────────────
function computeChipH(exercises: typeof SAMPLE.exercises): number {
  const numEx = exercises.length;
  // Total chip rows across all exercises
  const totalChipRows = exercises.reduce((sum, ex) => sum + Math.ceil(ex.sets.length / CHIPS_PER_ROW), 0);
  // Extra chip-row gaps (within exercises that have >1 chip row)
  const extraChipGaps = exercises.reduce((sum, ex) => {
    const rows = Math.ceil(ex.sets.length / CHIPS_PER_ROW);
    return sum + Math.max(0, rows - 1) * CHIP_GAP;
  }, 0);
  const fixedExercise = numEx * H_EX_HEADER + (numEx - 1) * H_EX_GAP + extraChipGaps;
  const available = USABLE_H - H_CHROME - fixedExercise;
  const chipH = Math.floor(available / totalChipRows);
  // Clamp between min readable (70px) and max aesthetic (120px)
  return Math.max(70, Math.min(150, chipH));
}

// ── Render helper ─────────────────────────────────────────────────────────────
async function render(tree: any, outPath: string) {
  const satori    = (await import("satori")).default;
  const { Resvg } = await import("@resvg/resvg-js");
  const svg = await satori(tree, {
    width: STORY_W, height: STORY_H,
    fonts: [
      { name: "Inter", data: fontRegular, weight: 400, style: "normal" },
      { name: "Inter", data: fontBold,    weight: 800, style: "normal" },
    ],
  });
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: STORY_W } });
  writeFileSync(outPath, resvg.render().asPng());
  console.log("  ✅ ", outPath);
}

// ── Theme ─────────────────────────────────────────────────────────────────────
const LIGHT = {
  bg:          "linear-gradient(160deg, #e8edf6 0%, #dce4f0 40%, #cdd8ec 100%)",
  tileBg:      "rgba(255,255,255,0.80)",
  divider:     "rgba(15,23,42,0.10)",
  textPrimary: "#0f172a",
  textMuted:   "#64748b",
  textFooter:  "#94a3b8",
  badgeBg:     "#0f172a",
  badgeText:   "#ffffff",
  chipBg:      "rgba(15,23,42,0.06)",
  setNumColor: "#1e3a5f",
  setNumWeight: 700 as const,
  exHeaderBg:  "rgba(15,23,42,0.07)",
  accentBar:   "#0f172a",
  setsBadgeBg: "rgba(15,23,42,0.10)",
};

const DARK = {
  bg:          "linear-gradient(160deg, #0a0f1e 0%, #0d1526 50%, #060b16 100%)",
  tileBg:      "rgba(255,255,255,0.06)",
  divider:     "rgba(255,255,255,0.08)",
  textPrimary: "#f1f5f9",
  textMuted:   "#64748b",
  textFooter:  "#334155",
  badgeBg:     "rgba(255,255,255,0.12)",
  badgeText:   "#f1f5f9",
  chipBg:      "rgba(255,255,255,0.06)",
  setNumColor: "#94a3b8",
  setNumWeight: 600 as const,
  exHeaderBg:  "rgba(255,255,255,0.06)",
  accentBar:   "#3b82f6",
  setsBadgeBg: "rgba(255,255,255,0.10)",
};

// ── Build card ────────────────────────────────────────────────────────────────
function buildCard(data: typeof SAMPLE, isDark: boolean) {
  const C = isDark ? DARK : LIGHT;
  const iconSrc = isDark ? FLEXTAB_ICON_WHITE_B64 : FLEXTAB_ICON_B64;
  const chipH = computeChipH(data.exercises);

  // Font sizes derived from chip height — clear hierarchy: numbers bold, units regular
  const chipValueFontSize = Math.round(chipH * 0.44);  // reps/weight number (bold)
  const chipLabelFontSize = Math.round(chipH * 0.22);  // "Set N" label
  const chipUnitFontSize  = Math.round(chipH * 0.22);  // "reps" / "lbs" unit

  // ── Header ────────────────────────────────────────────────────────────────
  const headerEl = {
    type: "div", props: {
      style: { display: "flex", alignItems: "center", gap: 20, marginBottom: 28 },
      children: [
        { type: "img", props: { src: iconSrc, width: 72, height: 72, style: { borderRadius: 18, flexShrink: 0 } } },
        { type: "div", props: {
          style: { display: "flex", flexDirection: "column", gap: 4 },
          children: [
            { type: "div", props: { style: { fontSize: 42, fontWeight: 800, color: C.textPrimary, display: "flex" }, children: "FlexTab" } },
            { type: "div", props: { style: { fontSize: 26, color: C.textMuted, display: "flex" }, children: data.date } },
          ],
        }},
      ],
    },
  };

  // ── Stat strip ────────────────────────────────────────────────────────────
  const stats = [
    { v: data.duration,              l: "DURATION" },
    { v: String(data.totalSets),     l: "SETS"     },
    { v: String(data.totalReps),     l: "REPS"     },
    { v: data.volumeDisplay,         l: "VOLUME"   },
  ];
  // 2×2 tile grid — two rows of two tiles each
  const tileEl = (s: { v: string; l: string }, isRight: boolean) => ({
    type: "div", props: {
      style: {
        flex: 1,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: C.tileBg,
        borderRadius: 20,
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
    type: "div", props: {
      style: { display: "flex", flexDirection: "column", gap: H_TILE_GAP, marginBottom: H_STAT_MB },
      children: [
        { type: "div", props: { style: { display: "flex", flexDirection: "row" }, children: [tileEl(stats[0], false), tileEl(stats[1], true)] } },
        { type: "div", props: { style: { display: "flex", flexDirection: "row" }, children: [tileEl(stats[2], false), tileEl(stats[3], true)] } },
      ],
    },
  };

  // ── Exercises ─────────────────────────────────────────────────────────────
  const exerciseEls = data.exercises.map((ex, ei) => {
    // Group sets into rows of CHIPS_PER_ROW
    const chipRows: (typeof ex.sets[0])[][] = [];
    for (let i = 0; i < ex.sets.length; i += CHIPS_PER_ROW) {
      chipRows.push(ex.sets.slice(i, i + CHIPS_PER_ROW));
    }

    const fixedChipW = Math.floor((CONTENT_W - (CHIPS_PER_ROW - 1) * CHIP_GAP) / CHIPS_PER_ROW);
    const chipRowEls = chipRows.map((row, ri) => {
      return {
      type: "div", props: {
        style: { display: "flex", flexDirection: "row", gap: CHIP_GAP, marginTop: ri === 0 ? 0 : CHIP_GAP },
        children: row.map(s => ({
          type: "div", props: {
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
              // Set label
              { type: "div", props: { style: { fontSize: chipLabelFontSize, fontWeight: C.setNumWeight, color: C.setNumColor, display: "flex" }, children: `Set ${s.n}` } },
              // Reps row
              { type: "div", props: {
                style: { display: "flex", alignItems: "baseline", gap: 4 },
                children: [
                  { type: "div", props: { style: { fontSize: chipValueFontSize, fontWeight: 800, color: C.textPrimary, display: "flex", lineHeight: 1 }, children: String(s.r) } },
                  { type: "div", props: { style: { fontSize: chipUnitFontSize, fontWeight: 400, color: C.textMuted, display: "flex" }, children: " reps" } },
                  ...(s.w > 0 ? [
                    { type: "div", props: { style: { fontSize: chipUnitFontSize, fontWeight: 400, color: C.textMuted, display: "flex" }, children: " · " } },
                    { type: "div", props: { style: { fontSize: chipValueFontSize, fontWeight: 800, color: C.textPrimary, display: "flex", lineHeight: 1 }, children: String(s.w) } },
                    { type: "div", props: { style: { fontSize: chipUnitFontSize, fontWeight: 400, color: C.textMuted, display: "flex" }, children: " lbs" } },
                  ] : []),
                ],
              }},
            ],
          },
        })),
      },
    };
    });

    return {
      type: "div", props: {
        style: { display: "flex", flexDirection: "column", marginTop: ei === 0 ? 0 : H_EX_GAP },
        children: [
          // ── Exercise header — band with 2px accent bottom border ──────────
          { type: "div", props: {
            style: {
              display: "flex", alignItems: "center",
              background: C.exHeaderBg,
              borderRadius: 16,
              height: 72,
              marginBottom: 12,
              overflow: "hidden",
              paddingLeft: 20,
              borderBottom: `2px solid ${C.accentBar}`,
            },
            children: [
              // Number badge
              { type: "div", props: { style: { width: 52, height: 52, borderRadius: 26, background: C.badgeBg, color: C.badgeText, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, flexShrink: 0 }, children: String(ei + 1) } },
              // Exercise name
              { type: "div", props: { style: { flex: 1, fontSize: 40, fontWeight: 800, color: C.textPrimary, display: "flex", marginLeft: 16, letterSpacing: "-0.01em" }, children: ex.name } },
              // Sets badge
              { type: "div", props: {
                style: { background: C.setsBadgeBg, borderRadius: 50, paddingLeft: 20, paddingRight: 20, paddingTop: 8, paddingBottom: 8, marginRight: 16, display: "flex", flexShrink: 0 },
                children: { type: "div", props: { style: { fontSize: 22, fontWeight: 700, color: C.textMuted, display: "flex", whiteSpace: "nowrap" }, children: `${ex.totalSets} sets` } },
              }},
            ],
          }},
          // Chip rows
          ...chipRowEls,
        ],
      },
    };
  });

  // ── Footer ────────────────────────────────────────────────────────────────
  const footerEl = {
    type: "div", props: {
      style: { display: "flex", alignItems: "center", justifyContent: "center", marginTop: "auto", paddingTop: 16, borderTop: `1px solid ${C.divider}` },
      children: { type: "div", props: { style: { fontSize: 26, color: C.textFooter, fontWeight: 600, display: "flex" }, children: `@${data.userName} · flextab.app` } },
    },
  };

  return {
    type: "div", props: {
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
        { type: "div", props: { style: { display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }, children: exerciseEls } },
        footerEl,
      ],
    },
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const chipH = computeChipH(SAMPLE.exercises);
  console.log(`Adaptive chip height: ${chipH}px`);

  await render(buildCard(SAMPLE, false), "/home/ubuntu/workout-card-final-light.png");
  await render(buildCard(SAMPLE, true),  "/home/ubuntu/workout-card-final-dark.png");
}

main().catch(console.error);
