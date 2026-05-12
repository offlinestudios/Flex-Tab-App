# FlexTab Store Submission Runbook

FlexTab is now wrapped with Capacitor for iOS and Android.

## App Identity

- App name: `FlexTab`
- Bundle ID / package name: `com.offlinestudios.flextab`
- Web backend default for native builds: `https://www.flextab.app`
- Native web assets folder: `dist/public`

## Build Commands

```bash
npm install --legacy-peer-deps
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
5. Add `https://www.flextab.app/dashboard` to Supabase redirect URLs.
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

## Verification Notes

- `npm run build:web` succeeds.
- `npm run mobile:sync` succeeds.
- Android debug build was not run here because no Java runtime was installed on this machine.
- `npm run check` currently fails on existing TypeScript issues outside the Capacitor wrapper work.
