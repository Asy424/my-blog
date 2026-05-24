---
title: "我是如何搭建这个博客的"
date: "2026-05-24"
tags: ["技术", "博客"]
description: "从零开始搭建个人博客的技术选型与实现过程。"
public: false
---

## 技术选型

这个博客的技术栈非常简单：

- **Next.js** — React 全栈框架，支持静态生成
- **Tailwind CSS** — 原子化 CSS 框架
- **Markdown** — 用 Markdown 写文章，gray-matter 管理元数据
- **GitHub Pages** — 免费托管，配合 GitHub Actions 自动部署

## 为什么选 Next.js

选择 Next.js 主要是因为：

1. **静态生成**：构建时生成 HTML，部署简单，加载飞快
2. **React 生态**：组件化开发，生态丰富
3. **文件路由**：基于文件系统的路由，直观好用

## 部署流程

整体流程很简单：

1. 在本地写 Markdown 文章
2. 推送到 GitHub 仓库
3. GitHub Actions 自动构建
4. 部署到 GitHub Pages

整个过程完全自动化，写文章只需要关注内容本身。

## 功能特性

目前博客支持：

- Markdown 文章编写
- 标签分类
- 暗色模式切换
- 全文搜索
- RSS 订阅
- 响应式设计

## 下一步计划

未来还想加入：

- 更多个性化主题
- 文章阅读量统计
- 更好的代码高亮

博客会持续迭代，慢慢完善。
