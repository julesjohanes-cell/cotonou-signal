import { setWorkerUrl, type MapOptions } from "maplibre-gl";

// MapLibre v6 charge son worker à part : on le sert depuis /public (copié au postinstall)
let workerConfigure = false;
export function configurerMapLibre() {
  if (workerConfigure) return;
  setWorkerUrl("/maplibre-gl-worker.js");
  workerConfigure = true;
}

/**
 * Fond de carte :
 * - par défaut OpenFreeMap (vectoriel, gratuit, sans clé)
 * - NEXT_PUBLIC_MAP_STYLE=osm → tuiles raster OpenStreetMap (plus léger, plan B)
 * - ou n'importe quelle URL de style MapLibre
 */
export function styleCarte(): MapOptions["style"] {
  const s = process.env.NEXT_PUBLIC_MAP_STYLE;
  if (s === "osm") {
    return {
      version: 8,
      sources: {
        osm: {
          type: "raster",
          tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
          tileSize: 256,
          maxzoom: 19,
          attribution: "© contributeurs OpenStreetMap",
        },
      },
      layers: [{ id: "osm", type: "raster", source: "osm" }],
    };
  }
  if (s && s !== "openfreemap") return s;
  return "https://tiles.openfreemap.org/styles/liberty";
}
