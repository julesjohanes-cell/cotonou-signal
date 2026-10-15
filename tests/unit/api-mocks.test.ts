import { describe, expect, it } from "vitest";
import { ApiError, creerSignalement, messageRefus, MOCKS } from "@/lib/api";

const photo = new Blob(["test"], { type: "image/jpeg" });
const ici = { lat: 6.41, lng: 2.48, precision_m: 10 }; // zone sans données simulées autour

function signalement(gps = ici, point = { lat: ici.lat, lng: ici.lng }) {
  return creerSignalement({ categorie: "caniveau_bouche", photo, photo_prise_le: Date.now(), gps, point });
}

describe("création d'un signalement (mode simulé)", () => {
  it("tourne bien en mode simulé", () => {
    expect(MOCKS).toBe(true);
  });

  it("accepte un signalement valide et renvoie un numéro de suivi", async () => {
    const r = await signalement();
    expect(r.numero_suivi).toMatch(/^CS-2026-\d{5}$/);
    expect(r.doublon).toBe(false);
  });

  it("regroupe un doublon à moins de 30 m en +1", async () => {
    const premier = await signalement({ ...ici, lat: 6.405 }, { lat: 6.405, lng: 2.48 });
    const second = await signalement({ ...ici, lat: 6.405 }, { lat: 6.40505, lng: 2.48 });
    expect(second.doublon).toBe(true);
    expect(second.numero_suivi).toBe(premier.numero_suivi);
  });

  it("refuse une position hors de Cotonou", async () => {
    const lome = { lat: 6.1319, lng: 1.2228, precision_m: 10 };
    await expect(signalement(lome, { lat: lome.lat, lng: lome.lng })).rejects.toMatchObject({ code: "hors_cotonou" });
  });

  it("refuse un point à plus de 100 m de la personne", async () => {
    await expect(signalement(ici, { lat: ici.lat + 0.002, lng: ici.lng })).rejects.toBeInstanceOf(ApiError);
  });
});

describe("messages de refus", () => {
  it("traduit un code connu", () => {
    expect(messageRefus("photo_hors_sujet")).toContain("photo");
  });
  it("renvoie un message par défaut pour un code inconnu", () => {
    expect(messageRefus("code_inconnu")).toBe("Une erreur est survenue. Réessaie.");
  });
});
