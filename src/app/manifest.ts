import type { MetadataRoute } from "next";
import { WARM_LIGHT } from "@/lib/design/tokens";

// Installable seller app. The Serwist service worker arrives with New order
// notifications (feature 11). Icons come from scripts/brand-icons.ts.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rubi",
    short_name: "Rubi",
    description: "Your store, orders and customers in one place.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    background_color: WARM_LIGHT.background,
    theme_color: WARM_LIGHT.background,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
