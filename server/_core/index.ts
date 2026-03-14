import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import { fileURLToPath } from "url";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { clerkMiddleware } from "@clerk/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { handleAvatarUpload } from "../avatarUpload";
import { handleMediaUpload } from "../mediaUpload";
import { handleGenerateWorkoutCard } from "../workoutCardImage";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Serve exercise images as static files BEFORE clerk middleware (no auth needed)
  app.use("/exercises", express.static(path.resolve(__dirname, "../../client/public/exercises")));

  // REST endpoints for file uploads and image generation
  // These must be registered BEFORE Clerk middleware so multipart uploads are not intercepted
  app.post("/api/upload-avatar", handleAvatarUpload);
  app.post("/api/upload-media", handleMediaUpload);
  app.post("/api/generate-workout-card", handleGenerateWorkoutCard);

  // Add Clerk middleware for authentication
  app.use(clerkMiddleware());
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  // Log R2 configuration at startup so missing vars are immediately visible
  console.log('[Server] =========================');
  console.log('[Server] R2 CONFIGURATION CHECK');
  console.log('[Server] =========================');
  console.log('[Server] R2_ACCOUNT_ID:', process.env.R2_ACCOUNT_ID ? 'Set (' + process.env.R2_ACCOUNT_ID.slice(0, 6) + '...)' : 'MISSING ⚠️');
  console.log('[Server] R2_ACCESS_KEY_ID:', process.env.R2_ACCESS_KEY_ID ? 'Set' : 'MISSING ⚠️');
  console.log('[Server] R2_SECRET_ACCESS_KEY:', process.env.R2_SECRET_ACCESS_KEY ? 'Set' : 'MISSING ⚠️');
  console.log('[Server] R2_BUCKET_NAME:', process.env.R2_BUCKET_NAME || '(default: flextab-storage)');
  console.log('[Server] R2_PUBLIC_URL:', process.env.R2_PUBLIC_URL || '(not set — will derive from account ID)');
  console.log('[Server] VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'Set' : 'MISSING ⚠️');
  console.log('[Server] SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'MISSING (falling back to anon key)');
  console.log('[Server] =========================');

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
