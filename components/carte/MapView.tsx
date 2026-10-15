"use client";
// Carte générique : affiche des marqueurs, signale le clic. Utilisée par /carte et /mairie.
import { useEffect, useRef } from "react";
import { Map as MlMap, Marker, NavigationControl, LngLatBounds } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { configurerMapLibre, styleCarte } from "./style";
import { COTONOU_CENTRE, COTONOU_ZOOM } from "@/lib/geo";
import { COULEURS, OMBRES } from "@/lib/jetons";

export interface Marqueur {
  id: string;
  lat: number;
  lng: number;
  couleur: string;
  contenu?: string; // texte/icône dans la pastille
  titre?: string; // infobulle au survol
  badge?: number; // ex. nb de confirmations (+1)
}

interface Props {
  marqueurs: Marqueur[];
  selection?: string | null;
  onSelection?: (id: string) => void;
  ajusterVue?: boolean; // cadrer automatiquement sur les marqueurs
  className?: string;
}

function creerElement(m: Marqueur, selectionne: boolean): HTMLElement {
  const el = document.createElement("button");
  el.type = "button";
  el.title = m.titre ?? "";
  el.style.cssText = `width:${selectionne ? 40 : 32}px;height:${selectionne ? 40 : 32}px;border-radius:9999px;
    background:${m.couleur};border:3px solid ${COULEURS.surface};box-shadow:${OMBRES.marqueur};
    display:flex;align-items:center;justify-content:center;font-size:15px;cursor:pointer;position:relative;`;
  el.textContent = m.contenu ?? "";
  if (m.badge && m.badge > 1) {
    const b = document.createElement("span");
    b.textContent = `+${m.badge - 1}`;
    b.style.cssText =
      `position:absolute;top:-8px;right:-10px;background:${COULEURS.pastilleConfirmations};color:${COULEURS.surMarque};font-size:10px;font-weight:700;padding:1px 4px;border-radius:9999px;`;
    el.appendChild(b);
  }
  return el;
}

export default function MapView({ marqueurs, selection, onSelection, ajusterVue = false, className }: Props) {
  const conteneur = useRef<HTMLDivElement>(null);
  const carte = useRef<MlMap | null>(null);
  const markers = useRef<Marker[]>([]);
  const onSel = useRef(onSelection);
  useEffect(() => {
    onSel.current = onSelection;
  });

  useEffect(() => {
    configurerMapLibre();
    const map = new MlMap({
      container: conteneur.current!,
      style: styleCarte(),
      center: COTONOU_CENTRE,
      zoom: COTONOU_ZOOM,
    });
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    carte.current = map;
    return () => {
      map.remove();
      carte.current = null;
    };
  }, []);

  useEffect(() => {
    const map = carte.current;
    if (!map) return;
    markers.current.forEach((m) => m.remove());
    markers.current = marqueurs.map((m) => {
      const el = creerElement(m, m.id === selection);
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSel.current?.(m.id);
      });
      return new Marker({ element: el }).setLngLat([m.lng, m.lat]).addTo(map);
    });
    if (ajusterVue && marqueurs.length > 1) {
      const b = new LngLatBounds();
      marqueurs.forEach((m) => b.extend([m.lng, m.lat]));
      map.fitBounds(b, { padding: 50, maxZoom: 16, duration: 0 });
    }
  }, [marqueurs, selection, ajusterVue]);

  useEffect(() => {
    const m = marqueurs.find((x) => x.id === selection);
    if (m && carte.current) carte.current.flyTo({ center: [m.lng, m.lat], zoom: Math.max(carte.current.getZoom(), 15) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection]);

  return <div ref={conteneur} className={className ?? "h-96 w-full rounded-xl"} />;
}
