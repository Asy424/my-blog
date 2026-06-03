# 我的博客

基于 Next.js App Router 的个人静态博客，内容来自 `posts/` 目录下的 Markdown 文件，构建产物导出到 `out/` 并部署到 GitHub Pages。

## 功能

- Markdown 文章与 frontmatter 元数据
- 标签页、文章列表和文章详情页
- 静态搜索索引 `public/search-index.json`
- RSS Feed `public/rss.xml`
- `sitemap.xml` 和 `robots.txt`
- 深色模式、代码高亮和代码块复制按钮
- 可选的 `/admin` 浏览器编辑器

## 常用命令

```bash
npm run dev
npm run new-post "文章标题"
npm run new-post "中文标题" -- --slug readable-slug
npm run validate-posts
npm run generate
npm run lint
npm run build
```

## 写文章

新文章放在 `posts/` 目录，文件名就是文章 slug。frontmatter 示例：

```yaml
---
title: "文章标题"
date: "2026-06-03"
tags: ["技术", "Next.js"]
description: "文章摘要"
public: true
---
```

`public: false` 会把文章从列表、搜索索引、RSS、sitemap 和静态详情页中排除。构建前会运行 `validate-posts`，检查必要字段和本地图片路径。

## 静态资源

图片放在 `public/images/` 下，文章里可以使用：

```md
![说明](/my-blog/images/example.jpg)
```

或者：

```md
![说明](images/example.jpg)
```

## 后台编辑器

线上和本地都可以访问 `/admin`。后台使用 GitHub Personal Access Token 操作仓库内容，页面本身不包含仓库写入权限。

建议只授予当前仓库所需的最小 `contents` 权限。Token 只保存在当前浏览器会话中，关闭会话后需要重新输入。

## 部署

GitHub Actions 在推送到 `master` 后执行：

1. `npm ci`
2. `npm run lint`
3. `npm run build`
4. 上传 `out/` 到 GitHub Pages

站点路径和仓库信息集中在 `src/site.config.ts`。
