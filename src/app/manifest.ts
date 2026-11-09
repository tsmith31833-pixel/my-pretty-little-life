import type { MetadataRoute } from "next";

// Lets you add the planner to your iPhone, iPad or laptop like an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "My Pretty Little Life",
    short_name: "Pretty Life",
    description: "My private personal planner.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF8F3",
    theme_color: "#E2357B",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
