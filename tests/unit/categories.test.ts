import { describe, expect, it } from "vitest";
import { CATEGORIES, categorie } from "@/lib/categories";

describe("catégories V1", () => {
  it("contient les 8 catégories du brief plus « Autre »", () => {
    expect(CATEGORIES).toHaveLength(9);
    expect(new Set(CATEGORIES.map((c) => c.code)).size).toBe(9);
  });
  it("rattache chaque catégorie à un service", () => {
    for (const c of CATEGORIES) expect(c.service.length).toBeGreaterThan(0);
  });
  it("envoie « Autre » en modération", () => {
    expect(categorie("autre").service).toBe("Modération");
  });
});
