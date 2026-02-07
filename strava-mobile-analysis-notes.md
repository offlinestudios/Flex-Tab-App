# Strava Mobile Landing Page Analysis Notes

**Date:** 2026-02-07  
**URL:** https://www.strava.com  
**Viewport:** Mobile (captured at 894px width)  
**Purpose:** Diagnostic analysis of visual architecture, sectional structure, animations, graphics

---

## Initial Observations from Screenshot

### Hero Section Structure
**Layout:** Split-screen composition
- **Left side:** Cycling photography (2 cyclists on road, natural environment)
- **Right side:** White card with headline + CTA buttons + app screenshot overlay
- **Photography treatment:** Full-bleed on left, extends to edge
- **UI overlay:** App screenshot (Apple Watch + phone) positioned on right side of photo

**Key Elements:**
1. Headline: "Community-Powered Motivation" (large, bold, centered)
2. Subheadline: "Track your progress and cheer each other on. Join over 100 million active people on Strava for free."
3. Login link: "Already a Member? Log In" (subtle, above CTAs)
4. 3 CTA buttons stacked vertically:
   - "Sign Up With Google" (white with Google logo)
   - "Sign Up With Apple" (white with Apple logo)
   - "Sign Up With Email" (orange, Strava brand color)
5. Terms/Privacy links below CTAs (small, gray text)
6. App screenshot overlay: Shows Apple Watch + phone with map/activity UI

**Photography characteristics:**
- Outdoor cycling scene
- Natural lighting (overcast/soft)
- 2 athletes in motion (not posed)
- Green/natural color palette
- Documentary style (not studio)
- Neutral expressions
- Real activity context

---

## Visual Architecture Observations

### 1. Split-Screen Hero Pattern
**Strava uses a 50/50 split on mobile:**
- Left: Photography (context, emotion, activity type)
- Right: Product UI + CTA (conversion, functionality proof)

**This differs from typical mobile patterns:**
- Most mobile landing pages use full-width hero with centered text
- Strava maintains desktop-like split even on mobile
- Creates visual balance between emotion (photo) and action (CTA)

**Advantages:**
- Photography doesn't compete with CTA
- App screenshot provides product proof immediately
- Clear visual hierarchy (photo = context, UI = product)

---

### 2. Photography + UI Overlay Strategy
**Strava overlays app screenshot on photography:**
- Apple Watch + phone mockup
- Shows real product UI (map, activity tracking, time)
- Positioned on right edge of cycling photo
- Creates depth (UI floats above photo)

**This is the "mixed visual system" in action:**
- Photography establishes activity context
- UI screenshot proves product functionality
- Both work together without competing

---

### 3. Header Treatment
**Strava header is minimal:**
- White background
- Orange Strava logo (left)
- Navigation menu (Activities, Features, Maps, Challenges, Subscription)
- "Log In" button (right)
- Sticky/fixed positioning (stays visible on scroll)

**No hero banner photo behind header:**
- Header is separate from hero section
- Clean, professional, SaaS aesthetic
- Prioritizes navigation clarity

---

### 4. CTA Button Hierarchy
**Strava uses 3-button stack with clear hierarchy:**
1. Google (white, neutral)
2. Apple (white, neutral)
3. Email (orange, Strava brand color - PRIMARY)

**Visual weight:**
- Email CTA is most prominent (orange vs white)
- Google/Apple are secondary options
- All 3 are equal size (no size-based hierarchy)

**This pattern:**
- Offers multiple signup paths
- Clearly indicates preferred path (email = orange)
- Maintains visual balance

---

### 5. Social Proof Integration
**"Join over 100 million active people on Strava for free"**
- Integrated into subheadline (not separate section)
- Specific number (100 million)
- Emphasizes "active people" (not just users)
- Includes "for free" (removes friction)

**Placement:**
- Above CTAs (establishes credibility before ask)
- Part of value proposition copy
- Not a separate "social proof section"

---

### 6. App Store Badges
**Visible in footer:**
- Apple App Store badge
- Google Play badge
- Standard placement (bottom of page)
- Not in hero section (keeps hero focused on web signup)

---

## Sectional Structure (from markdown extraction)

Based on extracted content, Strava mobile landing page has these sections:

### Section 1: Hero
- **Content:** Headline, subheadline, social proof, 3 CTA buttons, app screenshot
- **Visual:** Split-screen (photo left, UI right)
- **Purpose:** Conversion (signup)

### Section 2: Value Proposition (3 cards)
**"If you're active, Strava was made for you"**
- Card 1: "Start by sweating" (activity tracking)
- Card 2: "Get better by analysis" (metrics, performance)
- Card 3: "Dive into details on desktop" (training plans, route planning)
- **Pattern:** 3-column grid (likely stacks on mobile)
- **Purpose:** Explain product value

### Section 3: Secondary CTA
**"Join Us Now" button**
- Reinforces conversion opportunity
- After value prop explanation

### Section 4: Feature Highlight
**"More features, more fun"**
- Introduces specific features
- "Feature highlight: Beacon" (safety feature)
- **Purpose:** Showcase unique capabilities

### Section 5: Subscription Upsell
**"Here's how a Strava subscription takes your experience to the next level"**
- 3 benefit categories:
  * Track & Analyze
  * Share & Connect
  * Explore & Compete
- **Purpose:** Introduce premium tier

### Section 6: Final CTA
**"Explore" and "Join Us Now" buttons**
- Dual CTA (explore vs signup)
- Reinforces conversion at end of page

### Section 7: Footer
- App store badges
- Navigation links (Features, Subscription, Support, Business, etc.)
- Social media links
- Legal links (Privacy, Terms, Cookie Policy)

---

## Animation Patterns (Observed)

**Note:** Static screenshot analysis limits animation observation, but based on modern web standards and Strava's design philosophy:

**Likely animations:**
1. **Scroll-triggered fade-ins** (sections appear as user scrolls)
2. **Hover states on buttons** (subtle scale or shadow change)
3. **Smooth scrolling** (when clicking anchor links)
4. **Hero load animation** (fade-in on initial page load)

**Animation restraint:**
- No autoplay video in hero
- No carousel/slider
- No parallax scrolling
- No decorative motion

**This matches Strava's serious, performance-focused brand:**
- Motion supports comprehension, not decoration
- Animations are subtle and purposeful
- No "flashy" effects that distract from content

---

## Typography Observations

**Headline:** "Community-Powered Motivation"
- Large, bold, sans-serif
- High contrast (black on white)
- Centered alignment
- Likely 32-40px on mobile

**Subheadline:** "Track your progress..."
- Medium weight, sans-serif
- Gray color (not pure black)
- Centered alignment
- Likely 16-18px on mobile

**Body text:** Value prop cards
- Regular weight, sans-serif
- Gray color
- Left-aligned
- Likely 14-16px on mobile

**CTA buttons:**
- Bold, sans-serif
- 16px (standard button size)
- Sentence case ("Sign Up With Google")

**Font family:**
- Likely system font stack or custom sans-serif
- Clean, modern, highly legible
- No decorative fonts

---

## Color System Observations

**Primary brand color:** Orange (#FC4C02 or similar)
- Used for primary CTA ("Sign Up With Email")
- Strava logo
- Accent elements

**Neutral palette:**
- White backgrounds
- Black headlines
- Gray body text (#6B6F76 or similar)
- Light gray borders/dividers

**Photography colors:**
- Natural, muted tones
- Green (outdoor environment)
- Gray/beige (overcast lighting)
- No saturated colors

**Overall impression:**
- Restrained, professional
- Orange provides energy without overwhelming
- Neutral base allows photography to breathe

---

## Spacing & Layout Observations

**Padding/margins:**
- Generous white space around headline
- Consistent vertical rhythm between elements
- CTA buttons have adequate spacing (likely 12-16px gaps)

**Container width:**
- Hero content is centered with side padding
- Likely 90% width with 5% padding on each side
- Maintains readability on mobile

**Grid system:**
- Likely 12-column grid (standard)
- Hero uses 2-column split (6+6)
- Value prop cards likely stack on mobile (1 column)

---

## Key Takeaways for FlexTab

### What Strava does exceptionally well:

1. **Split-screen hero with photo + UI overlay**
   - Creates visual interest without chaos
   - Balances emotion (photo) and proof (UI)
   - Maintains pattern even on mobile

2. **Minimal animation**
   - No distracting motion
   - Serious, performance-focused aesthetic
   - Animations support comprehension, not decoration

3. **Clear CTA hierarchy**
   - 3 signup options with visual priority (orange = primary)
   - Consistent button sizing
   - Adequate spacing

4. **Photography restraint**
   - Documentary style, not advertising
   - Natural lighting, neutral expressions
   - Supports product, doesn't compete with it

5. **Social proof integration**
   - Specific number (100 million)
   - Integrated into value prop (not separate section)
   - Emphasizes "active people" (quality over quantity)

6. **Typography clarity**
   - High contrast headlines
   - Adequate font sizes for mobile
   - Clean, modern sans-serif

7. **Sectional structure**
   - Hero → Value Prop → Feature Highlight → Subscription → CTA → Footer
   - Logical progression from awareness to conversion
   - Multiple conversion opportunities

### What FlexTab should match:

1. ✅ Split-screen hero with photo + UI overlay (already implemented)
2. ✅ Minimal animation (fade-only, already implemented)
3. ✅ Photography restraint (already implemented)
4. ⚠️ CTA hierarchy (FlexTab has single CTA, Strava has 3 options)
5. ⚠️ Social proof integration (FlexTab has separate section, Strava integrates into hero)
6. ✅ Typography clarity (already implemented)
7. ✅ Sectional structure (already implemented)

### Potential improvements for FlexTab:

1. **Add multiple signup options** (Google, Apple, Email) with visual hierarchy
2. **Integrate social proof into hero subheadline** instead of separate section
3. **Consider adding feature highlight section** (like Strava's "Beacon" callout)
4. **Add secondary CTA after value prop** (reinforces conversion opportunity)

---

## Screenshot Analysis Complete

**Next steps:**
1. Create comprehensive diagnostic report
2. Document specific recommendations for FlexTab
3. Identify exact patterns to replicate or improve
