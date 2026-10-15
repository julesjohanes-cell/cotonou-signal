"use client";
// Données serveur via TanStack Query : cache, chargement/erreur, rafraîchissement auto, invalidation.
// Les écrans utilisent CES hooks, jamais lib/api.ts ni axios directement.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ajouterPhotoApres, changerStatut, creerSignalement, listerAgent, listerCarte, suivre, verifierLienCapture,
  type FiltresAgent,
} from "@/lib/api";

// Clés centralisées : une seule façon de nommer (et d'invalider) chaque donnée
export const cles = {
  tous: ["signalements"] as const,
  carte: ["signalements", "carte"] as const,
  suivi: (code: string) => ["signalements", "suivi", code] as const,
  agent: (f: FiltresAgent) => ["signalements", "agent", f] as const,
  lienCapture: (token: string) => ["capture", token] as const,
};

/** Carte publique : rafraîchie toutes les 15 s pour voir arriver les signalements en direct. */
export function useSignalementsCarte() {
  return useQuery({ queryKey: cles.carte, queryFn: listerCarte, refetchInterval: 15_000 });
}

export function useSuivi(code: string) {
  return useQuery({ queryKey: cles.suivi(code), queryFn: () => suivre(code), retry: false });
}

/** Lien de capture (WhatsApp) : vérifié une fois ; un lien expiré ou utilisé ne redevient pas valide. */
export function useLienCapture(token: string) {
  return useQuery({
    queryKey: cles.lienCapture(token),
    queryFn: () => verifierLienCapture(token),
    staleTime: Infinity,
    retry: false,
  });
}

/** Publication : à la réussite, la carte, le suivi et la liste des agents se rechargent. */
export function useCreerSignalement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: creerSignalement,
    onSuccess: () => qc.invalidateQueries({ queryKey: cles.tous }),
  });
}

// ---------- Espace agents (bonus) ----------
export function useSignalementsAgent(filtres: FiltresAgent) {
  return useQuery({ queryKey: cles.agent(filtres), queryFn: () => listerAgent(filtres), refetchInterval: 10_000 });
}

export function useChangerStatut() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: changerStatut, onSuccess: () => qc.invalidateQueries({ queryKey: cles.tous }) });
}

export function useAjouterPhotoApres() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ajouterPhotoApres, onSuccess: () => qc.invalidateQueries({ queryKey: cles.tous }) });
}
