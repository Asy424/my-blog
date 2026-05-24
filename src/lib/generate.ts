import fs from "fs";
import path from "path";
import { getSortedPostsData } from "./posts";

const siteUrl = "https://yourusername.github.io/blog";
const siteName = "我的博客";

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
      <link>${siteUrl}/blog/${post.slug}</link>
      <description>${escapeXml(post.description)}</description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <guid>${siteUrl}/blog/${post.slug}</guid>
    </item>`
    )
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${siteUrl}</link>
    <description>个人技术博客</description>
    <language>zh-CN</language>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
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

// 执行生成
generateSearchIndex();
generateRss();
