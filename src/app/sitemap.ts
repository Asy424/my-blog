import type { MetadataRoute } from "next";
import { getAllTags, getSortedPostsData } from "@/lib/posts";
import { getSeriesSummaries } from "@/lib/series";
import { siteConfig } from "@/site.config";

export const dynamic = "force-static";

function page(pathname: string, priority: number): MetadataRoute.Sitemap[number] {
  return {
    url: `${siteConfig.url}${pathname}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority,
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getSortedPostsData().map((post) => ({
    url: `${siteConfig.url}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const tags = getAllTags().map((tag) => ({
    url: `${siteConfig.url}/tags/${encodeURIComponent(tag)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  const series = getSeriesSummaries()
    .filter((series) => series.postCount > 0)
    .map((series) => ({
      url: `${siteConfig.url}/series/${series.slug}`,
      lastModified: new Date(series.latestDate || Date.now()),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

  return [
    page("/", 1),
    page("/blog", 0.9),
    page("/series", 0.8),
    page("/archive", 0.7),
    page("/tags", 0.6),
    page("/about", 0.5),
    ...posts,
    ...series,
    ...tags,
  ];
}
