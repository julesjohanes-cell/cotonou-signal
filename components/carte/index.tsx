"use client";
// Toujours importer les cartes depuis ici : MapLibre ne tourne que dans le navigateur (pas de SSR).
import dynamic from "next/dynamic";

const Chargement = () => (
  <div className="flex h-72 w-full items-center justify-center rounded-xl bg-violet-50 text-sm text-violet-900">
    Chargement de la carte…
  </div>
);

export const MapView = dynamic(() => import("./MapView"), { ssr: false, loading: Chargement });
export const PointPicker = dynamic(() => import("./PointPicker"), { ssr: false, loading: Chargement });
export type { Marqueur } from "./MapView";
