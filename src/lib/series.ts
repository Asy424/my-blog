import { getSortedPostsData, type PostData } from "./posts";
import {
  createSeriesSlug,
  seriesDefinitions,
  type SeriesDefinition,
} from "./series-config";

export interface SeriesSummary extends SeriesDefinition {
  posts: PostData[];
  postCount: number;
  latestDate: string;
}

export const seriesList = seriesDefinitions;

function postMatchesDefinition(post: PostData, series: SeriesDefinition) {
  const slugSet = new Set(series.slugs);
  const tagSet = new Set(series.tags);
  return slugSet.has(post.slug) || post.tags.some((tag) => tagSet.has(tag));
}

function normalizePostSeries(post: PostData) {
  const raw = post.series?.trim();
  if (!raw) return null;

  const known = seriesDefinitions.find(
    (series) => series.slug === raw || series.title === raw
  );

  if (known) {
    return {
      slug: known.slug,
      title: known.title,
      description: known.description,
      accent: known.accent,
    };
  }

  const title = post.seriesTitle?.trim() || raw;
  return {
    slug: createSeriesSlug(raw),
    title,
    description: `收录「${title}」相关的公开文章。`,
    accent: "blue" as const,
  };
}

export function getSeriesBySlug(slug: string): SeriesSummary | undefined {
  return getSeriesSummaries().find((series) => series.slug === slug);
}

export function getPostsBySeries(series: Pick<SeriesDefinition, "slug">): PostData[] {
  return getSeriesBySlug(series.slug)?.posts ?? [];
}

export function getSeriesSummaries(): SeriesSummary[] {
  const posts = getSortedPostsData();
  const summaries = new Map<string, SeriesSummary>();

  seriesDefinitions.forEach((series) => {
    summaries.set(series.slug, {
      ...series,
      posts: [],
      postCount: 0,
      latestDate: "",
    });
  });

  posts.forEach((post) => {
    const explicit = normalizePostSeries(post);

    if (explicit) {
      const existing = summaries.get(explicit.slug);
      if (existing) {
        existing.posts.push(post);
      } else {
        summaries.set(explicit.slug, {
          slug: explicit.slug,
          title: explicit.title,
          description: explicit.description,
          tags: [],
          slugs: [],
          accent: explicit.accent,
          posts: [post],
          postCount: 0,
          latestDate: "",
        });
      }
      return;
    }

    seriesDefinitions.forEach((series) => {
      if (postMatchesDefinition(post, series)) {
        summaries.get(series.slug)?.posts.push(post);
      }
    });
  });

  return Array.from(summaries.values())
    .map((series) => ({
      ...series,
      postCount: series.posts.length,
      latestDate: series.posts[0]?.date ?? "",
    }))
    .sort((a, b) => {
      if (a.postCount === 0 && b.postCount !== 0) return 1;
      if (a.postCount !== 0 && b.postCount === 0) return -1;
      return b.latestDate.localeCompare(a.latestDate);
    });
}
