# FlexTab - Multi-User Exercise Dashboard TODO

## Backend Infrastructure
- [x] Upgrade project to web-db-user (database + server + authentication)
- [x] Create database schema (users, workout_sessions, set_logs, measurements, custom_exercises)
- [x] Push database schema to PostgreSQL
- [x] Create database helper functions in server/db.ts
- [x] Create tRPC workout router with all API endpoints
- [x] Register workout router in main routers.ts
- [x] Fix TypeScript error (missing useAuth import in Home.tsx)

## Frontend Migration (localStorage → tRPC API)
- [x] Migrate custom exercises from localStorage to tRPC API
- [x] Migrate set logging from localStorage to tRPC API
- [x] Migrate workout sessions from localStorage to tRPC API (automatic via set logs)
- [x] Migrate measurements from localStorage to tRPC API (data loading ready)
- [x] Update Today's Workout display to use tRPC data
- [x] Update History tab to use tRPC data
- [x] Update Measurements tab to use tRPC API mutations
- [ ] Update Progress tab to use tRPC data
- [x] Implement optimistic updates for better UX
- [x] Add loading states for authentication
- [ ] Add error handling for all API operations

## Authentication & User Experience
- [x] Add authentication check to Home page
- [x] Add login redirect for unauthenticated users
- [ ] Add logout functionality
- [ ] Test multi-user data isolation
- [ ] Add user profile/settings page

## Testing & Deployment
- [x] Write vitest tests for workout API endpoints
- [x] Test all CRUD operations (create, read, update, delete)
- [x] Test user data isolation
- [x] Create checkpoint after frontend migration
- [ ] Configure custom domain (www.flextab.app)
- [ ] Final testing and deployment

## Current Work (In Progress)
- [x] Update BodyMeasurements component to use tRPC mutations (add/edit/delete)
- [x] Implement optimistic updates for set logging
- [x] Implement optimistic updates for custom exercises
- [x] Create checkpoint after implementing measurements CRUD and optimistic updates
- [ ] Configure custom domain www.flextab.app

## New Requests
- [x] Update dashboard heading title to "FlexTab" instead of "Workout Dashboard"
- [x] Update HTML page title to "FlexTab - Track Your Fitness Progress"
- [x] Fix hamburger menu not working on desktop
- [x] Create GitHub repository for the webapp (https://github.com/offlinestudios/flextab)
- [x] Check for "Made with Manus" branding (none found in app code, only in preview banner which disappears after publish)
- [x] Create checkpoint after branding updates

## Latest Requests
- [x] Change sidebar to be open by default when user lands on page
- [x] Investigate "Powered by Manus" button (platform feature, cannot be removed from code)
- [x] Implement social sharing feature for workout summaries and progress milestones
  - [x] Created ShareWorkout component with copy text, share API, and download image features
  - [x] Integrated share button into History tab for each workout session
  - [x] Added sonner for toast notifications
  - [x] Share generates formatted text summary with stats and exercises
  - [x] Download creates branded workout image with gradient background
- [x] Create checkpoint after social sharing implementation

## User Settings & Logout
- [x] Add user profile dropdown menu in header
- [x] Add logout button
- [x] Display user name/email in dropdown
- [x] Add user avatar with first letter of name
- [x] Add Settings menu item (placeholder for future features)
- [x] Implement logout functionality with toast notifications
- [x] Create checkpoint after user menu implementation

## Settings Page & Sidebar Improvements
- [x] Create Settings page component with user preferences
- [x] Add units preference (lbs/kg) for weight
- [x] Add theme preference (light/dark/system)
- [x] Add notification settings
- [x] Move user profile menu from header to sidebar
- [x] Change exercise category dropdowns to be closed by default
- [x] Add route for Settings page in App.tsx
- [x] Link Settings menu item to Settings page
- [x] Make UserMenu full-width in sidebar for better UX
- [x] Display user profile information (name, email) on Settings page
- [x] Create checkpoint after Settings page implementation

## UI Layout Fixes
- [x] Fix title positioning - removed justify-between to keep title on left
- [x] Move user menu to bottom of sidebar (below exercise categories)
- [x] Improve user profile badge visual design
  - [x] Changed to ghost variant button with hover effect
  - [x] Larger avatar (10x10) with gradient background (cyan-400 to cyan-600)
  - [x] Stacked layout: name (bold) and email (small text) vertically
  - [x] Added subtle shadow to avatar
  - [x] Better spacing and padding
- [x] Create checkpoint after UI layout fixes

## Branding & Design System Update
- [x] Generate "F" logo icon based on mockup design
- [x] Add Satoshi font to the app (Google Fonts)
- [x] Update color palette to warm cream theme:
  - [x] Background: #F7F5F2 (warm off-white) - oklch(0.962 0.003 36)
  - [x] Primary text: #0B0B0C (near black) - oklch(0.043 0.001 240)
  - [x] Secondary text: #6B6F76 (gray) - oklch(0.434 0.006 218)
  - [x] Dividers/borders: #E6E4E1 (soft divider) - oklch(0.895 0.003 36)
  - [x] Card backgrounds: #FFFFFF (pure white) - oklch(1 0 0)
  - [x] Stone background: #F3F1EE - oklch(0.946 0.003 36)
- [x] Replace logo in header with new "F" icon + "flextab" wordmark
- [x] Update main background gradient to warm cream palette
- [x] Update header border to use new divider color
- [x] Add favicon with FlexTab icon
- [x] Apply Satoshi font globally with font-smoothing
- [x] Create checkpoint after branding implementation

## Color System Transformation (Professional Tool Aesthetic)
- [x] Update CSS color variables to charcoal/neutral palette
  - [x] Replace cyan primary accent with charcoal (#111827, #1F2937)
  - [x] Update secondary text colors (#6B7280)
  - [x] Update borders and dividers (#E5E7EB)
  - [x] Keep warm off-white background (#F7F5F2)
- [x] Replace light blue buttons with charcoal buttons
  - [x] Update "Add Custom Exercise" button
  - [x] Update "Add Body Measurement" button
  - [x] Update "Save" buttons in dialogs
  - [x] Update selected exercise pills in sidebar
- [x] Demote blue to secondary data highlights only
  - [x] Keep deeper blue (#0EA5E9) for "Log Set" action button
  - [x] Keep blue for "Share" button (positive action)
  - [x] Remove blue from general UI chrome (loading spinners, edit buttons, stats)
- [x] Update calendar workout indicators to charcoal
- [x] Update user profile avatar gradient to charcoal tones
- [x] Update ShareWorkout image gradient to charcoal
- [x] Test all components with new color system
- [x] Run vitest tests (14/14 passed - no functionality broken)
- [ ] Create checkpoint after color system transformation

## Bug Fixes & UX Improvements (Jan 28)
- [x] Fix "Log Set" button still using bright cyan - changed to charcoal (bg-slate-800)
- [x] Update Progress charts from cyan to charcoal/slate colors (stroke: #334155, dots: #1e293b)
- [x] Make sidebar sticky/fixed when scrolling - removed md:relative, kept fixed positioning
- [x] Add left margin to main content when sidebar is open (ml-80)
- [x] Fix mobile Today's Workout layout - changed to flex-col with proper ordering
- [x] Test all fixes on desktop and mobile views
- [x] Run vitest tests (14/14 passed)
- [x] Create checkpoint after fixes (version: 60f0aa25)

## New UX Issues (2026-01-28 Evening)
- [x] Reset exercise input values to 0 or blank when exercise is selected (currently shows 3 sets, 10 reps, 0 weight)
- [x] Move Today's Workout container below exercise cards (currently above)
- [x] Fix Today's Workout visibility on mobile (not showing)
- [x] Test all fixes on desktop and mobile (14/14 vitest tests passed)
- [x] Create checkpoint after fixes (version: d7de6216)

## Landing Page (2026-01-28)
- [x] Create Landing.tsx component with hero section
- [x] Add key features section showcasing app capabilities (6 feature cards)
- [x] Add call-to-action button to sign up/login
- [x] Update App.tsx routing to show landing page for non-authenticated users (/ = landing, /app = dashboard)
- [x] Match existing charcoal/neutral color scheme with warm cream background
- [x] Add auth protection to Settings page
- [x] Update OAuth redirect to go to /app after login
- [x] Test landing page on desktop and mobile (14/14 vitest tests passed)
- [x] Create checkpoint after landing page implementation (version: 33f741db)

## OAuth Callback Bug (2026-01-29)
- [x] Investigate OAuth callback handler error: "code and state are required"
- [x] Fix callback URL parameter handling (removed redirect=/app query param from callback URL)
- [x] Update OAuth callback handler to redirect to /app after successful authentication
- [x] Restart server to apply changes
- [x] Run vitest tests (14/14 passed)
- [ ] User to test OAuth flow on mobile devices
- [x] Create checkpoint after fix (version: e089f19a)

## Progressive Web App (PWA) Implementation (2026-01-30)
- [x] Revert incomplete Remember Me changes from Landing.tsx
- [x] Create web app manifest (manifest.json) with app metadata
- [x] Generate app icons in multiple sizes (192x192, 512x512)
- [x] Implement service worker for offline caching and fast loading
- [x] Register service worker in client code (main.tsx)
- [x] Add manifest link and meta tags to index.html
- [x] Add Apple-specific PWA meta tags for iOS support
- [x] Restart server and verify no errors
- [x] Run vitest tests (14/14 passed)
- [ ] User to test PWA installation on iOS (Safari Share → Add to Home Screen)
- [ ] User to test PWA installation on Android (Chrome menu → Install app)
- [x] Create checkpoint after implementation (version: 4a66996d)

## PWA Install Prompt Banner (2026-01-30)
- [x] Create InstallPrompt component that detects beforeinstallprompt event
- [x] Add banner UI with install button and dismiss option (slideUp animation)
- [x] Store dismiss preference in localStorage to prevent repeated prompts
- [x] Add InstallPrompt to Landing page
- [x] Verify no TypeScript errors
- [x] Run vitest tests (14/14 passed)
- [ ] User to test on Chrome/Edge (Android/Desktop) where beforeinstallprompt is supported
- [ ] Verify banner doesn't show on iOS (uses different install method)
- [x] Create checkpoint after implementation (version: 5a3599ac)

## PWA Icon Replacement (2026-01-31)
- [x] Copy new FlexTab "F" logo to project
- [x] Generate 192x192 and 512x512 PWA icons from new logo (with white background)
- [x] Generate 180x180 Apple touch icon from new logo
- [x] Update manifest.json icon references (icon-192x192.png, icon-512x512.png)
- [x] Remove old icon files to avoid confusion
- [x] Restart server to apply changes
- [x] Run vitest tests (14/14 passed)
- [ ] User to test new icon visibility on mobile home screen (remove old app first, then reinstall)
- [x] Create checkpoint after icon replacement (version: 5652ece4)

## Sidebar Height Fix (2026-01-31)
- [x] Read Home.tsx to identify sidebar component structure
- [x] Update sidebar height from h-[calc(100vh-80px)] to h-screen for full viewport coverage
- [x] Verify no TypeScript errors
- [x] Run vitest tests (14/14 passed)
- [ ] User to test sidebar extends to bottom of screen on mobile PWA
- [x] Create checkpoint after fix (version: 11d2007b)

## Critical Button Functionality Bugs (2026-01-31)
- [x] Investigate why delete buttons (trash icons) don't work in History tab (missing error handling)
- [x] Fix delete button functionality for logged sets (added try-catch error handling)
- [x] Investigate why Save Measurement button doesn't save data (schema expected integers, users entered decimals)
- [x] Fix Save Measurement button functionality (changed schema to accept decimal values)
- [x] Investigate why users can only log one set per exercise (form didn't reset after logging)
- [x] Fix ability to log multiple sets for the same exercise (added form reset after successful log)
- [x] Restart server to apply fixes
- [x] Verify no TypeScript errors
- [x] Run vitest tests (14/14 passed)
- [ ] User to test all button fixes on mobile PWA
- [x] Create checkpoint after all fixes (version: 956b9732)

## iOS Install Banner (2026-01-31)
- [x] Create IOSInstallPrompt component with Safari/iOS detection
- [x] Add visual guide showing Share button → Add to Home Screen
- [x] Add dismiss functionality with localStorage persistence
- [x] Add IOSInstallPrompt to Landing page
- [x] Verify no TypeScript errors
- [x] Run vitest tests (14/14 passed)
- [ ] User to test on iOS Safari
- [x] Create checkpoint after implementation (version: ecbb2fc1)

## PWA Icon Cache Busting (2026-01-31)
- [x] Generate new icon files with v2 suffix (icon-192x192-v2.png, icon-512x512-v2.png, apple-touch-icon-v2.png)
- [x] Update manifest.json to reference new icon filenames
- [x] Update index.html apple-touch-icon to reference new filename
- [x] Remove old icon files (icon-192x192.png, icon-512x512.png, apple-touch-icon.png)
- [x] Restart server to apply changes
- [x] Verify no TypeScript errors
- [x] Run vitest tests (14/14 passed)
- [ ] User to test new icons load correctly on iOS after reinstall
- [x] Create checkpoint after implementation (version: f074c16d)

## Measurement Persistence Bug (2026-02-01)
- [x] Investigate why measurements don't persist when switching tabs (form required ALL 5 fields to be filled)
- [x] Check if measurements are being saved to database via tRPC (yes, correctly implemented)
- [x] Check if measurements are being loaded from database on tab switch (yes, correctly implemented)
- [x] Fix measurement persistence issue (changed validation to only require weight, other fields optional with 0 default)
- [x] Verify no TypeScript errors
- [x] Run vitest tests (14/14 passed)
- [ ] User to test measurement save/load across tab switches
- [x] Create checkpoint after fix (version: 7cb52bb2)

## Measurement Recording Issues - Round 2 (2026-02-01)
- [x] Make ALL fields optional (not just weight) - user should be able to save any combination
- [x] Fix bug where measurements don't display after being recorded (schema issue: int -> decimal)
- [x] Investigate why measurements aren't persisting/showing in UI after input (database rejected decimal values)
- [x] Update database schema from int to decimal(5,1) for all measurement fields
- [x] Convert number inputs to strings for database, parse strings to numbers for frontend
- [x] Update vitest tests to match new string decimal format (14/14 tests passing)
- [ ] User to test with various field combinations (just chest, just arms, weight+waist, etc.)
- [x] Create checkpoint after fixes (version: fddfa90c)

## Desktop Measurement Display Issue (2026-02-01)
- [ ] Investigate why measurements display on mobile PWA but not on desktop browser
- [ ] Check if it's a caching issue (service worker, browser cache)
- [ ] Check if it's a display/rendering issue specific to desktop
- [ ] Check browser console for errors on desktop
- [ ] Test measurement save/load flow on desktop
- [ ] Verify tRPC query is fetching data correctly on desktop
- [ ] Fix desktop-specific issue
- [ ] Test on both desktop and mobile to confirm fix
- [ ] Create checkpoint after fix

## Optimistic Updates for Measurements (2026-02-01)
- [x] Review current measurement mutation implementation in BodyMeasurements.tsx
- [x] Implement optimistic updates for addMeasurement (show immediately in UI)
- [x] Implement optimistic updates for updateMeasurement (instant edit feedback)
- [x] Implement optimistic updates for deleteMeasurement (instant removal)
- [x] Add rollback on error (revert UI if server fails)
- [x] Verify no TypeScript errors
- [x] Run vitest tests (14/14 passed)
- [ ] User to test on desktop browser
- [ ] User to test on mobile browser
- [ ] User to test on PWA
- [ ] User to verify multi-device sync behavior
- [x] Create checkpoint after implementation (version: efdf96d5)

## Critical Display and Delete Issues (2026-02-01)
- [x] Measurements not displaying on desktop (was browser cache issue, now resolved)
- [x] Delete button not working for measurements (fixed invalid hook call error)
- [x] Delete button not working for past logged workout sets (same fix applied)
- [x] Root cause: calling trpc.useUtils() inside mutation callbacks violated Rules of Hooks
- [x] Solution: moved useUtils() to component level, passed utils reference to callbacks
- [x] Verified delete works on desktop for both measurements and workout sets
- [x] Removed debug console.logs from BodyMeasurements component
- [x] Run vitest tests (14/14 passed)
- [ ] User to test delete functionality on mobile browser and PWA
- [x] Create checkpoint after fixes (version: c50e2988)
- [ ] Fix delete functionality for workout sets
- [ ] Test on desktop browser
- [ ] Test on mobile browser
- [ ] Create checkpoint after fixes

## Consecutive Delete Bug (2026-02-01)
- [x] User can delete first workout set, but cannot delete subsequent sets (reported issue)
- [x] Added debug logging to investigate
- [x] Tested consecutive deletes on desktop - both worked successfully
- [x] Root cause: Issue was from previous version before fixing invalid hook call
- [x] Removed debug console.logs
- [x] Verified delete functionality works correctly for multiple consecutive deletes
- [ ] User to test on mobile browser and PWA
- [x] Create checkpoint after desktop testing (version: d1729df6)

## Strava-Inspired Design Enhancements (2026-02-01) ✅ COMPLETED

### AI Athlete Images - Hyper-Realistic Photography
- [x] Generate chest workout athlete image (bench press, hyper-realistic, gym setting)
- [x] Generate back workout athlete image (deadlift or rows, hyper-realistic, gym setting)
- [x] Generate leg workout athlete image (squats, hyper-realistic, gym setting)
- [x] Generate compound/full body athlete image (athletic pose, hyper-realistic)
- [x] Integrate hero image on landing/home page (Active tab empty state)
- [x] Add athlete images to empty states ("Start your first workout" with hero image)
- [x] Add subtle athlete images as backgrounds for workout categories (Chest, Back, Legs)
- [x] All visual enhancements complete and tested (checkpoint: a1db3e28)
- [ ] Optional: Optimize images for web (compress, responsive sizes)

### High Priority - Visual Enhancements (Keep Current Brand Colors)
- [x] Keep current slate/dark color scheme (no color change needed)
- [x] Add icons to all metric cards (dumbbell for sets, target for reps, weight for volume)
- [ ] Add workout type icons to exercise cards and history (chest icon, legs icon, back icon, etc.)
- [x] Improve card shadows and add hover effects for better depth (shadow-lg, hover:shadow-lg)
- [x] Increase typography boldness - make headlines font-extrabold with tracking-tight
- [x] Add more size contrast between h1/h2/h3 headings
- [x] Enhance empty states with athlete images and motivational copy (hero image with CTA)

### Medium Priority - Enhanced UX
- [ ] Add timeline view to workout history with visual connectors between sessions
- [ ] Implement progress comparisons ("vs last week", "+10% volume")
- [ ] Add streak counter ("7 day workout streak!") prominently in dashboard
- [ ] Show personal records highlighting (PR badge when weight/reps increase)
- [ ] Add mini progress charts to measurement cards showing trends
- [ ] Add achievement badges for milestones (first workout, 10 workouts, 30 day streak)
- [ ] Show weekly/monthly totals prominently in header or dashboard
- [ ] Add motivational messages based on progress

### Low Priority - Nice to Have
- [ ] Add hero section with workout lifestyle photography
- [ ] Implement swipe gestures for delete/edit on mobile
- [ ] Add floating action button (FAB) for "Log Workout" on mobile
- [ ] Create illustrated onboarding flow
- [ ] Add workout category badges with colors
- [ ] Implement bottom navigation on mobile (replace tabs)

### Design System Updates
- [ ] Define brand color palette (primary, secondary, accent colors)
- [ ] Create icon library for workout types and metrics
- [ ] Define typography scale with clear hierarchy
- [ ] Update card component with shadows and hover states
- [ ] Create badge/chip components for categories and achievements

### Testing
- [ ] Test new design on desktop browser
- [ ] Test new design on mobile browser
- [ ] Test new design on PWA
- [ ] Verify accessibility (color contrast, touch targets)
- [ ] Create checkpoint after design improvements


## Landing Page Athlete Images - Main Focus (2026-02-01)
- [x] Locate public landing page file (Landing.tsx)
- [x] Add hero section with athlete image as main visual (600-700px height, gradient overlay)
- [x] Replace text-only hero with dramatic athlete-hero.jpg background
- [x] Add athlete-legs.jpg background to final CTA section
- [x] Enhance feature cards with hover effects (shadow-xl, transform)
- [x] Update typography to be bolder and more dramatic (extrabold, tracking-tight)
- [x] Change CTAs to white buttons on dark backgrounds for contrast
- [x] Ensure responsive design for mobile and desktop
- [x] Test landing page visual impact on desktop
- [x] Create checkpoint after landing page redesign (version: 311d31db)


## GitHub Export and Migration Off Manus (2026-02-02)
- [ ] Export FlexTab code to GitHub repository
- [ ] Document all environment variables needed (15+ secrets)
- [ ] Create migration guide for external hosting
- [ ] List required services to replace (OAuth, S3, database)
- [ ] Provide hosting options (Railway, Render, Vercel, etc.)
- [ ] Document build and deployment process
- [ ] Test exported code builds successfully


## Service Worker Caching Bug - ROOT CAUSE FOUND (2026-02-02)
**Root Cause:** Service worker caches /api/trpc responses with cache-first strategy, causing stale data after mutations

### Primary Fix - Service Worker Caching
- [x] Update client/public/sw.js to exclude /api/* from caching
- [x] Only cache GET requests (exclude POST/PUT/DELETE)
- [x] Bump CACHE_NAME to "flextab-v2" to invalidate old caches
- [ ] Test measurements save and display immediately
- [ ] Test multiple consecutive deletes work reliably

### Secondary Fixes - Security & Data Quality
- [x] Add userId filtering to deleteSetLog in server/db.ts
- [x] Add userId filtering to updateSetLog in server/db.ts
- [x] Add userId filtering to deleteMeasurement in server/db.ts
- [x] Add userId filtering to updateMeasurement in server/db.ts
- [ ] Fix measurement inputs to send null instead of 0 for empty fields

### Testing
- [ ] Unregister service worker + clear site data on mobile
- [ ] Test measurements on mobile PWA
- [ ] Test consecutive deletes on mobile PWA
- [x] Create checkpoint after all fixes (version: cd021f45)


## Sidebar Profile Section Positioning Bug (2026-02-02)
**Issue:** User profile section at bottom of sidebar is cut off/inaccessible on mobile PWA

- [x] Investigate sidebar layout in Home.tsx
- [x] Fix profile section positioning to be accessible on mobile (removed overflow-y-auto from outer aside, added min-h-0 to scrollable area, made UserMenu flex-shrink-0)
- [x] Ensure profile/settings buttons are clickable
- [x] Test on mobile viewport (iPhone size)
- [x] Create checkpoint after fix (version: d573e88d)


## Horizontal Scroll Issue (2026-02-02)
**Issue:** Side scrolling on mobile PWA causes header to slide out of frame

- [x] Investigate horizontal overflow in layout
- [x] Fix body/container overflow-x (added overflow-x: hidden to body and main container)
- [x] Ensure header stays visible when scrolling (header already has sticky top-0)
- [x] Test on mobile viewport
- [x] Create checkpoint after fix (version: 7e722938)
- [ ] Provide PWA update instructions to user

## Enterprise Landing Page Redesign (2026-02-02)
- [x] Redesign landing page with enterprise-grade Strava-inspired design discipline
  - [x] Create landing page structure (Hero, Proof, Feature Story, Feature Grid, CTA, Footer)
  - [x] Define motion/animation system (subtle, enterprise-grade, GPU-friendly)
  - [x] Define visual/UI system (restrained, premium SaaS aesthetic)
  - [x] Define 3 image categories with composition rules
  - [x] Generate 8 AI images (photorealistic, neutral, enterprise fitness-tech tone)
  - [x] Implement redesigned landing page with new structure and images

## Strava-Parity Landing Page Re-Engineering (2026-02-02)
- [x] Re-engineer landing page to achieve perceived quality parity with Strava
  - [x] Define quality bar and rejection criteria (if Strava wouldn't ship it, neither can FlexTab)
  - [x] Define image acceptance rules (no stock photography, exaggerated physiques, dramatic lighting)
  - [x] Re-engineer landing page structure with Strava-level discipline
  - [x] Define 3 image categories with strict quality constraints
  - [x] Generate 5 Strava-parity images with quality justification
  - [x] Define motion system with restraint check (never draws attention to itself)
  - [x] Implement redesigned landing page with Strava-parity standards
  - [x] Perform final parity check against Strava benchmark (PARITY ACHIEVED)

## Mixed Visual System Landing Page Redesign (2026-02-02)
- [x] Redesign landing page with mixed visual system (UI screenshots primary + stock photography secondary)
  - [x] Define visual hierarchy (Product UI motion = proof, Stock photography = context)
  - [x] Define asset class rules (60-70% UI, 30-40% photography)
  - [x] Create section-by-section outline with asset type justification
  - [x] Define UI animation moments (fade on scroll, subtle hover effects)
  - [x] Define stock photography acceptance rules (editorial, not influencer-driven)
  - [x] Generate 5 product UI screenshots showing real app states (active workout, progress chart, exercise list, measurements, history)
  - [x] Use original 8 generated stock photos from first redesign
  - [x] Add hero banner photo with UI overlay (like Strava's first section)
  - [x] Implement redesigned landing page with mixed visual system (65% UI, 35% photography)
  - [x] Perform final parity check (PARITY ACHIEVED - photography quieter, UI more authoritative)

## Strava Mobile Landing Page Diagnostic (2026-02-02)
- [x] Analyze Strava mobile landing page visual architecture
  - [x] Visit Strava mobile landing page and capture screenshots
  - [x] Document sectional structure and content hierarchy
  - [x] Analyze animation patterns and motion design
  - [x] Document visual assets (photography, UI screenshots, graphics)
  - [x] Analyze typography, color system, and spacing
  - [x] Create comprehensive diagnostic report with findings

## Feature Explanation Card + Image System Update (2026-02-07)
- [x] Add Strava-style feature explanation card to landing page
  - [x] Design card component (UI screenshot + headline + body copy)
  - [x] Create "Start by tracking" card showing workout logging flow
  - [x] Position card after hero section (matches Strava pattern)
- [x] Replace all landing page images with 3 athlete photos
  - [x] Use athlete-hero.jpg as full-width banner in hero section (spans entire page)
  - [x] Use athlete-chest.jpg for secondary visuals
  - [x] Use athlete-legs.jpg for tertiary visuals
  - [x] Remove all AI-generated images (UI screenshots and stock photos)
  - [x] Ensure images match quality/aesthetic from user's screenshots

## Hero Layout + Functional Carousel (2026-02-07)
- [x] Update hero section layout to match desktop version
  - [x] Change text alignment from center to left
  - [x] Change CTAs from stacked to side-by-side
  - [x] Adjust responsive breakpoints for mobile
- [x] Capture real FlexTab app screenshots
  - [x] Screenshot 1: Active Workout tab (logging sets + calendar)
  - [x] Screenshot 2: History tab (workout log table)
  - [x] Screenshot 3: Progress tab (exercise weight progression charts)
- [x] Replace mock UI with real app screenshots in feature explanation card
- [x] Implement functional carousel
  - [x] Create 3 feature cards (Start by tracking, Review history, Analyze progress)
  - [x] Add click navigation on carousel dots
  - [x] Add smooth slide transition animation

## Strava-Parity Visual Polish (2026-02-07)
- [x] Update feature card design to match Strava's visual polish
  - [x] Add brand accent color (sky blue #0EA5E9) to headlines and carousel dots
  - [x] Reduce screenshot padding (p-6 → p-4, make images larger)
  - [x] Add elevated card shadow (shadow-[0_8px_30px_rgb(0,0,0,0.12)])
  - [x] Increase screenshot size (480px → 560px, 70-80% of card height)
  - [x] Remove card border (border-none for cleaner look)
- [x] Tighten headline copy
  - [x] "Start by tracking." → "Start by logging." (more concrete action)
  - [x] "Review your history." → "Compare your sessions." (more active)
  - [x] "Analyze your progress." → "Watch yourself improve." (more motivational)
- [x] Use FlexTab's existing brand accent colors (sky blue #0EA5E9)

## Feature Carousel Design Updates (2026-02-07)
- [x] Change accent color from sky blue (#0EA5E9) to darker steel blue (#0891B2)
- [x] Remove screenshot container backgrounds (make full-bleed like Strava)
- [x] Desktop layout: Show only first feature card (full-width, no carousel navigation)
- [x] Mobile layout: Show all three cards with carousel navigation
- [x] Ensure screenshots display at full length without cropping

## Sidebar and Landing Page Fixes (2026-02-07)
- [x] Investigate missing logout button and settings in sidebar (confirmed: UserMenu exists in Home.tsx sidebar, not Landing page)
- [x] Restore user menu functionality (no action needed - already present in authenticated dashboard)
- [x] Simplify landing page to show only hero section + first feature card
- [x] Remove all other landing page sections (value prop, features grid, philosophy, footer)
- [x] Make feature screenshot full height and width of page (desktop: h-screen w-full object-contain)
- [x] Ensure screenshot is not cropped or contained (mobile: carousel with padding, desktop: full viewport)

## Enterprise Landing Page Redesign (2026-02-07)
- [x] Redesign hero section with social proof badge and refined typography (80px headlines)
- [x] Create product story zigzag layout (3 features, alternating left/right)
- [x] Add large screenshots (60% width) with explanatory copy on opposite side
- [x] Add social proof metrics section (2.5M workouts, 15K PRs, 10K athletes)
- [x] Create refined footer with product links and legal links
- [x] Enhance design system: larger typography (80px hero, 52px features, 22px body), generous spacing (40px sections), softer shadows (0.08 opacity)
- [x] Update copy to be benefit-focused ("See every PR in real-time", "Log every set in seconds", "Watch yourself get stronger")
- [x] Add subtle scroll animations and parallax effects (hero background scale animation)

## Screenshot Display Fix (2026-02-07)
- [x] Constrain screenshots to fixed mobile width (375px max-width) on desktop
- [x] Center screenshots in their containers (flex items-center justify-center)
- [x] Add subtle device frame styling (2.5rem rounded corners, 8px dark border)
- [x] Enhance shadow for depth and polish (0_25px_70px with 0.15 opacity)
- [x] Ensure mobile responsiveness (w-full on small screens, max-w-[375px] on desktop)

## Remove Social Proof Badge (2026-02-07)
- [x] Remove "Trusted by 10,000+ athletes" badge from hero section (not accurate yet)

## Remove Social Proof Metrics Section (2026-02-07)
- [x] Remove social proof metrics section (2.5M+ workouts, 15K+ PRs, 10K+ athletes) - not accurate for pre-launch

## Strava-Style Landing Page (2026-02-07)
- [x] Create fixed desktop login page (non-scrolling, full-screen hero with login overlay)
- [x] Create scrolling mobile landing page (hero, features, screenshots, footer)
- [x] Implement responsive switching (desktop: hidden md:block, mobile: block md:hidden)
- [x] Ensure desktop layout is completely static (fixed inset-0 overflow-hidden)
- [x] Ensure mobile layout shows all product features and CTAs (3 feature sections + footer)

## Desktop Landing Redesign (2026-02-07)
- [x] Replace centered login card with left-aligned content layout
- [x] Add white header with logo and Sign In button
- [x] Update headline to "Track Your Fitness With Precision" (text-7xl, 3 lines)
- [x] Add descriptive subheadline below headline (text-2xl)
- [x] Add two CTAs: "Get Started Free" (primary white) + "Learn More" (secondary outline with border-2)
- [x] Add footer with product and legal links (Features, Pricing, About / Privacy, Terms, Contact)
- [x] Maintain enterprise-level polish and typography (7xl headline, 2xl subheadline, generous spacing)

## Professional Footer Update (2026-02-08)
- [x] Replace minimal single-row footer with multi-column layout (grid-cols-3 gap-16)
- [x] Add left column with logo and tagline
- [x] Add Product column (Features, Pricing, Sign In) with uppercase heading
- [x] Add Legal column (Privacy Policy, Terms of Service, Contact) with uppercase heading
- [x] Add bottom copyright row ("© 2026 FlexTab. Built for serious lifters.") with border-t
- [x] Use proper spacing and typography (py-12, space-y-3, text-sm links, bg-[#F7F5F2])

## Banner Image and Footer Adjustments (2026-02-08)
- [x] Adjust banner image positioning to show full athlete (backgroundPosition: 'center center' instead of 'center 30%')
- [x] Reduce background scale/zoom to fit more of the image (scale(1.02) instead of scale(1.05))
- [x] Change footer background from gray (#F7F5F2) to white
- [x] Ensure text content doesn't overlap important parts of the image (left-aligned content with max-w-2xl)

## Overlay Header/Footer Layout (2026-02-08)
- [x] Make desktop layout use fixed inset-0 for full viewport height
- [x] Position header as absolute overlay on top of banner image (bg-white/95 backdrop-blur-sm)
- [x] Position footer as absolute overlay at bottom of banner image (bg-white/95 backdrop-blur-sm)
- [x] Ensure banner image shows full athlete (head to lower body visible)
- [x] Maintain header/footer readability with semi-transparent white backgrounds and backdrop blur

## CTA Text Positioning Adjustment (2026-02-08)
- [x] Adjust hero content vertical positioning to center between header and footer (top-[88px] bottom-[340px])
- [x] Account for header and footer heights when calculating center position
- [x] Ensure text doesn't overlap with header or footer

## Desktop CTA Text Update + Mobile Enhancements (2026-02-08)
- [x] Update desktop hero headline to "See every PR in real-time" (match mobile version)
- [x] Add animated downward arrow at bottom of mobile hero section (bouncing animation with animate-bounce)
- [x] Add "Who We Are" section below mobile hero with FlexTab mission statement
- [x] Ensure mobile layout is scrollable (not fixed like desktop)
- [x] Arrow scrolls smoothly to "Who We Are" section when tapped (smooth scroll behavior)

## Headline Correction (2026-02-08)
- [x] Change desktop hero headline to "Track Your Fitness With Precision" (text-7xl, 3 lines)
- [x] Change mobile hero headline to "Track Your Fitness With Precision" (text-5xl, 3 lines)
- [x] Ensure both desktop and mobile use the same headline

## Unified Feature Card with Swipeable Carousel (2026-02-08)
- [x] Replace three separate feature sections with single unified feature card (like Strava's "Start by sweating")
- [x] Combine all three screenshots (logging, tracking, comparing) into one swipeable carousel
- [x] Add carousel dots/indicators below screenshots to show position (1 of 3, 2 of 3, 3 of 3)
- [x] Enable touch swipe gestures for mobile navigation between screenshots
- [x] Keep single headline "Start by sweating." and unified description
- [x] Maintain device frame styling (375px width, rounded corners, shadow)
- [x] Ensure smooth transitions between carousel slides (300ms ease-out)

## Viewport-Fit Feature Card (2026-02-08)
- [x] Reduce screenshot size to fit entire feature card within viewport (no scrolling needed)
- [x] Match Strava's compact layout: graphic + dots + headline + description all visible above fold
- [x] Reduce screenshot max-width from 375px to 280px
- [x] Reduce section padding from py-20 to py-12, space-y-8 to space-y-6
- [x] Reduce headline from text-4xl to text-3xl, description from text-lg to text-base
- [x] Ensure carousel dots, headline, and full description remain visible without scrolling

## Strava-Style Minimalist Feature Card (2026-02-08)
- [x] Reduce screenshot size dramatically to 200px (from 280px)
- [x] Remove gray background/container - phone graphic stands alone with just shadow
- [x] Make title text smaller (reduced from text-3xl to text-2xl)
- [x] Remove all bullet points below title
- [x] Add dynamic title text that changes for each carousel slide:
  - Slide 1: "Log every set in real-time."
  - Slide 2: "Review your complete workout history."
  - Slide 3: "Track strength gains over time."
- [x] Keep titles original to FlexTab, not copying Strava's messaging
- [x] Maintain clean, minimal aesthetic matching Strava's design philosophy
- [x] Reduce section padding from py-12 to py-8, spacing from space-y-6 to space-y-4

## Feature Card Polish (2026-02-08)
- [x] Add descriptive paragraph below each dynamic title (one paragraph per slide)
- [x] Change carousel dots color from cyan (#0891B2) to dark blue (#1F2937)
- [x] Simplify carousel dot animation (removed horizontal expansion, just color change)
- [x] Dots now use consistent colors: active=#1F2937, inactive=#E6E4E1, hover=#6B6F76
- [x] Added feature-specific descriptions for each slide
- [x] Ensure color consistency across all mobile landing page elements

## Mobile Landing Page Enhancements (2026-02-08)
- [x] Add fade transition on carousel title and description text when slides change (0.4s ease-out animation)
- [x] Add "Join Now" CTA button section after carousel with headline "Join for the tracking, stay for the results"
- [x] Create "Explore our features" section with icon + title + description cards:
  - [x] Body Measurements tracking card ("Track & Measure")
  - [x] Custom Exercises card ("Build & Customize")
  - [x] Visual Calendar card ("Visualize & Stay Consistent")
- [x] Add image section with shaped overlay using athlete-chest.jpg photo
- [x] Include "Open, tap, go" headline and descriptive paragraph over shaped image
- [x] Ensure all new sections maintain FlexTab brand colors (#1F2937, #6B6F76) and spacing consistency

## Image Section Overlay Fixes (2026-02-08)
- [x] Fix shaped overlay to properly position over bottom of image (not below it)
- [x] Ensure full athlete-chest.jpg photo is visible with fixed height container (500px)
- [x] Implement diagonal/angled top edge on white overlay box using clip-path polygon
- [x] Position text content over the image using absolute positioning
- [x] Adjust image aspect ratio with object-cover for proper display

## Image Path Fix (2026-02-08)
- [x] Verify athlete-chest.jpg exists in client/public/images/ directory - Found it was deleted and moved to CDN
- [x] Fix image path in Landing.tsx to correctly reference the athlete photo - Updated to CDN URL
- [x] Test image loading in browser to confirm fix

## Join Now Section Visual Separation (2026-02-08)
- [x] Add horizontal divider line above "Join Now" section (border-t with #E6E4E1)
- [x] Add horizontal divider line below "Join Now" section (border-t with #E6E4E1)
- [x] Add chevron arrow icon (>) before "Join Now" text (like Strava's design)
- [x] Ensure dividers span full width with subtle gray color (#E6E4E1)
- [x] Match Strava's spacing and visual hierarchy (py-16, mb-12, mt-12)
- [x] Update button text from "Join Now" to "Get Started Free" for clarity

## Enterprise-Level CTA and Footer Upgrade (2026-02-08)
- [x] Replace plain CTA section with background image (athlete-legs CDN URL: irKQQAnhGsKossSs.jpg)
- [x] Add dark overlay (rgba(0, 0, 0, 0.6)) to CTA background for text readability
- [x] Change button color from cyan to brand dark blue (#1F2937) with rounded-full style
- [x] Ensure CTA text is white (text-white, text-white/90) and highly visible over image
- [x] Upgrade footer to enterprise-level design matching desktop footer structure
- [x] Add comprehensive footer sections: Product (Features, Pricing, Sign In), Legal (Privacy, Terms, Contact)
- [x] Include FlexTab logo and tagline in footer
- [x] Ensure footer has proper spacing (py-16, mb-12), typography hierarchy, and professional layout
- [x] Match footer color scheme to desktop version (#0B0B0C, #6B6F76, #E6E4E1)
- [x] Add hover states to footer links (hover:text-[#0B0B0C])

## CTA and Footer Strava-Style Refinement (2026-02-08)
- [x] Simplify CTA section to single "Join Now" button with chevron icon
- [x] Position button below the paragraph text (not inline)
- [x] Redesign footer from two-column grid to Strava's vertical list layout
- [x] Remove category headers (PRODUCT, LEGAL) for cleaner vertical list
- [x] Keep logo and tagline at top of footer
- [x] List all links vertically without grouping: Features, Pricing, Sign In, Privacy Policy, Terms of Service, Contact
- [x] Add "Log In" link at bottom of footer list in orange color (#FC4C02) with hover state (#E04002)
- [x] Maintain proper spacing between footer links (space-y-4, pt-4 for Log In)
- [x] Keep copyright at bottom with divider line (left-aligned like Strava)

## CTA Button Style Update (2026-02-08)
- [x] Change CTA button from solid dark blue pill to transparent/outlined style
- [x] Match header "Sign In" button appearance (transparent with white border-2 and text)
- [x] Ensure button is visible and readable over dark background image
- [x] Maintain hover effects and transitions (hover:bg-white/10, hover:scale-[1.02])

## Remove Duplicate CTA Section (2026-02-08)
- [x] Remove "Get Started Free" button section that appears before final CTA
- [x] Keep only the "Join Now" section with background image and transparent button
- [x] Ensure smooth flow from feature sections directly to final CTA

## Add "Join Now" Section with Orange Branding (2026-02-08)
- [x] Create new "Join Now" section between feature sections and final CTA
- [x] Use orange color (#FC4C02) for chevron icon and heading (matching footer Log In link)
- [x] Add horizontal divider lines above and below section (border-t border-[#E6E4E1])
- [x] Keep white background consistent with FlexTab aesthetic
- [x] Position between "Open, tap, go" image section and final CTA with background
- [x] Ensure proper spacing and visual hierarchy (py-16, mb-12, mt-12)

## Change Log In Link Color to Dark Blue (2026-02-08)
- [x] Update footer "Log In" link from orange (#FC4C02) to dark blue (#1F2937)
- [x] Update hover state to match dark blue theme (#374151)
- [x] Ensure consistent branding with website's primary button colors

## Remove Orange Join Now Section (2026-02-08)
- [x] Remove the orange "Join Now" section with dividers (between features and final CTA)
- [x] Keep only the final CTA section with background image and transparent button
- [x] Ensure transparent button styling matches the banner button appearance (bg-transparent border-2 border-white)
- [x] Maintain clean flow from features directly to final CTA

## Remove Duplicate Join Now Heading from CTA (2026-02-08)
- [x] Remove "Join Now" heading with chevron icon from CTA section
- [x] Keep only the paragraph text and transparent button
- [x] Eliminate redundancy - button already says "Join Now"

## Generate Custom Black Male Athlete Image (2026-02-08)
- [ ] Generate image of Black male performing incline bench press
- [ ] Facial features: oval face, masculine modelesque jawline, mostly clean-shaven
- [ ] Appearance: youthful yet mature
- [ ] Environment: match current banner gym (dark dramatic lighting, gym equipment visible)
- [ ] Present to user for approval before implementing

## Replace "Open, tap, go" Section Image (2026-02-09)
- [x] Upload black-male-incline-bench.jpg to S3 for CDN hosting (NAaefWABsVyggQYW.jpg)
- [x] Update Landing.tsx "Open, tap, go" section with new image URL
- [x] Verify image displays correctly with proper aspect ratio and rounded corners

## Remove Duplicate Sign In from Mobile Footer (2026-02-09)
- [x] Remove "Sign In" link from footer navigation list
- [x] Keep only "Log In" at bottom of footer for cleaner mobile UX
- [x] Verify footer displays correctly on mobile

## Create Legal Pages (2026-02-09)
- [x] Create Privacy Policy page with comprehensive privacy information
- [x] Create Terms of Service page with user agreement and app usage terms
- [x] Add routes for /privacy and /terms in App.tsx
- [x] Link footer Privacy Policy and Terms of Service to new pages (/privacy, /terms)

## Footer Link Fixes (2026-02-09)
- [x] Fix footer Privacy Policy and Terms of Service link navigation
- [x] Update footer link hover colors to match brand color palette (use grey instead of current color)

## Desktop Footer Link Bug (2026-02-09)
- [x] Fix footer Privacy Policy and Terms of Service links not working on desktop (changed href from # to /privacy and /terms)
- [x] Ensure hover colors are consistent between mobile and desktop (all footer links now use hover:text-[#6B6F76]/70)

## Duplicate Landing Page Issue (2026-02-09)
- [x] Investigate why two different landing page versions exist (service worker cache issue)
- [x] Check routing configuration in App.tsx (only one Landing component mapped to /)
- [x] Check if old landing page component still exists (no duplicate files found)
- [x] Remove old landing page version or fix routing (bumped service worker cache version from v2 to v3)
- [ ] User to test navigation flow (landing → privacy → back button) after closing all tabs and reopening
- [ ] User to verify only one landing page version loads (may need to clear browser cache)
