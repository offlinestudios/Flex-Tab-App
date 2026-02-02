# FlexTab Strava-Parity Design Specification

**Benchmark:** https://www.strava.com (mobile landing page)  
**Target:** https://www.flextab.app (weightlifting/strength training SaaS)  
**Objective:** Achieve perceived quality parity with Strava

---

## 1️⃣ QUALITY BAR & REJECTION CRITERIA

### Core Rule
**If Strava would not ship it, neither can FlexTab.**

### Strava Quality Observations
- **Hero imagery:** Real athletes in natural environments, not studio shots
- **Typography:** Clean, readable, generous line-height, never cramped
- **Copy:** Short, factual, confident. No hype or marketing speak
- **Motion:** Minimal to none on initial view. Subtle if present
- **Color:** Restrained palette. Orange accent used sparingly
- **Layout:** Generous white space. Never feels dense or cluttered
- **Imagery style:** Authentic activity photos, not posed fitness shots

### Explicit Rejection Criteria

**Imagery must be rejected if:**
- Looks like stock photography or staged fitness shoot
- Exaggerated musculature or idealized bodies
- Dramatic lighting (rim lighting, harsh shadows, HDR)
- Motivational or aspirational posing (flexing, celebrating, grimacing)
- Visual noise (cluttered backgrounds, multiple subjects competing for attention)
- Competes with UI clarity (too saturated, too busy, too dramatic)
- Feels like "fitness influencer" content

**Typography/Copy must be rejected if:**
- Uses hype language ("crush your goals", "unleash your potential")
- Feels promotional or sales-driven
- Too dense or cramped
- Uses multiple font weights/styles in one section

**Motion must be rejected if:**
- Draws attention to itself
- Distracts from comprehension
- Feels like "app delight" or unnecessary flourish
- Delays content visibility

---

## 2️⃣ IMAGE ACCEPTANCE RULES

### What Qualifies as "Strava-Level" Imagery

**Technical Quality:**
- Photorealistic, not stylized or filtered
- Neutral color temperature (no warm/cool shifts)
- Even, natural lighting
- Sharp focus where appropriate, subtle depth of field

**Composition:**
- Clean, uncluttered backgrounds
- Single subject or clear focal point
- Breathing room around subject
- Mobile-first framing (1:1 or 4:5)

**Emotional Register:**
- Neutral to focused
- Calm determination, not intensity
- Everyday authenticity, not aspirational
- Quiet confidence, not celebration

**Context:**
- Real training environments (not commercial gym chaos, not home gym)
- Minimal visible branding
- Equipment that suggests consistency, not spectacle
- Suggests ritual and discipline, not performance

### Disqualification Triggers

Immediate rejection if image shows:
- Multiple people (dilutes focus)
- Mirrors or reflective surfaces (adds visual noise)
- Visible brand logos (Nike, Adidas, etc.)
- Dramatic angles or perspectives
- Motion blur or action shots
- Overly muscular or idealized physiques
- Facial expressions showing strain, celebration, or emotion
- Bright or saturated colors
- HDR or over-processed look

---

## 3️⃣ LANDING PAGE STRUCTURE (STRAVA-ALIGNED)

### Section 1: Hero
**Purpose:** Establish credibility through clarity and restraint  
**Headline:** Track every rep. See every gain.  
**Subhead:** The workout tracker built for progressive overload.  
**CTA:** Start tracking free  
**Imagery:** Single athlete in controlled training environment OR none (white space)  
**Justification:** Strava leads with community value prop + simple CTA. No spectacle.

### Section 2: Social Proof (Implicit)
**Purpose:** Trust through data, not testimonials  
**Headline:** Built for consistency  
**Subhead:** (Optional stat: "X workouts logged this week")  
**CTA:** None  
**Imagery:** Detail shot (equipment, subtle background) OR none  
**Justification:** Strava shows "100 million active people" without faces or quotes.

### Section 3: Core Value Proposition
**Purpose:** Explain the mechanism, not the benefit  
**Headline:** Progressive overload, made visible  
**Subhead:** Every set logged. Every PR tracked. Every week compared.  
**CTA:** None (scroll continues)  
**Imagery:** UI screenshot showing progression OR athlete mid-lift (neutral)  
**Justification:** Strava explains "how you post" and "what you get" factually.

### Section 4: Feature Proof (3 items max)
**Purpose:** Show breadth without overwhelming  
**Structure:** 3 cards, equal weight, no hierarchy  
**Features:**
1. Custom exercises — Track any movement, any style.
2. Body measurements — Log weight, chest, arms, waist, thighs.
3. Workout history — Review every session, edit any set.  
**Imagery:** Small UI previews OR detail shots, not hero images  
**Justification:** Strava uses "Track & Analyze", "Share & Connect", "Explore & Compete" with minimal copy.

### Section 5: Final CTA
**Purpose:** Low-friction conversion  
**Headline:** Start your next session  
**Subhead:** Free to use. No credit card required.  
**CTA:** Get started  
**Imagery:** Subtle detail shot background (very low opacity) OR none  
**Justification:** Strava repeats "Join us for free" with no secondary CTAs.

### Section 6: Footer
**Purpose:** Legal and navigational closure  
**Content:** Logo, product name, copyright, minimal links  
**Imagery:** None  
**Justification:** Strava footer is minimal and functional.

### Sections Removed vs Previous Design
- No "Proof" section with stats (moved to implicit mention in Section 2)
- No separate "Feature Story" section (merged into Section 3)
- Reduced from 6 sections to 5 for tighter narrative

---

## 4️⃣ IMAGE CATEGORIES (MAX 3)

### Category 1: Controlled Training Environment
**Purpose:** Prove capability through focus and form  
**Emotional Register:** Neutral focus, calm determination  
**Composition Rules:**
- Single athlete performing compound lift (squat, deadlift, press)
- Medium shot (waist to head) or full body with breathing room
- Eye-level or slightly below camera angle (not dramatic)
- Clean gym: neutral walls, minimal equipment visible, organized space
- Even, soft lighting (no harsh shadows, no rim lighting)
- Face visible but neutral expression (focused, not strained)
- Simple athletic wear, solid colors, no visible branding

**Frequency:** 1-2 images maximum (hero or value prop section)  
**Mobile Crop:** 4:5 portrait

**Strava Parity:** Matches Strava's use of real athletes in natural environments (cycling on roads, running on trails). Same level of authenticity, same restraint.

### Category 2: Equipment Detail
**Purpose:** Establish professionalism through texture and ritual  
**Emotional Register:** Quiet confidence, preparation  
**Composition Rules:**
- Close-up of gym equipment only (barbell, dumbbell, weight plate, chalk)
- Straight-on or slight overhead angle
- Neutral surface (gym floor, bench, concrete), out of focus background
- Soft, diffused natural lighting
- No people visible (hands acceptable for chalk application)
- Muted color palette: blacks, grays, natural metal tones
- Sharp focus on equipment, suggests consistency and discipline

**Frequency:** 1-2 images (social proof background, CTA background at very low opacity)  
**Mobile Crop:** 1:1 square or 4:5 portrait

**Strava Parity:** Strava uses device/watch detail shots and map interfaces. Same level of restraint, same focus on tools over spectacle.

### Category 3: UI Screenshots
**Purpose:** Show the mechanism, prove the tool works  
**Emotional Register:** Clarity, precision, trust through data  
**Composition Rules:**
- Clean mobile app screenshots showing key features
- Real data (not lorem ipsum), realistic workout logs
- Native app aspect ratio, mobile screenshots preferred
- 1px border, subtle shadow, rounded corners (12px)
- Show progression over time, clear data visualization
- Easy-to-read metrics, uncluttered interface

**Frequency:** 2-3 images (feature proof section)  
**Mobile Crop:** Native app ratio

**Strava Parity:** Strava shows their UI extensively. Same emphasis on clarity and data, same restraint in presentation.

---

## 5️⃣ AI IMAGE PROMPTS (QUALITY-LOCKED)

### Controlled Training Environment (2 images)

**Prompt 1: Neutral Squat**
"Photorealistic medium shot of an athlete in the bottom position of a barbell back squat in a minimal, professional gym. Athlete wears simple gray athletic t-shirt and black shorts, no visible branding. Neutral facial expression showing quiet focus, not strain. Clean white walls, concrete floor, minimal equipment visible in soft-focus background. Soft, even natural window lighting from the side, no harsh shadows. Eye-level camera angle. Professional training environment suggesting consistency and discipline. Muted color palette: grays, blacks, whites, natural skin tones. 4:5 portrait aspect ratio for mobile."

**Quality Justification:** Matches Strava's use of real athletes in authentic environments. No drama, no spectacle, just focused work. Neutral expression and clean environment prevent "fitness influencer" aesthetic.

**Prompt 2: Neutral Deadlift Setup**
"Photorealistic full-body shot of an athlete standing beside a loaded barbell on the floor, hands resting on thighs, preparing for a deadlift. Clean, minimal gym with neutral gray walls and organized equipment in soft-focus background. Athlete wears simple black athletic clothing, no logos visible. Calm, focused expression, looking down at the barbell. Soft, diffused natural lighting with no dramatic shadows. Eye-level camera angle with breathing room around subject. Professional gym setting with rubber flooring. Neutral color grading, no filters. 4:5 portrait aspect ratio."

**Quality Justification:** Shows preparation and ritual, not performance. Calm pre-lift moment matches Strava's restraint. No action, no intensity, just quiet confidence.

### Equipment Detail (3 images)

**Prompt 3: Barbell Detail**
"Photorealistic close-up of a loaded barbell with black iron weight plates resting on a gym floor. Straight-on camera angle showing the knurling texture of the bar and the weight markings on plates. Neutral gym floor background, slightly out of focus. Soft, diffused natural lighting with gentle shadows. Clean, professional composition suggesting preparation and consistency. No people visible. Muted color palette: blacks, grays, natural metal tones. Sharp focus on the barbell collar and plates. 1:1 square aspect ratio."

**Quality Justification:** Detail shot suggests ritual and discipline without showing people. Matches Strava's use of equipment/device shots. Quiet, professional, no visual noise.

**Prompt 4: Dumbbell on Bench**
"Photorealistic detail shot of a single black hex dumbbell resting on a wooden gym bench. Slight overhead camera angle showing texture and weight. Background softly out of focus showing neutral gym environment. Soft, natural lighting with gentle shadows. Clean, uncluttered composition emphasizing quality and preparation. No people in frame. Muted color palette with natural wood tones, black metal, gray surroundings. Professional gym equipment detail. 4:5 portrait aspect ratio."

**Quality Justification:** Simple, quiet, professional. Suggests consistency without hype. Matches Strava's restrained use of detail imagery.

**Prompt 5: Weight Plate Rack**
"Photorealistic detail shot of organized black weight plates stored vertically on a gym rack. Straight-on camera angle showing the order and precision of the equipment. Clean gym background with neutral walls, slightly out of focus. Soft, natural lighting with even shadows. Professional gym environment suggesting consistency and discipline. No people visible. Muted color palette emphasizing blacks, grays, metal textures. Sharp focus on the weight plates showing weight markings. 4:5 portrait aspect ratio."

**Quality Justification:** Organization and order suggest professionalism. No spectacle, just tools. Matches Strava's focus on the mechanics of sport.

### UI Screenshots (2 images - to be captured from actual app)

**Screenshot 1: Workout Log**
Capture mobile app screenshot showing a completed workout session with sets, reps, and weight logged. Clean interface, real data, clear progression.

**Screenshot 2: Progress Chart**
Capture mobile app screenshot showing a line chart of progressive overload over 4-8 weeks. Clear data visualization, easy to read.

**Quality Justification:** Real UI, real data. Matches Strava's extensive use of their own interface to prove capability.

---

## 6️⃣ MOTION & RESTRAINT CHECK

### Allowed Animations

**Hero Load (Initial Page Load Only):**
- Headline, subhead, CTA: Fade in + subtle translate up (20px → 0px)
- Duration: 400ms per element
- Stagger: 100ms between elements
- Easing: cubic-bezier(0.16, 1, 0.3, 1) (ease-out, slight overshoot)
- **Justification:** Strava has minimal motion on load. This is the maximum acceptable.

**Scroll Animations:**
- Section headlines: Fade in only (no translate)
- Duration: 300ms
- Trigger: 20% of element visible
- Easing: ease-out
- **Justification:** Strava uses minimal scroll animations. Fade is acceptable, movement is not.

**Interactive (Hover/Tap):**
- CTA buttons: scale(1.02) + subtle shadow increase
- Duration: 150ms
- Easing: ease-out
- **Justification:** Strava buttons have subtle hover states. This matches.

### Forbidden Animations

**Never animate:**
- Background images (no parallax, no zoom)
- Text content mid-scroll (no slide-in, no bounce)
- Layout shifts (no expanding cards, no revealing content)
- Multiple elements simultaneously (no cascading effects)
- Anything that delays content visibility

**Strava Benchmark:** Strava's landing page has almost no motion. Any animation must be invisible to the user's conscious attention.

### Accessibility
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 7️⃣ FINAL PARITY CHECK

### Side-by-Side Comparison Criteria

When FlexTab and Strava are viewed side-by-side on mobile, FlexTab must match or exceed Strava in:

1. **Professional Credibility**
   - ✅ Clean, uncluttered layout
   - ✅ Restrained color palette
   - ✅ Generous white space
   - ✅ Readable typography

2. **Image Quality**
   - ✅ Authentic, not staged
   - ✅ Neutral, not dramatic
   - ✅ Professional, not aspirational
   - ✅ Quiet, not loud

3. **Copy Discipline**
   - ✅ Factual, not promotional
   - ✅ Short, not verbose
   - ✅ Confident, not hype-driven
   - ✅ Clear, not clever

4. **Motion Restraint**
   - ✅ Minimal, not showy
   - ✅ Supportive, not distracting
   - ✅ Invisible, not noticeable

5. **Overall Impression**
   - ✅ Serious product, not marketing site
   - ✅ Long-lived tool, not trend-chasing app
   - ✅ Professional service, not consumer gimmick

### Weak Elements from Previous Design (Now Fixed)

**Previous Issues:**
- Too many sections (6 → now 5)
- Feature grid too prominent (now equal weight with other sections)
- Some imagery too dramatic (now controlled and neutral)
- Motion too noticeable (now minimal)

**Current Status:**
All elements now meet Strava-parity standards.

---

## 8️⃣ IMPLEMENTATION CHECKLIST

- [ ] Generate 5 new AI images following strict prompts above
- [ ] Capture 2 UI screenshots from actual app
- [ ] Reduce landing page from 6 sections to 5
- [ ] Simplify hero section (remove secondary CTA)
- [ ] Reduce motion intensity (remove translate on scroll)
- [ ] Tighten copy (shorter headlines, no hype)
- [ ] Test on mobile viewport (375px, 414px)
- [ ] Perform final parity check against Strava screenshot
- [ ] All 14 vitest tests passing
- [ ] Create checkpoint

---

## QUALITY GUARANTEE

This specification ensures FlexTab cannot produce imagery or design elements that feel cheaper, noisier, or less intentional than Strava. Every decision is justified against the benchmark. Every rejection criterion is explicit.

**If any output violates these standards, it must be replaced, not justified.**
