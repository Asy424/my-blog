import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { siteConfig } from "@/site.config";

const postsDirectory = path.join(process.cwd(), "posts");

export interface PostData {
  slug: string;
  title: string;
  date: string;
  updated?: string;
  tags: string[];
  description: string;
  public: boolean;
  series?: string;
  seriesTitle?: string;
  content?: string;
  readingTime?: number;
}

/** 估算阅读时间（分钟）。中文约 400 字/分钟，代码和英文较慢 */
function estimateReadingTime(text: string): number {
  const stripped = text.replace(/```[\s\S]*?```/g, (m) => " ".repeat(m.length));
  const clean = stripped.replace(/[#*_\[\]()>~`\-|{}!]/g, "");
  const cjk = (clean.match(/[一-鿿㐀-䶿]/g) || []).length;
  const latin = (clean.match(/[a-zA-Z]+/g) || []).length;
  const minutes = cjk / 400 + latin / 200;
  return Math.max(1, Math.ceil(minutes));
}

export function getSortedPostsData(includePrivate = false): PostData[] {
  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, "");
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const matterResult = matter(fileContents);

      return {
        slug,
        title: matterResult.data.title,
        date: matterResult.data.date,
        updated: matterResult.data.updated,
        tags: matterResult.data.tags || [],
        description: matterResult.data.description || "",
        public: matterResult.data.public !== false,
        series: matterResult.data.series,
        seriesTitle: matterResult.data.seriesTitle,
        readingTime: estimateReadingTime(matterResult.content),
      };
    });

  const sorted = allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1));
  if (includePrivate) return sorted;
  return sorted.filter((p) => p.public);
}

export function getAllTags(): string[] {
  const posts = getSortedPostsData();
  const tagSet = new Set<string>();
  posts.forEach((post) => post.tags.forEach((tag) => tagSet.add(tag)));
  return Array.from(tagSet).sort();
}

export function getPostBySlug(slug: string): PostData | null {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.md`);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const matterResult = matter(fileContents);

    return {
      slug,
      title: matterResult.data.title,
      date: matterResult.data.date,
      updated: matterResult.data.updated,
      tags: matterResult.data.tags || [],
      description: matterResult.data.description || "",
      public: matterResult.data.public !== false,
      series: matterResult.data.series,
      seriesTitle: matterResult.data.seriesTitle,
      content: matterResult.content,
      readingTime: estimateReadingTime(matterResult.content),
    };
  } catch {
    return null;
  }
}

export function getPostsByTag(tag: string): PostData[] {
  const posts = getSortedPostsData();
  return posts.filter((post) => post.tags.includes(tag));
}

export function getPostNeighbors(slug: string): {
  prev: PostData | null;
  next: PostData | null;
} {
  const posts = getSortedPostsData();
  const index = posts.findIndex((p) => p.slug === slug);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: index < posts.length - 1 ? posts[index + 1] : null,
    next: index > 0 ? posts[index - 1] : null,
  };
}

export function getRelatedPosts(post: PostData, limit = 3): PostData[] {
  const posts = getSortedPostsData().filter((item) => item.slug !== post.slug);
  const tagSet = new Set(post.tags);

  return posts
    .map((item) => {
      const tagScore = item.tags.filter((tag) => tagSet.has(tag)).length;
      const seriesScore = post.series && item.series === post.series ? 2 : 0;
      return { post: item, score: tagScore + seriesScore };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.post.date.localeCompare(a.post.date);
    })
    .slice(0, limit)
    .map((item) => item.post);
}

function postLinksToSlug(content: string, slug: string): boolean {
  const escapedSlug = slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedBasePath = siteConfig.basePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`\\]\\(\\./${escapedSlug}\\.md(?:#[^)]+)?\\)`, "i"),
    new RegExp(`\\]\\(/blog/${escapedSlug}(?:#[^)]+)?\\)`, "i"),
    new RegExp(`\\]\\(${escapedBasePath}/blog/${escapedSlug}(?:#[^)]+)?\\)`, "i"),
  ];
  return patterns.some((pattern) => pattern.test(content));
}

export function getBacklinks(slug: string): PostData[] {
  return getSortedPostsData()
    .filter((post) => post.slug !== slug)
    .filter((post) => {
      const fullPath = path.join(postsDirectory, `${post.slug}.md`);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const matterResult = matter(fileContents);
      return postLinksToSlug(matterResult.content, slug);
    });
}
