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
- [ ] Create checkpoint after implementation
