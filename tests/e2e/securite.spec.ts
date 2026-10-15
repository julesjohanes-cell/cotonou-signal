import { expect, test } from "@playwright/test";

// Protection des routes et en-têtes de sécurité.
test("l'espace mairie redirige vers la connexion sans session", async ({ page }) => {
  await page.goto("/mairie");
  await expect(page).toHaveURL(/\/connexion\?suite=%2Fmairie/);
  await expect(page.getByRole("heading", { name: "Connexion agent" })).toBeVisible();
});

test("l'API agents répond 401 sans session, au format d'erreur du contrat", async ({ request }) => {
  const r = await request.get("/api/v1/agent/reports");
  expect(r.status()).toBe(401);
  expect((await r.json()).error.code).toBe("UNAUTHENTICATED");
});

test("après connexion, la session est un cookie httpOnly et l'espace mairie s'ouvre", async ({ page, context }) => {
  await page.goto("/connexion?suite=/mairie");
  await page.getByLabel("Identifiant").fill("agent");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/mairie$/);
  await expect(page.getByText("Connecté :")).toBeVisible();
  const jeton = (await context.cookies()).find((c) => c.name === "cs_jeton");
  expect(jeton?.httpOnly).toBe(true);
  expect(jeton?.sameSite).toBe("Strict");
  expect(await page.evaluate(() => document.cookie)).not.toContain("cs_jeton");
});

test("une redirection vers un autre site est refusée", async ({ page }) => {
  await page.goto("/connexion?suite=//pirate.example");
  await page.getByLabel("Identifiant").fill("agent");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/mairie$/);
});

test("les en-têtes de sécurité sont présents", async ({ request }) => {
  const r = await request.get("/");
  const h = r.headers();
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["x-powered-by"]).toBeUndefined();
  const lien = await request.get("/capture/expire");
  expect(lien.headers()["referrer-policy"]).toBe("no-referrer");
});
