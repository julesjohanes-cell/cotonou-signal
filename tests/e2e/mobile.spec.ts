import { expect, test } from "@playwright/test";

// Mobile d'abord : un petit Android d'entrée de gamme (360 px de large) est la cible de référence.
test.use({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

// Codes simulés : voir codeSuivi (lib/mocks.ts) ; /capture/lien-valide ouvre le parcours WhatsApp en mode simulé
const PAGES_CITOYENNES = ["/", "/signaler", "/carte", "/suivi", "/suivi/CS-7WDRQP", "/capture/lien-valide"];

for (const route of PAGES_CITOYENNES) {
  test(`${route} tient à 360 px, sans défilement horizontal, cibles tactiles de 44 px`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();
    await page.waitForTimeout(800); // laisse les données simulées arriver

    const debordement = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(debordement, "défilement horizontal").toBeLessThanOrEqual(0);

    // Boutons et liens visibles (hors contrôles internes de la carte) : au moins 44 px de haut
    const tropPetits = await page.evaluate(() =>
      Array.from(document.querySelectorAll("header a, main button, main a"))
        .filter((el) => !el.closest(".maplibregl-map"))
        .map((el) => ({ texte: (el.textContent ?? "").trim().slice(0, 30), r: el.getBoundingClientRect() }))
        .filter(({ r }) => r.width > 0 && r.height > 0 && r.height < 44)
        .map(({ texte, r }) => `${texte} (${Math.round(r.height)} px)`),
    );
    expect(tropPetits, "cibles tactiles trop petites").toEqual([]);
  });
}

test("les pages citoyennes ne chargent pas Ant Design", async ({ page }) => {
  const scripts: string[] = [];
  page.on("response", async (r) => {
    if (r.url().includes("/_next/static/") && r.url().endsWith(".js")) scripts.push(await r.text());
  });
  await page.goto("/signaler");
  await expect(page.getByText("Quel est le problème ?")).toBeVisible();
  expect(scripts.some((s) => s.includes("ant-btn"))).toBe(false);
});

test("le logotype de l'en-tête tient sur une ligne, avec son espace : « Cotonou Signale »", async ({ page }) => {
  // Le lien est en flex : sans span autour du texte, l'espace avant « Signale » disparaissait à l'écran.
  // /capture/[token] n'a pas de flèche retour mais un titre long : le logotype ne doit pas passer sur deux lignes.
  for (const route of ["/", "/capture/lien-valide"]) {
    await page.goto(route);
    const logo = page.locator('header a[href="/"]');
    // innerText reflète le rendu ("Cotonou\nSignale" quand l'espace saute) ; toHaveText normaliserait les espaces.
    expect(await logo.innerText(), route).toBe("Cotonou Signale");
    const hauteur = (await logo.locator("span").first().boundingBox())?.height ?? 0;
    expect(hauteur, `${route} : une seule ligne`).toBeLessThan(30);
  }
});
