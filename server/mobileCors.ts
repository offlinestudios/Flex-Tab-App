import type { RequestHandler } from "express";

// These origins match the bundled Capacitor projects, not arbitrary websites.
const nativeOrigins = new Set(["capacitor://localhost", "https://localhost"]);

export const mobileCors: RequestHandler = (req, res, next) => {
  const origin = req.get("Origin");
  res.vary("Origin");
  if (!origin || !nativeOrigins.has(origin)) {
    next();
    return;
  }
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
};
