import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { mobileCors } from "./mobileCors";

function request(origin?: string, method = "GET") {
  const headers: Record<string, string> = {};
  const res = {
    vary: vi.fn(),
    setHeader: (key: string, value: string) => { headers[key] = value; },
    status: vi.fn().mockReturnThis(),
    end: vi.fn(),
  };
  const next = vi.fn();
  mobileCors({ get: () => origin, method } as unknown as Request, res as unknown as Response, next);
  return { headers, res, next };
}

describe("native API CORS", () => {
  it.each(["capacitor://localhost", "https://localhost"])("allows authenticated requests from %s", origin => {
    const { headers, next } = request(origin);
    expect(headers["Access-Control-Allow-Origin"]).toBe(origin);
    expect(headers["Access-Control-Allow-Credentials"]).toBe("true");
    expect(next).toHaveBeenCalledOnce();
  });
  it("handles native preflight before authentication", () => {
    const { headers, res, next } = request("capacitor://localhost", "OPTIONS");
    expect(headers["Access-Control-Allow-Headers"]).toContain("Authorization");
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalledOnce();
    expect(next).not.toHaveBeenCalled();
  });
  it.each([undefined, "https://evil.example", "https://localhost.evil.example", "null"])("does not grant cross-origin access to %s", origin => {
    const { headers, next } = request(origin);
    expect(headers["Access-Control-Allow-Origin"]).toBeUndefined();
    expect(next).toHaveBeenCalledOnce();
  });
});
