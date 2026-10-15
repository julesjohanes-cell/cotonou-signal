import { describe, expect, it } from "vitest";
import { DISTANCE_MAX_M, distanceM, estDansCotonou, limiterDistance } from "@/lib/geo";

describe("règles de position", () => {
  it("mesure environ 111 m pour 0,001° de latitude", () => {
    expect(distanceM({ lat: 6.37, lng: 2.43 }, { lat: 6.371, lng: 2.43 })).toBeCloseTo(111.2, 0);
  });

  it("accepte Dantokpa et refuse Lomé", () => {
    expect(estDansCotonou(6.3727, 2.4295)).toBe(true);
    expect(estDansCotonou(6.1319, 1.2228)).toBe(false);
  });

  it("ramène un point trop éloigné à moins de 100 m de la personne", () => {
    const personne = { lat: 6.37, lng: 2.43 };
    const point = limiterDistance(personne, { lat: 6.375, lng: 2.43 });
    expect(distanceM(personne, point)).toBeLessThanOrEqual(DISTANCE_MAX_M);
  });

  it("laisse intact un point déjà proche", () => {
    const personne = { lat: 6.37, lng: 2.43 };
    const proche = { lat: 6.3703, lng: 2.4302 };
    expect(limiterDistance(personne, proche)).toEqual(proche);
  });
});
