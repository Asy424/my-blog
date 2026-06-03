import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const postsDir = path.join(__dirname, "..", "posts");

const args = process.argv.slice(2);
const title = args[0];
const slugArgIndex = args.findIndex((arg) => arg === "--slug");
const explicitSlug = slugArgIndex >= 0 ? args[slugArgIndex + 1] : "";

if (!title) {
  console.error('用法: npm run new-post "文章标题" -- --slug article-slug');
  process.exit(1);
}

function slugify(value) {
  return value
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

const slug = slugify(explicitSlug || title) || `post-${Date.now()}`;

if (!/^[a-z0-9_-]+(?:-[a-z0-9_-]+)*$/i.test(slug)) {
  console.error(`slug 只能包含英文字母、数字、下划线和连字符: ${slug}`);
  process.exit(1);
}

const now = new Date();
const date = now.toISOString().split("T")[0];

const template = `---
title: "${title}"
date: "${date}"
tags: []
description: ""
public: true
---

`;

const filePath = path.join(postsDir, `${slug}.md`);

if (fs.existsSync(filePath)) {
  console.error(`文件已存在: ${filePath}`);
  process.exit(1);
}

fs.writeFileSync(filePath, template, "utf8");
console.log(`已创建: ${filePath}`);
