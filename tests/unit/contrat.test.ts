// Points du contrat d'API faciles à casser : format des erreurs et ordre [longitude, latitude] du GeoJSON.
import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";
import { versApiError } from "@/lib/api";
import { depuisGeoJSON } from "@/lib/geo";
import type { CarteGeoJSON, CorpsErreur } from "@/lib/types";

function reponse(status: number, data: unknown): AxiosError<Partial<CorpsErreur>> {
  const config = { headers: new AxiosHeaders() };
  const res = { status, data, statusText: "", headers: {}, config } as AxiosResponse<Partial<CorpsErreur>>;
  return new AxiosError("échec", "ERR_BAD_REQUEST", config, null, res);
}

describe("erreurs au format du contrat", () => {
  it('lit {"error": {code, message, details}} et garde le message du serveur', () => {
    const e = versApiError(
      reponse(422, { error: { code: "TOO_FAR", message: "Le point est à plus de 100 m de votre position.", details: { distance_m: 142 } } }),
    );
    expect(e).toMatchObject({ code: "TOO_FAR", status: 422, message: "Le point est à plus de 100 m de votre position." });
    expect(e.details).toEqual({ distance_m: 142 });
  });

  it("utilise le message par défaut si le serveur n'en donne pas", () => {
    expect(versApiError(reponse(410, { error: { code: "TOKEN_EXPIRED", message: "" } })).message).toContain("expiré");
  });

  it("gère une réponse sans corps JSON (Django arrêté derrière le relais)", () => {
    expect(versApiError(reponse(502, "<html>Bad Gateway</html>"))).toMatchObject({ code: "HTTP_502", status: 502 });
  });

  it("distingue l'absence de réseau d'un délai dépassé", () => {
    expect(versApiError(new AxiosError("Network Error", "ERR_NETWORK")).code).toBe("NETWORK");
    expect(versApiError(new AxiosError("timeout", "ECONNABORTED")).code).toBe("TIMEOUT");
  });
});

describe("GeoJSON de la carte", () => {
  it("convertit [longitude, latitude] en { lat, lng } sans les inverser", () => {
    const fc: CarteGeoJSON = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [2.3912, 6.3703] },
          properties: {
            tracking_code: "CS-7K3F9Q", category: "depot_sauvage", status: "published",
            support_count: 3, photo_url: "/media/reports/abc.jpg", created_at: "2026-10-15T19:42:10Z",
          },
        },
      ],
    };
    const [p] = depuisGeoJSON(fc);
    expect(p).toMatchObject({ tracking_code: "CS-7K3F9Q", lat: 6.3703, lng: 2.3912, support_count: 3 });
  });

  it("accepte une collection vide", () => {
    expect(depuisGeoJSON({ type: "FeatureCollection", features: [] })).toEqual([]);
  });
});
