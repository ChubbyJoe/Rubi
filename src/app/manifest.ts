import type { MetadataRoute } from "next";

// Installable seller app. Icons arrive with the Design system (feature 4);
// the Serwist service worker arrives with New order notifications (feature 11).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rubi",
    short_name: "Rubi",
    description: "Your store, orders and customers in one place.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#171717",
  };
}
