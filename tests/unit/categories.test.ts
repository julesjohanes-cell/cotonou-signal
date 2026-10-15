import { describe, expect, it } from "vitest";
import { CATEGORIES, categorie, servicesDe } from "@/lib/categories";

describe("catégories V1 (mêmes slugs que le back)", () => {
  it("contient les 8 catégories du brief plus « Autre »", () => {
    expect(CATEGORIES).toHaveLength(9);
    expect(new Set(CATEGORIES.map((c) => c.code)).size).toBe(9);
  });
  it("utilise les slugs du contrat", () => {
    expect(CATEGORIES.map((c) => c.code)).toEqual([
      "depot_sauvage", "caniveau_bouche", "brulage_dechets", "eau_stagnante", "chaussee_degradee",
      "regard_dalle", "eclairage_panne", "vehicule_abandonne", "autre",
    ]);
  });
  it("rattache chaque catégorie, sauf « Autre », à au moins un service", () => {
    for (const c of CATEGORIES.filter((x) => x.code !== "autre")) expect(c.services.length).toBeGreaterThan(0);
  });
  it("envoie « Autre » en modération et affiche un slug inconnu comme « Autre »", () => {
    expect(servicesDe("autre")).toBe("Modération");
    expect(categorie("slug_inconnu").code).toBe("autre");
  });
});
