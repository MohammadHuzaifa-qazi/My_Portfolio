import type { MetadataRoute } from "next";

// Single-page portfolio — one entry is all we need.
// If you get a custom domain later, update this URL.
const SITE_URL = "https://myportfolio-git-main-huzaifa-qazis-projects.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
