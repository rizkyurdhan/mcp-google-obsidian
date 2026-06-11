import { describe, it, expect } from "vitest";
import { SCOPES, getAllScopes } from "../src/auth/scopes.js";

describe("SCOPES", () => {
  it("defines scopes for all expected Google services", () => {
    const expectedServices = [
      "gmail",
      "drive",
      "calendar",
      "docs",
      "sheets",
      "slides",
      "tasks",
      "contacts",
      "admin",
    ];
    for (const service of expectedServices) {
      expect(SCOPES).toHaveProperty(service);
      expect(Array.isArray((SCOPES as any)[service])).toBe(true);
      expect((SCOPES as any)[service].length).toBeGreaterThan(0);
    }
  });

  it("all scope URLs are valid googleapis.com URLs", () => {
    const allScopes = getAllScopes();
    for (const scope of allScopes) {
      expect(scope).toMatch(/^https:\/\/www\.googleapis\.com\/auth\//);
    }
  });
});

describe("getAllScopes", () => {
  it("returns a flat array of all scopes", () => {
    const all = getAllScopes();
    expect(Array.isArray(all)).toBe(true);

    // Should be the sum of all individual service scope counts
    const expectedCount = Object.values(SCOPES)
      .flat()
      .length;
    expect(all.length).toBe(expectedCount);
  });

  it("contains no duplicates", () => {
    const all = getAllScopes();
    const unique = new Set(all);
    expect(unique.size).toBe(all.length);
  });
});
