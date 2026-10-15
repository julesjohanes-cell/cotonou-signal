import { describe, expect, it } from "vitest";
import { origineAutorisee, suiteSure, validerIdentifiants } from "@/lib/securite";

describe("redirection après connexion", () => {
  it("accepte un chemin interne", () => {
    expect(suiteSure("/mairie?statut=nouveau")).toBe("/mairie?statut=nouveau");
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
    expect(validerIdentifiants({ identifiant: " agent ", motDePasse: "secret" }, true)).toEqual({ identifiant: "agent", motDePasse: "secret" });
  });
  it("refuse les types inattendus et les valeurs trop longues", () => {
    expect(validerIdentifiants({ identifiant: 42, motDePasse: "x" }, true)).toBeNull();
    expect(validerIdentifiants({ identifiant: "a".repeat(151), motDePasse: "x" }, true)).toBeNull();
    expect(validerIdentifiants({ identifiant: "agent", motDePasse: "" }, true)).toBeNull();
    expect(validerIdentifiants(null, false)).toBeNull();
  });
});
