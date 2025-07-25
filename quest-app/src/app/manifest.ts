// app/manifest.ts
import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Quest App",
    short_name: "Quest",
    description: "Your adventure begins here",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    screenshots: [
      {
        src: "/screenshots/mobile-screenshot.png",
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow"
      },
      {
        src: "/screenshots/desktop-screenshot.png", 
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide"
      }
    ]
  };
}
