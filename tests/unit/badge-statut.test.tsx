// @vitest-environment jsdom
// Exemple de test de composant (Testing Library) : à copier pour tester un écran.
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BadgeStatut, LibelleCategorie } from "@/components/ui";

afterEach(cleanup);

describe("composants d'affichage", () => {
  it("affiche le libellé français du statut", () => {
    render(<BadgeStatut statut="pris_en_charge" />);
    expect(screen.getByText("Pris en charge")).toBeTruthy();
  });

  it("affiche l'icône et le libellé de la catégorie", () => {
    render(<LibelleCategorie code="caniveau_bouche" />);
    expect(screen.getByText("Caniveau bouché")).toBeTruthy();
  });
});
