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
- [ ] Create checkpoint after landing page redesign
