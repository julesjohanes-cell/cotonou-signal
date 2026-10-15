// Règles de position du brief : GPS précis, à Cotonou, point à moins de 100 m de la personne.
// Le serveur revérifie tout : ces contrôles servent seulement à guider l'utilisateur.

export const COTONOU_CENTRE: [number, number] = [2.4183, 6.3654]; // [lng, lat] (ordre MapLibre)
export const COTONOU_ZOOM = 13;

// Rectangle approximatif de la commune de Cotonou, avec une petite marge
export const COTONOU_BBOX = { minLat: 6.33, maxLat: 6.43, minLng: 2.32, maxLng: 2.52 };

export const DISTANCE_MAX_M = 100; // point ajusté ↔ position du citoyen
export const PRECISION_MAX_M = Number(process.env.NEXT_PUBLIC_PRECISION_MAX_M ?? 100);
export const IGNORER_ZONE = process.env.NEXT_PUBLIC_IGNORER_ZONE === "1"; // pour tester hors de Cotonou

export interface Position {
  lat: number;
  lng: number;
  precision_m: number;
}

export function estDansCotonou(lat: number, lng: number): boolean {
  if (IGNORER_ZONE) return true;
  const b = COTONOU_BBOX;
  return lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng;
}

/** Distance en mètres entre deux points (haversine). */
export function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Ramène un point à DISTANCE_MAX_M de l'origine s'il est trop loin. */
export function limiterDistance(
  origine: { lat: number; lng: number },
  point: { lat: number; lng: number },
  maxM = DISTANCE_MAX_M,
): { lat: number; lng: number } {
  const d = distanceM(origine, point);
  if (d <= maxM) return point;
  const ratio = (maxM - 1) / d;
  return {
    lat: origine.lat + (point.lat - origine.lat) * ratio,
    lng: origine.lng + (point.lng - origine.lng) * ratio,
  };
}
