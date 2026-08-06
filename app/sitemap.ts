// app/sitemap.ts
import { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://regulaton.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url:             `${BASE}/`,
      lastModified:    new Date(),
      changeFrequency: "monthly",
      priority:        1.0,
    },
    {
      url:             `${BASE}/check`,
      lastModified:    new Date(),
      changeFrequency: "monthly",
      priority:        0.9,
    },
    {
      url:             `${BASE}/pricing`,
      lastModified:    new Date(),
      changeFrequency: "monthly",
      priority:        0.8,
    },
    {
      url:             `${BASE}/privacy`,
      lastModified:    new Date(),
      changeFrequency: "yearly",
      priority:        0.3,
    },
    {
      url:             `${BASE}/terms`,
      lastModified:    new Date(),
      changeFrequency: "yearly",
      priority:        0.3,
    },
  ];
}
