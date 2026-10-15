"use client";
// Données serveur via TanStack Query : cache, chargement/erreur, rafraîchissement auto, invalidation.
// Les écrans utilisent CES hooks, jamais lib/api.ts ni axios directement.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ajouterPhotoApres, changerStatut, creerSignalement, listerMairie, listerPublic, suivre, verifierLien,
  type FiltresMairie,
} from "@/lib/api";

// Clés centralisées : une seule façon de nommer (et d'invalider) chaque donnée
export const cles = {
  tous: ["signalements"] as const,
  publics: ["signalements", "publics"] as const,
  suivi: (numero: string) => ["signalements", "suivi", numero] as const,
  mairie: (f: FiltresMairie) => ["signalements", "mairie", f] as const,
  lienWhatsApp: (token: string) => ["whatsapp", "lien", token] as const,
};

/** Carte publique : rafraîchie toutes les 15 s pour voir arriver les signalements en direct. */
export function useSignalementsPublics() {
  return useQuery({ queryKey: cles.publics, queryFn: listerPublic, refetchInterval: 15_000 });
}

export function useSuivi(numero: string) {
  return useQuery({ queryKey: cles.suivi(numero), queryFn: () => suivre(numero), retry: false });
}

export function useLienWhatsApp(token: string) {
  return useQuery({ queryKey: cles.lienWhatsApp(token), queryFn: () => verifierLien(token), staleTime: Infinity });
}

/** Publication : à la réussite, la carte et la liste mairie se rechargent. */
export function useCreerSignalement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: creerSignalement,
    onSuccess: () => qc.invalidateQueries({ queryKey: cles.tous }),
  });
}

// ---------- Espace mairie (bonus) ----------
export function useSignalementsMairie(filtres: FiltresMairie) {
  return useQuery({ queryKey: cles.mairie(filtres), queryFn: () => listerMairie(filtres), refetchInterval: 10_000 });
}

export function useChangerStatut() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: changerStatut, onSuccess: () => qc.invalidateQueries({ queryKey: cles.tous }) });
}

export function useAjouterPhotoApres() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ajouterPhotoApres, onSuccess: () => qc.invalidateQueries({ queryKey: cles.tous }) });
}
