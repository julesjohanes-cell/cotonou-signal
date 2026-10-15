import type { MetadataRoute } from "next";

// Liens à usage unique, numéros de suivi et espace agent : jamais indexés par les moteurs de recherche.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/s/", "/suivi/", "/mairie", "/connexion", "/session"] },
  };
}
