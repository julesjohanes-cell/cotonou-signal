"use client";
// Récupère la position GPS en direct et garde la meilleure précision pendant quelques secondes.
import { useCallback, useEffect, useRef, useState } from "react";
import { estDansCotonou, PRECISION_MAX_M, type Position } from "@/lib/geo";

export type EtatGps = "inactif" | "recherche" | "ok" | "imprecis" | "hors_zone" | "refuse" | "erreur";

export function useGeolocalisation(dureeMaxMs = 15000, precisionCible = 25) {
  const [position, setPosition] = useState<Position | null>(null);
  const [etat, setEtat] = useState<EtatGps>("inactif");
  const watchId = useRef<number | null>(null);

  const arreter = useCallback(() => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
  }, []);

  const demarrer = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setEtat("erreur");
      return;
    }
    if (!window.isSecureContext) {
      console.warn("GPS indisponible : la page doit être servie en HTTPS (tunnel).");
    }
    arreter();
    setEtat("recherche");
    let meilleure: Position | null = null;
    const debut = Date.now();

    const evaluer = (p: Position, fin: boolean) => {
      if (!estDansCotonou(p.lat, p.lng)) return setEtat("hors_zone");
      if (p.precision_m <= PRECISION_MAX_M) return setEtat(fin || p.precision_m <= precisionCible ? "ok" : "recherche");
      if (fin) setEtat("imprecis");
    };

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude, precision_m: pos.coords.accuracy };
        if (!meilleure || p.precision_m < meilleure.precision_m) {
          meilleure = p;
          setPosition(p);
        }
        const fin = meilleure.precision_m <= precisionCible || Date.now() - debut > dureeMaxMs;
        evaluer(meilleure, fin);
        if (fin) arreter();
      },
      (err) => {
        arreter();
        setEtat(err.code === err.PERMISSION_DENIED ? "refuse" : "erreur");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: dureeMaxMs },
    );
  }, [arreter, dureeMaxMs, precisionCible]);

  useEffect(() => arreter, [arreter]);

  return { position, etat, demarrer, arreter };
}
