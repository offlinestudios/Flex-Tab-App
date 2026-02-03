# FlexTab Mixed Visual System Specification

**Benchmark:** Strava mobile landing page  
**Target:** FlexTab (weightlifting/strength-training SaaS)  
**Objective:** Achieve perceived quality parity with Strava using controlled mix of product UI + stock photography

---

## 1️⃣ VISUAL HIERARCHY (NON-NEGOTIABLE)

### Core Rule
**Product UI motion = proof and credibility**  
**Stock photography = context and atmosphere**  
**Copy = interpretation**

### Critical Principle
If stock photography ever feels more dominant than the UI, the design has failed.

---

## 2️⃣ ASSET CLASS DEFINITIONS

### A) Product UI Motion Assets (PRIMARY - 60-70%)

**What they are:**
- High-fidelity screenshots or screen captures from the actual FlexTab app
- Presented edge-to-edge or within a phone frame
- Lightly animated on scroll (fade, slide, count-in)
- Showing real product states (sets, reps, volume, progress, timers)

**Purpose:**
- "This is real."
- "This is how it works."
- "This is a serious system."

**Where they appear:**
- In the hero or immediately after
- In key feature sections
- More frequently than photography

**Examples of what to show:**
- Active workout session with sets/reps being logged
- Progress chart showing volume over time
- Exercise list with custom exercises
- Body measurement tracking interface
- Workout history calendar view
- Rest timer counting down

---

### B) Stock / Lifestyle Photography (SECONDARY - 30-40%)

**What they are:**
- Calm, restrained, documentary-style fitness photography
- Used to situate the product in real training contexts
- Never used alone to communicate functionality

**Purpose:**
- Human grounding
- Emotional realism
- Avoiding sterility

**Where they appear:**
- Transitional sections
- Emotional breaks between feature explanations
- Never in dense explanatory sections

**Critical constraints:**
- Never replace UI where explanation is required
- Never dominate a section visually
- Always feel subordinate to the product

---

## 3️⃣ STOCK PHOTOGRAPHY ACCEPTANCE RULES

### MUST HAVE:
- ✅ Editorial look, not influencer-driven
- ✅ Neutral or soft lighting
- ✅ Controlled, non-performative movement
- ✅ Normal physiques (not exaggerated)
- ✅ Neutral facial expressions (not dramatic)
- ✅ Real training environment feel

### MUST NOT HAVE:
- ❌ Fitness advertising aesthetic
- ❌ Flexing, hype, or celebration
- ❌ Cinematic HDR lighting
- ❌ Competes with UI for attention
- ❌ Carries the narrative alone

### Rejection Test:
**If an image could appear on a gym poster, reject it.**

---

## 4️⃣ STRAVA PARALLEL (EXPLICIT)

### How Strava uses photography:
- Sparingly and quietly
- Images do NOT explain the product — the UI does
- Photography exists to:
  - Establish environment
  - Suggest activity
  - Then get out of the way

### FlexTab must follow the same rule:
- Stock photos provide context, not explanation
- UI screenshots do the heavy lifting
- Photography never competes with product clarity

---

## 5️⃣ PAGE-LEVEL MIX RATIO

### Correct distribution:
- **60-70% product UI visuals** (static + animated)
- **30-40% stock / lifestyle photography**

### Photography is allowed in:
- Transitional sections
- Emotional breaks between feature explanations
- Hero section (as banner background with UI overlay)

### Photography is NOT allowed in:
- Dense explanatory sections
- Feature demonstrations
- Anywhere UI would be more effective

---

## 6️⃣ UI ANIMATION PRINCIPLES

### Animation goals:
- Support comprehension, not distract from it
- Reveal product capability
- Feel intentional, not decorative

### Allowed animation types:
1. **Fade-in** (opacity 0 → 1, 400-600ms)
2. **Slide-in** (translate-y 20px → 0, 400-600ms)
3. **Count-up** (numbers animating from 0 to value, 800-1200ms)
4. **Stagger** (sequential reveal of list items, 100ms delay between)

### Animation triggers:
- Scroll intersection (20% threshold)
- Initial page load (hero only)
- Never on hover (too distracting)

### Animation constraints:
- Maximum 600ms duration
- Cubic-bezier easing (0.16, 1, 0.3, 1)
- Respects prefers-reduced-motion
- Never delays content visibility

---

## 7️⃣ AVAILABLE STOCK PHOTOGRAPHY ASSETS

**From first redesign (8 images total):**

### Controlled Environment Training (4 images):
1. **Hero Athlete Squat** (Portrait 4:5) - Neutral expression, clean gym
2. **Hero Athlete Deadlift** (Portrait 4:5) - Focused, controlled setup
3. **Training Overhead Press** (Portrait 4:5) - Mid-movement, calm
4. **Training Bench Press** (Portrait 4:5) - Controlled environment

### Detail Shots (4 images):
5. **Detail Barbell Plates** (Square 1:1) - Equipment close-up
6. **Detail Dumbbell Bench** (Portrait 4:5) - Single dumbbell, quiet
7. **Detail Chalk Hands** (Square 1:1) - Ritual preparation
8. **Detail Weight Plate Rack** (Portrait 4:5) - Organization, order

**All images meet acceptance criteria:**
- Editorial, not commercial
- Neutral lighting
- No exaggerated physiques
- No dramatic emotion
- Muted color palette

---

## 8️⃣ SECTION-BY-SECTION ASSET STRATEGY

### Section 1: Hero
**Primary asset:** Stock photography (banner background)  
**Secondary asset:** Product UI screenshot (phone frame overlay)  
**Ratio:** 50/50 (exception to rule - establishes both context and product)  
**Why:** Strava does this - hero shows environment + product together  
**Stock photo:** Hero Athlete Squat or Deadlift (full-width banner)  
**UI screenshot:** Active workout session (phone frame, center-aligned)

---

### Section 2: Social Proof
**Primary asset:** None (text-only with subtle background)  
**Secondary asset:** Detail shot at very low opacity (5-10%)  
**Ratio:** 95/5  
**Why:** Transitional section, doesn't explain product  
**Stock photo:** Detail Barbell Plates (subtle background texture)

---

### Section 3: Core Value Proposition
**Primary asset:** Product UI screenshot (large, prominent)  
**Secondary asset:** Stock photography (smaller, contextual)  
**Ratio:** 70/30  
**Why:** This section explains progressive overload - UI must dominate  
**UI screenshot:** Progress chart showing volume over time  
**Stock photo:** Training Overhead Press (smaller, to the side)

---

### Section 4: Feature Proof (3 cards)
**Primary asset:** Product UI screenshots (one per card)  
**Secondary asset:** Stock photography (background, low opacity)  
**Ratio:** 80/20  
**Why:** Feature explanation requires UI dominance  
**UI screenshots:**
- Card 1: Custom exercise list
- Card 2: Body measurement tracking
- Card 3: Workout history calendar
**Stock photos:** Detail shots as subtle card backgrounds (10-15% opacity)

---

### Section 5: Final CTA
**Primary asset:** None (clean, text-focused)  
**Secondary asset:** Stock photography (very subtle background)  
**Ratio:** 90/10  
**Why:** CTA should be uncluttered  
**Stock photo:** Detail Chalk Hands (very low opacity, 5-10%)

---

### Section 6: Footer
**Primary asset:** None  
**Secondary asset:** None  
**Ratio:** N/A  
**Why:** Footer is utility navigation

---

## 9️⃣ IMPLEMENTATION CHECKLIST

- [ ] Hero has banner photo (like Strava) with UI overlay
- [ ] Product UI screenshots show real app states (not generic mockups)
- [ ] UI screenshots appear in 60-70% of sections
- [ ] Stock photography never explains functionality
- [ ] Stock photography feels quieter than UI
- [ ] Animations support comprehension, not decoration
- [ ] Overall impression matches Strava's intentionality

---

## 🔟 FINAL PARITY CHECK QUESTIONS

Before concluding, explicitly answer:

1. **If this page were viewed side-by-side with Strava's mobile landing page, would the photography feel quieter?**
   - Expected answer: YES

2. **Would the UI feel more authoritative?**
   - Expected answer: YES

3. **Would the overall experience feel equally intentional?**
   - Expected answer: YES

If any answer is NO, revise until all are YES.

---

## SUMMARY

**Visual Hierarchy:**  
Product UI (proof) > Stock Photography (context) > Copy (interpretation)

**Asset Ratio:**  
60-70% UI screenshots, 30-40% stock photography

**Stock Photography Role:**  
Context and atmosphere, never explanation

**UI Screenshot Role:**  
Proof and credibility, always explanation

**Animation Role:**  
Support comprehension, never distract

**Strava Parallel:**  
Photography establishes environment, UI explains product, then photography gets out of the way

**Ready for implementation.**
