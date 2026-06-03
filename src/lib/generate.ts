import fs from "fs";
import path from "path";
import { getSortedPostsData } from "./posts";
import { siteConfig } from "../site.config";

export function generateSearchIndex() {
  const posts = getSortedPostsData();
  const searchIndex = posts.map((post) => ({
    slug: post.slug,
    title: post.title,
    description: post.description,
    tags: post.tags.join(", "),
    date: post.date,
  }));

  const outputPath = path.join(process.cwd(), "public", "search-index.json");
  fs.writeFileSync(outputPath, JSON.stringify(searchIndex), "utf8");
  console.log(`✓ 搜索索引已生成 (${searchIndex.length} 篇文章)`);
}

export function generateRss() {
  const posts = getSortedPostsData();

  const rssItems = posts
    .map(
      (post) => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${siteConfig.url}/blog/${post.slug}</link>
      <description>${escapeXml(post.description)}</description>
      <pubDate>${formatRssDate(post.date, post.slug)}</pubDate>
      <guid>${siteConfig.url}/blog/${post.slug}</guid>
    </item>`
    )
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteConfig.name)}</title>
    <link>${siteConfig.url}</link>
    <description>${escapeXml(siteConfig.description)}</description>
    <language>${siteConfig.language}</language>
    <atom:link href="${siteConfig.url}/rss.xml" rel="self" type="application/rss+xml"/>
    ${rssItems}
  </channel>
</rss>`;

  const outputPath = path.join(process.cwd(), "public", "rss.xml");
  fs.writeFileSync(outputPath, rss, "utf8");
  console.log(`✓ RSS Feed 已生成 (${posts.length} 篇文章)`);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatRssDate(date: string, slug: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid post date for ${slug}: ${date}`);
  }
  return parsed.toUTCString();
}

// 执行生成
generateSearchIndex();
generateRss();
