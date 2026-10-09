export const ENV = {
  // Optional legacy integrations. Keep credentials server-side.
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",

  // Database
  databaseUrl: process.env.DATABASE_URL ?? "",
  
  // Clerk Authentication
  clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY ?? "",
  clerkSecretKey: process.env.CLERK_SECRET_KEY ?? "",
  
  // Application
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction: process.env.NODE_ENV === "production",
  port: process.env.PORT ?? "3000",
  
  // Google Maps (server-side proxy for frontend map script)
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? "",
  // App public domain — used as Referer when proxying Google Maps JS so HTTP-referrer
  // restrictions on the API key pass correctly.
  // Set this to your Railway/custom domain, e.g. "https://flextab.up.railway.app"
  appDomain: process.env.APP_DOMAIN ?? "",

  // Cloudflare R2 Storage (optional)
  r2AccountId: process.env.R2_ACCOUNT_ID ?? "",
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  r2BucketName: process.env.R2_BUCKET_NAME ?? "",
};
