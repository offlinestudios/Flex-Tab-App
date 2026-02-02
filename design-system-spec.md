# FlexTab Design System Specification

## Motion & Animation System

### Philosophy
Subtle, purposeful, enterprise-grade. Animation should guide attention and provide feedback, never distract or delay.

---

### Initial Page Load Animations

**What animates:**
- Hero headline and subhead
- Hero CTA button
- Hero image

**Animation type:**
- Fade in + translate up (0 → 100% opacity, 20px → 0px)

**Timing:**
- Stagger: 100ms between elements
- Duration: 400ms per element
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out with slight overshoot)

**Implementation:**
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

### Scroll-Based Animations

**What animates:**
- Section headlines
- Feature cards
- UI screenshots

**Animation type:**
- Fade in only (no translate on scroll)
- 0 → 100% opacity

**Trigger:**
- When element enters viewport (intersection observer)
- Threshold: 20% of element visible

**Timing:**
- Duration: 300ms
- Easing: `ease-out`

**Implementation:**
```css
.fade-in-on-scroll {
  opacity: 0;
  transition: opacity 300ms ease-out;
}

.fade-in-on-scroll.visible {
  opacity: 1;
}
```

---

### Interactive Animations

**CTA Buttons:**
- Hover: scale(1.02) + subtle shadow increase
- Active: scale(0.98)
- Duration: 150ms
- Easing: `ease-out`

**Feature Cards:**
- Hover: translate up 2px + shadow increase
- Duration: 200ms
- Easing: `ease-out`

**No animation on:**
- Text content
- Background colors
- Layout shifts
- Border changes

---

### Performance Constraints

**GPU-Friendly Properties Only:**
- `opacity`
- `transform` (translate, scale, rotate)
- Never animate: `width`, `height`, `margin`, `padding`, `top`, `left`

**Layout Stability:**
- No cumulative layout shift (CLS)
- Reserve space for images with aspect-ratio
- No content reflow during animation

**Mobile Optimization:**
- Reduce motion intensity on mobile (smaller translate distances)
- Shorter durations on mobile (300ms → 200ms)
- Fewer simultaneous animations

---

### Accessibility

**Respect User Preferences:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Never animate:**
- Critical content (headlines remain readable during animation)
- Navigation elements
- Form inputs

---

### Animation Inventory (Complete List)

| Element | Trigger | Type | Duration | Easing |
|---------|---------|------|----------|--------|
| Hero headline | Page load | Fade + translate up | 400ms | cubic-bezier(0.16, 1, 0.3, 1) |
| Hero subhead | Page load (100ms delay) | Fade + translate up | 400ms | cubic-bezier(0.16, 1, 0.3, 1) |
| Hero CTA | Page load (200ms delay) | Fade + translate up | 400ms | cubic-bezier(0.16, 1, 0.3, 1) |
| Section headlines | Scroll (20% visible) | Fade in | 300ms | ease-out |
| Feature cards | Scroll (20% visible) | Fade in | 300ms | ease-out |
| CTA button hover | Hover | Scale + shadow | 150ms | ease-out |
| Feature card hover | Hover | Translate up + shadow | 200ms | ease-out |

---

## Visual & UI System

### Section Backgrounds

**Pattern:**
- Alternate between white and warm cream (#F7F5F2)
- Hero: White
- Proof: Warm cream
- Feature Story: White
- Feature Grid: Warm cream
- CTA Block: White
- Footer: Warm cream

**No gradients except:**
- Subtle gradient on CTA block background (optional, very subtle)

---

### Card Styles

**Default Card:**
- Background: White
- Border: 1px solid #E6E4E1
- Border radius: 12px
- Padding: 24px (mobile), 32px (desktop)
- Shadow: None (default), subtle on hover

**Hover State:**
- Shadow: `0 4px 12px rgba(0, 0, 0, 0.08)`
- Transform: `translateY(-2px)`

**Feature Cards:**
- Same as default card
- Icon/image at top
- Headline (16px, bold)
- Description (14px, regular)

---

### Spacing Rhythm

**Vertical Spacing (Mobile):**
- Between sections: 80px
- Within sections: 40px
- Between headline and subhead: 16px
- Between subhead and CTA: 32px

**Vertical Spacing (Desktop):**
- Between sections: 120px
- Within sections: 60px
- Between headline and subhead: 20px
- Between subhead and CTA: 40px

**Horizontal Padding:**
- Mobile: 20px (container)
- Desktop: 40px (container), max-width 1200px

---

### Typography

**Headline Hierarchy:**
- H1 (Hero): 40px (mobile), 56px (desktop), bold, line-height 1.1
- H2 (Section): 32px (mobile), 40px (desktop), bold, line-height 1.2
- H3 (Feature): 20px, semibold, line-height 1.3

**Body Text:**
- Subhead: 18px (mobile), 20px (desktop), regular, line-height 1.5
- Description: 16px, regular, line-height 1.6
- Small text: 14px, regular, line-height 1.5

**Font:**
- Family: Satoshi (already in use)
- Weights: 400 (regular), 600 (semibold), 700 (bold)

---

### Button Hierarchy

**Primary CTA:**
- Background: #111827 (charcoal)
- Text: White
- Padding: 16px 32px
- Border radius: 8px
- Font size: 16px, semibold
- Min height: 48px (touch-friendly)

**Hover:**
- Background: #1F2937 (lighter charcoal)
- Transform: scale(1.02)
- Shadow: `0 4px 12px rgba(0, 0, 0, 0.15)`

**Active:**
- Transform: scale(0.98)

**No secondary buttons on landing page** (single CTA per section)

---

### UI Screenshots

**Framing:**
- Device frame: None (raw screenshot preferred)
- Border: 1px solid #E6E4E1
- Border radius: 12px
- Shadow: `0 8px 24px rgba(0, 0, 0, 0.08)`

**Placement:**
- Center-aligned on mobile
- May be offset on desktop for visual interest

**Size:**
- Max width: 90% of container (mobile)
- Max width: 600px (desktop)

---

### Color Palette

**Primary:**
- Background: #F7F5F2 (warm cream)
- Card background: #FFFFFF (white)
- Text primary: #0B0B0C (near black)
- Text secondary: #6B6F76 (gray)

**Accent:**
- Primary action: #111827 (charcoal)
- Hover: #1F2937 (lighter charcoal)
- Data highlight: #0EA5E9 (blue, sparingly)

**Borders:**
- Default: #E6E4E1 (soft divider)
- Subtle: #F3F1EE (stone)

---

### Contrast & Calm Balance

**High Contrast:**
- Headlines vs background (near-black on cream)
- CTA buttons (white on charcoal)

**Low Contrast (Calm):**
- Body text (gray on cream)
- Borders (soft dividers)
- Section backgrounds (white ↔ cream alternation)

**Avoid:**
- Pure black (#000000) — use #0B0B0C instead
- High saturation colors
- Multiple competing accent colors

---

### Image Treatment

**UI Screenshots:**
- Clean, uncluttered interface views
- Real data (not lorem ipsum)
- Consistent with app's actual design
- No device mockups (raw screenshots preferred)

**Photography:**
- See separate image strategy document
- Neutral, controlled environments
- No dramatic lighting or filters

---

## Implementation Checklist

- [ ] Set up CSS custom properties for colors
- [ ] Create animation keyframes and utility classes
- [ ] Implement intersection observer for scroll animations
- [ ] Add prefers-reduced-motion media query
- [ ] Test on mobile viewport (375px, 414px)
- [ ] Test on tablet viewport (768px)
- [ ] Test on desktop viewport (1440px)
- [ ] Verify no layout shift during animations
- [ ] Test with slow 3G throttling
- [ ] Validate accessibility (keyboard navigation, screen readers)
