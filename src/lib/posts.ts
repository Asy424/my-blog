import fs from "fs";
import path from "path";
import matter from "gray-matter";

const postsDirectory = path.join(process.cwd(), "posts");

export interface PostData {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  description: string;
  public: boolean;
  series?: string;
  seriesTitle?: string;
  content?: string;
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
        tags: matterResult.data.tags || [],
        description: matterResult.data.description || "",
        public: matterResult.data.public !== false,
        series: matterResult.data.series,
        seriesTitle: matterResult.data.seriesTitle,
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
      tags: matterResult.data.tags || [],
      description: matterResult.data.description || "",
      public: matterResult.data.public !== false,
      series: matterResult.data.series,
      seriesTitle: matterResult.data.seriesTitle,
      content: matterResult.content,
    };
  } catch {
    return null;
  }
}

export function getPostsByTag(tag: string): PostData[] {
  const posts = getSortedPostsData();
  return posts.filter((post) => post.tags.includes(tag));
}
