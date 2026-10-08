# FlexTab Store Submission Runbook

FlexTab is now wrapped with Capacitor for iOS and Android.

## App Identity

- App name: `FlexTab`
- Bundle ID / package name: `com.offlinestudios.flextab`
- Web backend default for native builds: `https://www.flextab.app`
- Native web assets folder: `dist/public`

## Build Commands

```bash
npm ci --legacy-peer-deps
npm run mobile:sync
```

Open native projects:

```bash
npm run mobile:ios
npm run mobile:android
```

`mobile:ios` opens Xcode. `mobile:android` opens Android Studio.

## Required Environment

Set these before production web/mobile builds if they differ from defaults:

```bash
VITE_API_BASE_URL=https://www.flextab.app
VITE_PUBLIC_APP_URL=https://www.flextab.app
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Apple App Store

1. Enroll in the Apple Developer Program.
2. Create an App ID for `com.offlinestudios.flextab`.
3. Configure signing in `ios/App/App.xcodeproj`.
4. Configure Supabase auth for Apple sign-in.
5. Allow both `https://www.flextab.app/dashboard` and
   `com.offlinestudios.flextab://auth/callback` in Supabase redirect URLs. Native
   callbacks use PKCE; test both cold-start and already-running app callbacks.
6. Create an App Store Connect app for FlexTab.
7. Archive in Xcode and upload through Organizer.
8. Provide review credentials and note that the app uses Supabase auth.
9. Complete App Privacy answers for account, workout, measurement, community media, and analytics data.

Apple review risk to check before submission:

- Account deletion must work end-to-end, not only display a dialog.
- Since Google/GitHub sign-in are offered, Apple sign-in must be configured and working.
- The app should feel app-like, not just a basic website in a shell.

## Google Play

1. Create the app in Google Play Console.
2. Reserve package name `com.offlinestudios.flextab`.
3. Open `android/` in Android Studio.
4. Generate a signed Android App Bundle (`.aab`).
5. Upload to internal testing first.
6. Complete Data Safety, privacy policy, screenshots, content rating, and target audience forms.

Android notes:

- The generated project targets SDK 36.
- Java/JDK is required locally to build Gradle artifacts.
- Use Play App Signing unless you have a specific reason not to.

## Release status — October 8, 2026

This is a release candidate in draft PR [#3](https://github.com/offlinestudios/Flex-Tab-App/pull/3),
not an App Store release. Code validation below refers to commit `96e2375`.
Do not infer production deployment or live-provider validation from local tests.

| Gate | Evidence and remaining work |
| --- | --- |
| Apple enrollment and app record | App Store Connect authenticated; FlexTab `6819723638`, iOS 1.0, Prepare for Submission. |
| Distribution signing | Xcode shows an Apple Development certificate. Creating an Apple Distribution certificate awaits owner confirmation. No signed release archive verified. |
| Local code checks | TypeScript, 132 tests across 16 files (including 32 PostgreSQL cases), and production build passed. Provider calls in Apple tests are mocked. |
| Native packaging | iOS and Android asset sync passed. Updated iOS app built and opened the existing signed-in workout log on iPhone 17 Pro / iOS 26.5 simulator. Android runtime and physical iPhone behavior are unverified. |
| Staging deployment | Empty Railway staging environment exists; no app/database services deployed. Hosting budget and isolated Supabase setup remain pending. See [staging setup](docs/staging-setup.txt). |
| Backend rollout | PR #3 is not deployed. Deploy and validate the matching backend before distributing native clients that call its new endpoints. |
| Sign in with Apple | Validation, encrypted storage, callback capture and deletion revocation implemented. Capability confirmation, provider/signing/key configuration, real token delivery and end-to-end staging tests remain outstanding. Apple provider remains disabled. |
| Account deletion | Local transactional/retry tests pass. Test a disposable account across actual auth, database and every configured storage provider, including Apple revocation and failure recovery. Resolve legacy ownerless media first. See [deletion notes](docs/account-deletion.txt). |
| Community safety | Post/comment reports, blocking, muting and moderator removal implemented. Account reporting, objectionable-content filtering, repeat-abuser enforcement, assigned moderator coverage and live staging validation remain unresolved. See [moderation gates](docs/community-moderation.txt). |
| Privacy and permissions | Draft inventory exists. Inspect final archive/privacy report; verify real GPS/media permission handling and production data collection/retention. App Privacy answers are not completed. See [privacy audit](docs/native-privacy-audit.txt). |
| Public support and legal pages | Public support/feedback routes implemented but not deployed. Owner must confirm monitored support/privacy mailboxes and accurate published policies before saving listing URLs. |
| Store listing | Draft English (Canada) promotional text, description and keywords saved. Final screenshots, build selection, review account/instructions, age rating, privacy, pricing/availability and applicable trader information still require completion/verification. |
| TestFlight | Authenticated TestFlight page says “Submit a build to start testing.” No uploaded build or tester validation. |
| Submission and release | Not submitted. Release requires the gates above, successful TestFlight testing and Apple review. |

## TestFlight acceptance evidence

Record the build number, environment, device/OS, result and any issue for each flow.
Use disposable staging accounts/data for destructive lifecycle tests. Do not reset
or delete real users to complete this checklist.

- New-account onboarding, email verification, email sign-in, sign-out and password recovery.
- Apple consent, cancellation, retry, token capture and return to app from cold/warm starts.
- Add/edit/remove workout sets, routine reuse, history/progress and persistence after restart.
- Profile editing, preferences and session refresh without losing an in-progress workout.
- Media capture/upload and GPS start/stop, including permission denial and network failure.
- Community visibility after block/mute, report submission, moderator handling and storage cleanup.
- Account deletion through provider revocation, owned media removal, identity removal and receipt;
  verify recovery after a provider failure without leaving an unusable partial account.
- Public support/privacy access without sign-in; verify the listed contact reaches the owner.

Local checks are useful evidence but do not substitute for these external flows.
Track any remaining dependency vulnerabilities and release impact in
[dependency security](docs/dependency-security.txt).
