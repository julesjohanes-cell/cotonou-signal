"use client";
// Étape "ajuster le point" : marqueur déplaçable, limité à 100 m de la position GPS du citoyen.
import { useEffect, useRef } from "react";
import { Map as MlMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { configurerMapLibre, styleCarte } from "./style";
import { DISTANCE_MAX_M, limiterDistance, type Position } from "@/lib/geo";

interface Props {
  gps: Position;
  point: { lat: number; lng: number };
  onChange: (p: { lat: number; lng: number }) => void;
  className?: string;
}

function cercle(lat: number, lng: number, rayonM: number) {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * 2 * Math.PI;
    const dLat = (rayonM / 111320) * Math.cos(a);
    const dLng = (rayonM / (111320 * Math.cos((lat * Math.PI) / 180))) * Math.sin(a);
    pts.push([lng + dLng, lat + dLat]);
  }
  return { type: "Feature" as const, geometry: { type: "Polygon" as const, coordinates: [pts] }, properties: {} };
}

export default function PointPicker({ gps, point, onChange, className }: Props) {
  const conteneur = useRef<HTMLDivElement>(null);
  const onCh = useRef(onChange);
  onCh.current = onChange;

  useEffect(() => {
    configurerMapLibre();
    const map = new MlMap({
      container: conteneur.current!,
      style: styleCarte(),
      center: [point.lng, point.lat],
      zoom: 17,
    });

    // Position du citoyen (point bleu, non déplaçable)
    const moi = document.createElement("div");
    moi.style.cssText =
      "width:16px;height:16px;border-radius:9999px;background:#2563eb;border:3px solid white;box-shadow:0 0 0 2px rgba(37,99,235,.35)";
    new Marker({ element: moi }).setLngLat([gps.lng, gps.lat]).addTo(map);

    // Point du problème (déplaçable)
    const m = new Marker({ draggable: true, color: "#3b0f70" }).setLngLat([point.lng, point.lat]).addTo(map);
    const deplacer = (lng: number, lat: number) => {
      const p = limiterDistance(gps, { lat, lng });
      m.setLngLat([p.lng, p.lat]);
      onCh.current(p);
    };
    m.on("dragend", () => {
      const ll = m.getLngLat();
      deplacer(ll.lng, ll.lat);
    });
    map.on("click", (e) => deplacer(e.lngLat.lng, e.lngLat.lat));

    // Zone autorisée : cercle de 100 m
    map.on("load", () => {
      map.addSource("zone", { type: "geojson", data: cercle(gps.lat, gps.lng, DISTANCE_MAX_M) });
      map.addLayer({ id: "zone-fond", type: "fill", source: "zone", paint: { "fill-color": "#3b0f70", "fill-opacity": 0.08 } });
      map.addLayer({ id: "zone-bord", type: "line", source: "zone", paint: { "line-color": "#3b0f70", "line-width": 2, "line-dasharray": [2, 2] } });
    });

    return () => map.remove();
    // On ne recrée la carte que si la position GPS change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gps.lat, gps.lng]);

  return <div ref={conteneur} className={className ?? "h-72 w-full rounded-xl"} />;
}
