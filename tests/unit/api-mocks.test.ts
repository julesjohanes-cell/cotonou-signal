import { describe, expect, it } from "vitest";
import { ApiError, creerSignalement, messageErreur, MOCKS, suivre, verifierLienCapture } from "@/lib/api";

const photo = new Blob(["test"], { type: "image/jpeg" });
const ici = { lat: 6.41, lng: 2.48, precision_m: 10 }; // zone sans données simulées autour

function signalement(position = ici, point = { lat: ici.lat, lng: ici.lng }) {
  return creerSignalement({ category: "caniveau_bouche", photo, position, point });
}

describe("création d'un signalement (mode simulé, mêmes réponses que le contrat)", () => {
  it("tourne bien en mode simulé", () => {
    expect(MOCKS).toBe(true);
  });

  it("accepte un signalement valide : 201, code de suivi CS-XXXXXX, publié", async () => {
    const r = await signalement();
    expect(r.tracking_code).toMatch(/^CS-[0-9A-Z]{6}$/);
    expect(r.status).toBe("published");
    expect(r.duplicate).toBe(false);
    expect(r.support_count).toBe(1);
    expect(r.message).toBeTruthy();
  });

  it("regroupe un doublon à moins de 30 m en +1", async () => {
    const premier = await signalement({ ...ici, lat: 6.405 }, { lat: 6.405, lng: 2.48 });
    const second = await signalement({ ...ici, lat: 6.405 }, { lat: 6.40505, lng: 2.48 });
    expect(second.duplicate).toBe(true);
    expect(second.tracking_code).toBe(premier.tracking_code);
    expect(second.support_count).toBe(2);
  });

  it("envoie « Autre problème » en modération", async () => {
    const r = await creerSignalement({ category: "autre", photo, position: { ...ici, lat: 6.4 }, point: { lat: 6.4, lng: 2.48 } });
    expect(r.status).toBe("moderation");
  });

  it("refuse une position hors de Cotonou (OUT_OF_ZONE, 422)", async () => {
    const lome = { lat: 6.1319, lng: 1.2228, precision_m: 10 };
    await expect(signalement(lome, { lat: lome.lat, lng: lome.lng })).rejects.toMatchObject({ code: "OUT_OF_ZONE", status: 422 });
  });

  it("refuse un point à plus de 100 m de la personne (TOO_FAR, avec la distance)", async () => {
    const e = await signalement(ici, { lat: ici.lat + 0.002, lng: ici.lng }).catch((x) => x);
    expect(e).toBeInstanceOf(ApiError);
    expect(e.code).toBe("TOO_FAR");
    expect(e.details.distance_m).toBeGreaterThan(100);
  });

  it("refuse une position GPS trop imprécise (GPS_INACCURATE, plus de 50 m)", async () => {
    await expect(signalement({ ...ici, precision_m: 80 })).rejects.toMatchObject({ code: "GPS_INACCURATE" });
  });
});

describe("suivi et liens de capture (mode simulé)", () => {
  it("retrouve un signalement par son code, sans le canal ni le verdict IA", async () => {
    const { tracking_code } = await signalement({ ...ici, lat: 6.395 }, { lat: 6.395, lng: 2.48 });
    const s = await suivre(tracking_code.toLowerCase());
    expect(s.tracking_code).toBe(tracking_code);
    expect(s).not.toHaveProperty("channel");
    expect(s).not.toHaveProperty("ai_verdict");
  });

  it("répond NOT_FOUND (404) pour un code inconnu", async () => {
    await expect(suivre("CS-000000")).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
  });

  it("refuse un lien expiré (410) ou déjà utilisé (409)", async () => {
    await expect(verifierLienCapture("expire")).rejects.toMatchObject({ code: "TOKEN_EXPIRED", status: 410 });
    await expect(verifierLienCapture("utilise")).rejects.toMatchObject({ code: "TOKEN_USED", status: 409 });
    expect((await verifierLienCapture("lien-valide")).valid).toBe(true);
  });
});

describe("messages par défaut", () => {
  it("donne le message du back pour un code du contrat", () => {
    expect(messageErreur("PHOTO_MISMATCH")).toBe("La photo ne correspond pas à la catégorie choisie.");
  });
  it("renvoie un message générique pour un code inconnu", () => {
    expect(messageErreur("CODE_INCONNU")).toBe("Une erreur est survenue. Réessayez.");
  });
});
