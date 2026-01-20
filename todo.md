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
