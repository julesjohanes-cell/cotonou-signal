import { defineConfig, devices } from "@playwright/test";

// Parcours de bout en bout en mode simulé, sur un téléphone émulé à Dantokpa.
// Prérequis : `pnpm build` (la CI le fait avant), puis `pnpm test:e2e`.
const PORT = 3100;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  // Chaque test part d'un navigateur neuf en mode simulé, sans état partagé : on les lance tous en parallèle.
  fullyParallel: true,
  workers: process.env.CI ? "100%" : undefined,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices["Pixel 7"],
    geolocation: { latitude: 6.3727, longitude: 2.4295, accuracy: 12 },
    permissions: ["geolocation"],
    locale: "fr-FR",
    trace: "retain-on-failure",
    // CI : Chrome déjà installé sur le runner (PW_CHANNEL=chrome), rien à télécharger.
    ...(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}),
    // Chromium déjà installé ailleurs (ex. bac à sable) : PW_CHROMIUM_PATH=/chemin/chrome
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  webServer: {
    command: `pnpm start -p ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    env: { NEXT_PUBLIC_MOCKS: "1" },
  },
});
