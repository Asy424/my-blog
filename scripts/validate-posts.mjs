import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import { siteConfig } from "../src/site.config";
import { isValidDateString } from "../src/lib/post-schema";
import { createSeriesSlug, seriesDefinitions } from "../src/lib/series-config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const postsDir = path.join(rootDir, "posts");
const publicDir = path.join(rootDir, "public");
const imageWarningBytes = 1.5 * 1024 * 1024;

const errors = [];
const warnings = [];
const slugs = new Set();
const fileContents = new Map();

function addError(fileName, message) {
  errors.push(`${fileName}: ${message}`);
}

function addWarning(fileName, message) {
  warnings.push(`${fileName}: ${message}`);
}

function normalizePublicImagePath(url) {
  const cleanUrl = url
    .trim()
    .replace(/^<|>$/g, "")
    .split("#")[0]
    .split("?")[0];

  if (
    !cleanUrl ||
    cleanUrl.startsWith("http://") ||
    cleanUrl.startsWith("https://") ||
    cleanUrl.startsWith("data:") ||
    cleanUrl.startsWith("#")
  ) {
    return null;
  }

  if (siteConfig.basePath && cleanUrl.startsWith(`${siteConfig.basePath}/`)) {
    return cleanUrl.slice(siteConfig.basePath.length + 1);
  }
  if (cleanUrl.startsWith("/")) {
    return cleanUrl.slice(1);
  }
  if (cleanUrl.startsWith("images/")) {
    return cleanUrl;
  }

  return null;
}

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function validateImages(fileName, content) {
  const imageRegex = /!\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
  for (const match of content.matchAll(imageRegex)) {
    const imagePath = normalizePublicImagePath(match[1]);
    if (!imagePath) continue;

    const fullPath = path.join(publicDir, imagePath);
    if (!fs.existsSync(fullPath)) {
      addError(fileName, `图片不存在: ${match[1]}`);
      continue;
    }

    const size = fs.statSync(fullPath).size;
    if (size > imageWarningBytes) {
      addWarning(fileName, `图片偏大: ${match[1]} (${formatBytes(size)})`);
    }
  }
}

function normalizeInternalLink(rawUrl) {
  const cleanUrl = rawUrl
    .trim()
    .replace(/^<|>$/g, "")
    .split("#")[0]
    .split("?")[0];

  if (
    !cleanUrl ||
    cleanUrl.startsWith("http://") ||
    cleanUrl.startsWith("https://") ||
    cleanUrl.startsWith("mailto:") ||
    cleanUrl.startsWith("#")
  ) {
    return null;
  }

  if (cleanUrl.startsWith("./") && cleanUrl.endsWith(".md")) {
    return cleanUrl.slice(2, -3);
  }

  const blogPrefix = siteConfig.basePath
    ? `${siteConfig.basePath}/blog/`
    : "/blog/";
  if (cleanUrl.startsWith(blogPrefix)) {
    return cleanUrl.slice(blogPrefix.length).replace(/\/$/, "");
  }
  if (cleanUrl.startsWith("/blog/")) {
    return cleanUrl.slice("/blog/".length).replace(/\/$/, "");
  }

  return null;
}

function validateLinks(fileName, content) {
  const linkRegex = /(?<!!)\[[^\]]+\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
  for (const match of content.matchAll(linkRegex)) {
    const slug = normalizeInternalLink(match[1]);
    if (slug && !slugs.has(decodeURIComponent(slug))) {
      addError(fileName, `站内链接目标不存在: ${match[1]}`);
    }
  }
}

function validateSeries(fileName, data) {
  if (data.series !== undefined && typeof data.series !== "string") {
    addError(fileName, "series must be a string");
    return;
  }

  if (data.seriesTitle !== undefined && typeof data.seriesTitle !== "string") {
    addError(fileName, "seriesTitle must be a string");
    return;
  }

  if (typeof data.series !== "string") return;

  const series = data.series.trim();
  if (!series) {
    addError(fileName, "series must not be empty");
    return;
  }

  const knownSeries = seriesDefinitions.some(
    (item) => item.slug === series || item.title === series
  );
  if (knownSeries) return;

  const title = typeof data.seriesTitle === "string" ? data.seriesTitle.trim() : "";
  if (!title) {
    addError(fileName, "custom series requires a non-empty seriesTitle");
    return;
  }

  if (series !== createSeriesSlug(title)) {
    addWarning(fileName, `series does not match generated seriesTitle slug: ${series}`);
  }
}

const files = fs
  .readdirSync(postsDir)
  .filter((fileName) => fileName.endsWith(".md"))
  .sort();

for (const fileName of files) {
  const slug = fileName.replace(/\.md$/, "");
  if (slugs.has(slug)) {
    addError(fileName, `slug 重复: ${slug}`);
  }
  slugs.add(slug);

  const fullPath = path.join(postsDir, fileName);
  const raw = fs.readFileSync(fullPath, "utf8");
  fileContents.set(fileName, raw);
  const { data, content } = matter(raw);

  if (typeof data.title !== "string" || !data.title.trim()) {
    addError(fileName, "title 必须是非空字符串");
  }

  if (!isValidDateString(data.date)) {
    addError(fileName, "date 必须是合法日期");
  }

  if (data.updated !== undefined && !isValidDateString(data.updated)) {
    addError(fileName, "updated 必须是合法日期");
  }

  if (!Array.isArray(data.tags)) {
    addError(fileName, "tags 必须是数组");
  } else {
    data.tags.forEach((tag, index) => {
      if (typeof tag !== "string" || !tag.trim()) {
        addError(fileName, `tags[${index}] 必须是非空字符串`);
      }
    });
  }

  if (data.description !== undefined && typeof data.description !== "string") {
    addError(fileName, "description 必须是字符串");
  }

  if (data.public !== undefined && typeof data.public !== "boolean") {
    addError(fileName, "public 必须是布尔值");
  }

  validateSeries(fileName, data);
  validateImages(fileName, content);
}

for (const [fileName, raw] of fileContents) {
  const { content } = matter(raw);
  validateLinks(fileName, content);
}

if (warnings.length > 0) {
  console.warn(`文章校验提示，共 ${warnings.length} 项：`);
  warnings.forEach((warning) => console.warn(`- ${warning}`));
}

if (errors.length > 0) {
  console.error(`文章校验失败，共 ${errors.length} 个问题：`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`文章校验通过，共 ${files.length} 篇文章`);
