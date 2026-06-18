import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";
import { getPostBySlug, getSortedPostsData } from "./posts";
import { siteConfig } from "../site.config";

export function generateSearchIndex() {
  const posts = getSortedPostsData();
  const searchIndex = posts.map((post) => {
    const fullPost = getPostBySlug(post.slug);
    return {
      slug: post.slug,
      title: post.title,
      description: post.description,
      body: createSearchExcerpt(fullPost?.content || ""),
      tags: post.tags.join(", "),
      date: post.date,
      updated: post.updated || post.date,
    };
  });

  const outputPath = path.join(process.cwd(), "public", "search-index.json");
  fs.writeFileSync(outputPath, JSON.stringify(searchIndex), "utf8");
  console.log(`✓ 搜索索引已生成 (${searchIndex.length} 篇文章)`);
}

export function generateRss() {
  const posts = getSortedPostsData();

  const rssItems = posts
    .map((post) => {
      const fullPost = getPostBySlug(post.slug);
      const html = fullPost?.content
        ? absolutizeUrls(renderMarkdown(fullPost.content))
        : "";
      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${siteConfig.url}/blog/${post.slug}</link>
      <description>${escapeXml(post.description)}</description>
      <pubDate>${formatRssDate(post.date, post.slug)}</pubDate>
      <guid>${siteConfig.url}/blog/${post.slug}</guid>
      ${html ? `<content:encoded><![CDATA[${html}]]></content:encoded>` : ""}
    </item>`;
    })
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
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

function renderMarkdown(markdown: string): string {
  return String(remark().use(remarkGfm).use(remarkHtml).processSync(markdown));
}

function createSearchExcerpt(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+\]\([^)]+\)/g, (match) => {
      const text = match.match(/^\[([^\]]+)\]/);
      return text?.[1] || " ";
    })
    .replace(/[#>*_`~|{}\[\]()-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 360);
}

function absolutizeUrls(html: string): string {
  const basePath = siteConfig.basePath;
  return html
    .replace(new RegExp(`src="${basePath}/`, "g"), `src="${siteConfig.url}/`)
    .replace(new RegExp(`href="${basePath}/`, "g"), `href="${siteConfig.url}/`)
    .replace(/src="\/(?!\/)/g, `src="${siteConfig.url}/`)
    .replace(/href="\/(?!\/)/g, `href="${siteConfig.url}/`)
    .replace(
      /src="images\//g,
      `src="${siteConfig.url}${siteConfig.basePath}/images/`
    );
}

function isCliEntry() {
  return process.argv[1]
    ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
    : false;
}

if (isCliEntry()) {
  generateSearchIndex();
  generateRss();
}
