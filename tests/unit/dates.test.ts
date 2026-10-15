import { describe, expect, it } from "vitest";
import { dateCourte, depuis } from "@/lib/dates";

describe("dates en français", () => {
  it("formate une date courte", () => {
    expect(dateCourte("2026-10-15T21:04:00")).toBe("15 oct., 21:04");
  });
  it("dit « il y a … » pour une date passée", () => {
    const ilYaTroisJours = new Date(Date.now() - 3 * 86_400_000).toISOString();
    expect(depuis(ilYaTroisJours)).toBe("il y a 3 jours");
  });
});
