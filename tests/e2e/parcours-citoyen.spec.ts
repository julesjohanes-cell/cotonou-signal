import { expect, test } from "@playwright/test";

// Critères de la démo : un signalement complet en moins d'une minute, lien WhatsApp expiré refusé.
const PHOTO = Buffer.from(
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==",
  "base64",
);

test("un citoyen signale un caniveau bouché en moins d'une minute", async ({ page }) => {
  const debut = Date.now();
  await page.goto("/signaler");
  await page.getByText("Caniveau bouché").click();
  await page.locator('input[type="file"]').setInputFiles({ name: "photo.jpg", mimeType: "image/jpeg", buffer: PHOTO });
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page.getByText(/Position trouvée/)).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Publier le signalement" }).click();
  await expect(page.getByText("Signalement envoyé !")).toBeVisible();
  await expect(page.getByText(/^CS-[0-9A-Z]{6}$/)).toBeVisible();
  expect(Date.now() - debut).toBeLessThan(60_000);
});

test("un lien WhatsApp expiré ou déjà utilisé est refusé", async ({ page }) => {
  await page.goto("/capture/expire");
  await expect(page.getByText("Lien invalide")).toBeVisible();
  await expect(page.getByText(/a expiré/)).toBeVisible();
  await page.goto("/capture/utilise");
  await expect(page.getByText(/déjà été utilisé/)).toBeVisible();
});

test("un lien WhatsApp valide ouvre le même parcours de capture", async ({ page }) => {
  await page.goto("/capture/lien-valide");
  await expect(page.getByText("Quel est le problème ?")).toBeVisible();
});

test("le suivi affiche le statut et l'historique d'un signalement", async ({ page }) => {
  await page.goto("/suivi/CS-7WDRQP");
  await expect(page.getByText("CS-7WDRQP")).toBeVisible();
  await expect(page.getByText(/Service :/)).toBeVisible();
});

test("un code de suivi inconnu affiche un message clair", async ({ page }) => {
  await page.goto("/suivi/CS-000000");
  await expect(page.getByText(/Aucun signalement avec ce numéro/)).toBeVisible();
});

test("la carte publique affiche les signalements", async ({ page }) => {
  await page.goto("/carte");
  await expect(page.getByText(/\d+ signalements/)).toBeVisible();
});
