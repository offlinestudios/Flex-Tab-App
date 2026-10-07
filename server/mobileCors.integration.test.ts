import { describe, expect, it } from "vitest";
import express from "express";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { mobileCors } from "./mobileCors";

describe("native API preflight", () => {
  it("handles iOS/Android before the API handler and does not allow unrelated sites", async () => {
    const app = express();
    app.use("/api", mobileCors);
    app.use("/api/trpc", (_req, res) => { res.status(401).json({ error: "authentication required" }); });
    const server = createServer(app);
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    try {
      const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/trpc/workout.getSessions`;
      for (const origin of ["capacitor://localhost", "https://localhost"]) {
        const result = await fetch(url, { method: "OPTIONS", headers: { Origin: origin, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "authorization,content-type" } });
        expect(result.status).toBe(204);
        expect(result.headers.get("access-control-allow-origin")).toBe(origin);
        expect(result.headers.get("access-control-allow-headers")).toMatch(/Authorization/);
        const denied = await fetch(url, { headers: { Origin: origin } });
        expect(denied.status).toBe(401);
        expect(denied.headers.get("access-control-allow-origin")).toBe(origin);
      }
      const foreign = await fetch(url, { method: "OPTIONS", headers: { Origin: "https://untrusted.example" } });
      expect(foreign.headers.get("access-control-allow-origin")).toBeNull();
    } finally {
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
  });
});
