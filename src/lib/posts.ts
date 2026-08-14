import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { isValidDateString } from "@/lib/post-schema";
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

interface PostRecord extends Omit<PostData, "content"> {
  content: string;
}

interface PostsCacheEntry {
  signature: string;
  records: PostRecord[];
}

let postsCache: PostsCacheEntry | null = null;

/** 估算阅读时间（分钟）。中文约 400 字/分钟，代码和英文较慢 */
function estimateReadingTime(text: string): number {
  const stripped = text.replace(/```[\s\S]*?```/g, (m) => " ".repeat(m.length));
  const clean = stripped.replace(/[#*_\[\]()>~`\-|{}!]/g, "");
  const cjk = (clean.match(/[一-鿿㐀-䶿]/g) || []).length;
  const latin = (clean.match(/[a-zA-Z]+/g) || []).length;
  const minutes = cjk / 400 + latin / 200;
  return Math.max(1, Math.ceil(minutes));
}

function normalizeDateField(value: unknown, field: string, slug: string): string {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error(`Invalid frontmatter for ${slug}: ${field} 必须是合法日期`);
    }
    return value.toISOString().split("T")[0];
  }
  if (!isValidDateString(value)) {
    throw new Error(`Invalid frontmatter for ${slug}: ${field} 必须是合法日期`);
  }
  return value.trim();
}

function optionalString(value: unknown, field: string, slug: string): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") {
    throw new Error(`Invalid frontmatter for ${slug}: ${field} 必须是字符串`);
  }
  return value.trim() || undefined;
}

function normalizeTags(value: unknown, slug: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid frontmatter for ${slug}: tags 必须是字符串数组`);
  }
  const tags = value.map((tag, index) => {
    if (typeof tag !== "string" || !tag.trim()) {
      throw new Error(`Invalid frontmatter for ${slug}: tags[${index}] 必须是非空字符串`);
    }
    return tag.trim();
  });
  return tags;
}

function normalizePost(fileName: string): PostRecord {
  const slug = fileName.replace(/\.md$/, "");
  const fullPath = path.join(postsDirectory, fileName);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const matterResult = matter(fileContents);
  const data = matterResult.data as Record<string, unknown>;

  if (typeof data.title !== "string" || !data.title.trim()) {
    throw new Error(`Invalid frontmatter for ${slug}: title 必须是非空字符串`);
  }

  const date = normalizeDateField(data.date, "date", slug);
  const updated = data.updated === undefined
    ? undefined
    : normalizeDateField(data.updated, "updated", slug);

  if (updated && new Date(updated) < new Date(date)) {
    throw new Error(`Invalid frontmatter for ${slug}: updated 不能早于 date`);
  }

  if (data.public !== undefined && typeof data.public !== "boolean") {
    throw new Error(`Invalid frontmatter for ${slug}: public 必须是布尔值`);
  }

  return {
    slug,
    title: data.title.trim(),
    date,
    updated,
    tags: normalizeTags(data.tags, slug),
    description: optionalString(data.description, "description", slug) || "",
    public: data.public !== false,
    series: optionalString(data.series, "series", slug),
    seriesTitle: optionalString(data.seriesTitle, "seriesTitle", slug),
    content: matterResult.content,
    readingTime: estimateReadingTime(matterResult.content),
  };
}

/** 基于文件 mtime + size 计算签名，posts/ 下任何文件变化都会让缓存自动失效（解决 dev 热更新读到旧列表的问题） */
function getAllPostRecords(): PostRecord[] {
  const files = fs
    .readdirSync(postsDirectory)
    .filter((fileName) => fileName.endsWith(".md"));
  const signature = files
    .map((fileName) => {
      const stat = fs.statSync(path.join(postsDirectory, fileName));
      return `${fileName}:${stat.mtimeMs}:${stat.size}`;
    })
    .sort()
    .join("|");

  if (postsCache && postsCache.signature === signature) {
    return postsCache.records;
  }

  const records = files
    .map(normalizePost)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  postsCache = { signature, records };
  return records;
}

function toPostData(post: PostRecord, includeContent = false): PostData {
  return {
    slug: post.slug,
    title: post.title,
    date: post.date,
    updated: post.updated,
    tags: [...post.tags],
    description: post.description,
    public: post.public,
    series: post.series,
    seriesTitle: post.seriesTitle,
    readingTime: post.readingTime,
    content: includeContent ? post.content : undefined,
  };
}

export function getSortedPostsData(includePrivate = false): PostData[] {
  const posts = getAllPostRecords();
  const filtered = includePrivate ? posts : posts.filter((p) => p.public);
  return filtered.map((post) => toPostData(post));
}

export function getAllTags(): string[] {
  const tagSet = new Set<string>();
  getSortedPostsData().forEach((post) => post.tags.forEach((tag) => tagSet.add(tag)));
  return Array.from(tagSet).sort();
}

export function getPostBySlug(slug: string): PostData | null {
  const post = getAllPostRecords().find((item) => item.slug === slug);
  return post ? toPostData(post, true) : null;
}

export function getPostsByTag(tag: string): PostData[] {
  return getSortedPostsData().filter((post) => post.tags.includes(tag));
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
  return getAllPostRecords()
    .filter((post) => post.public && post.slug !== slug)
    .filter((post) => postLinksToSlug(post.content, slug))
    .map((post) => toPostData(post));
}
