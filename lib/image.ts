// Compression côté navigateur : photo plus légère pour les petits forfaits data (persona Koffi).
export async function compresserImage(fichier: Blob, tailleMax = 1600, qualite = 0.8): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(fichier);
    const ratio = Math.min(1, tailleMax / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * ratio);
    const h = Math.round(bitmap.height * ratio);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", qualite));
    return blob ?? fichier;
  } catch {
    return fichier; // en cas d'échec on envoie l'original, le serveur gère
  }
}

/** Contrôle indicatif : une photo choisie dans la galerie a une date de modification ancienne. */
export function photoRecente(fichier: File, maxMs = 2 * 60 * 1000): boolean {
  if (!fichier.lastModified) return true; // inconnu : le serveur tranchera
  return Date.now() - fichier.lastModified < maxMs;
}
