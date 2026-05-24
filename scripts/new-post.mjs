import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const postsDir = path.join(__dirname, "..", "posts");

const title = process.argv[2];
if (!title) {
  console.error("用法: npm run new-post \"文章标题\"");
  process.exit(1);
}

// 只保留英文、数字、连字符作为文件名，中文等非ASCII字符去掉
let slug = title
  .replace(/[^\w\s-]/g, "")
  .trim()
  .replace(/\s+/g, "-")
  .replace(/-+/g, "-")
  .toLowerCase();

// 如果纯中文标题导致 slug 为空，用时间戳
if (!slug) {
  slug = `post-${Date.now()}`;
}

const now = new Date();
const date = now.toISOString().split("T")[0];

const template = `---
title: "${title}"
date: "${date}"
tags: [""]
description: ""
---

`;

const filePath = path.join(postsDir, `${slug}.md`);

if (fs.existsSync(filePath)) {
  console.error(`文件已存在: ${filePath}`);
  process.exit(1);
}

fs.writeFileSync(filePath, template, "utf8");
console.log(`✅ 已创建: ${filePath}`);
