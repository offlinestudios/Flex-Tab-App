import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./railway-routers";
import { createContext } from "./railway-context";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Configure body parser
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // tRPC API endpoints
  console.log('[Server] Setting up tRPC API at /api/trpc');
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  
  // Serve static files from dist/public
  // In Railway production: server code is at /app/dist/index.js
  // Frontend files are at /app/dist/public
  // So __dirname is /app/dist, and we need ./public
  const staticPath = path.join(__dirname, "public");

  console.log('[Server] __dirname:', __dirname);
  console.log('[Server] Serving static files from:', staticPath);
  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    const indexPath = path.join(staticPath, "index.html");
    
    // Sanity check: make sure index.html exists
    if (!fs.existsSync(indexPath)) {
      console.error("[Server] Missing index.html at:", indexPath);
      console.error("[Server] __dirname:", __dirname);
      console.error("[Server] staticPath:", staticPath);
      console.error("[Server] Files in __dirname:", fs.readdirSync(__dirname));
      if (fs.existsSync(path.join(__dirname, "public"))) {
        console.error("[Server] Files in public:", fs.readdirSync(path.join(__dirname, "public")));
      }
      return res.status(500).send("Build output missing. Did you run vite build?");
    }
    
    res.sendFile(indexPath);
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`[Server] Running on port ${port}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[Server] Supabase URL: ${process.env.VITE_SUPABASE_URL ? 'Set' : 'Missing'}`);
    console.log(`[Server] Database URL: ${process.env.DATABASE_URL ? 'Set' : 'Missing'}`);
  });
}

startServer().catch(console.error);
