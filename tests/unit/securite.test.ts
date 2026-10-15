import { describe, expect, it } from "vitest";
import { API_PROTEGEES, PAGES_PROTEGEES, origineAutorisee, suiteSure, validerIdentifiants } from "@/lib/securite";
import { config } from "@/proxy";

describe("redirection après connexion", () => {
  it("accepte un chemin interne", () => {
    expect(suiteSure("/mairie?status=published")).toBe("/mairie?status=published");
  });
  it("refuse une redirection vers un autre site", () => {
    expect(suiteSure("//pirate.example")).toBe("/mairie");
    expect(suiteSure("/\\pirate.example")).toBe("/mairie");
    expect(suiteSure("https://pirate.example")).toBe("/mairie");
    expect(suiteSure(null)).toBe("/mairie");
  });
});

describe("origine des requêtes qui modifient", () => {
  it("accepte notre propre origine", () => {
    expect(origineAutorisee("https://demo.trycloudflare.com", "demo.trycloudflare.com")).toBe(true);
  });
  it("refuse une autre origine", () => {
    expect(origineAutorisee("https://pirate.example", "demo.trycloudflare.com")).toBe(false);
    expect(origineAutorisee("pas une url", "demo.trycloudflare.com")).toBe(false);
  });
});

describe("validation des identifiants", () => {
  it("accepte des identifiants bien formés", () => {
    expect(validerIdentifiants({ username: " agent ", password: "secret" }, true)).toEqual({ username: "agent", password: "secret" });
  });
  it("refuse les types inattendus et les valeurs trop longues", () => {
    expect(validerIdentifiants({ username: 42, password: "x" }, true)).toBeNull();
    expect(validerIdentifiants({ username: "a".repeat(151), password: "x" }, true)).toBeNull();
    expect(validerIdentifiants({ username: "agent", password: "" }, true)).toBeNull();
    expect(validerIdentifiants(null, false)).toBeNull();
  });
});

describe("routes protégées", () => {
  it("le matcher de proxy.ts couvre toutes les pages et API protégées", () => {
    for (const r of [...PAGES_PROTEGEES, ...API_PROTEGEES]) expect(config.matcher).toContain(`${r}/:path*`);
  });
  it("protège les endpoints agents du contrat", () => {
    expect(API_PROTEGEES).toContain("/api/v1/agent");
  });
});
