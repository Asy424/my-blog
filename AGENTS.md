# my-blog 项目协作说明

> 本文件基于当前仓库可见的 `README.md`、`package.json`、`next.config.ts`、`src/site.config.ts`、`src/app/`、`src/components/`、`src/lib/`、`scripts/` 和 `.github/workflows/deploy.yml` 整理。它是协作约定，不是完整产品 PRD；若本文与代码或用户最新说明冲突，以代码和用户说明为准。

## 语言和沟通

- 默认用中文和用户沟通。
- 先讲结论，再讲关键原因。
- 修改多个文件前先给简短计划。
- 不确定时说明假设和风险，不要把推测写成确定事实。
- 动手前先阅读相关文件和已有约定，避免凭空猜测项目结构。

## 已确认的项目事实

- 这是一个基于 Next.js App Router 的个人静态博客。
- 当前 `package.json` 中 `next` 版本为 `16.2.6`，`react` / `react-dom` 为 `19.2.4`。
- `next.config.ts` 配置了 `output: "export"`，构建产物输出到 `out/`。
- 站点 `basePath`、作者、仓库和导航等配置集中在 `src/site.config.ts`。
- 文章内容来自 `posts/*.md`，由 `gray-matter` 读取 frontmatter。
- 公开页面包括首页、文章列表、文章详情、归档、标签、系列、关于页，以及 sitemap / robots / Open Graph image 路由。
- `public: false` 的文章不会进入默认公开列表、搜索索引和 RSS。
- 搜索索引 `public/search-index.json` 与 RSS `public/rss.xml` 由 `src/lib/generate.ts` 生成。
- `/admin` 是客户端管理后台，通过 GitHub API 读取/保存/删除 `posts/` 下文章，并上传图片到 `public/images/YYYY/MM/`。
- 部署 workflow 位于 `.github/workflows/deploy.yml`：push 到 `master` 或手动触发后，执行 `npm ci`、`npm run lint`、`npm run build`，再上传 `out/` 到 GitHub Pages。

## 重要 Next.js 规则

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

- 涉及 Next.js API、App Router、metadata、静态导出、图片、路由约定等改动时，优先查阅本项目安装版本对应的 `node_modules/next/dist/docs/`。
- 不要仅凭旧版 Next.js 经验改框架相关代码。

## 目录约定

- 页面和路由：`src/app/`
- 公开站点布局和页面：`src/app/(main)/`
- 管理后台：`src/app/admin/`
- 通用组件：`src/components/`
- Hooks：`src/hooks/`
- 数据读取、生成和工具函数：`src/lib/`
- 站点配置：`src/site.config.ts`
- 文章 Markdown：`posts/`
- 静态资源：`public/`
- 脚本：`scripts/`
- GitHub Pages workflow：`.github/workflows/deploy.yml`
- 构建产物：`out/`
- Next.js 缓存/中间产物：`.next/`

## 内容和文章规则

- 新文章应放在 `posts/`，文件名即 slug，建议使用小写英文、数字和连字符。
- frontmatter 重点字段包括：`title`、`date`、`updated`、`tags`、`series`、`seriesTitle`、`description`、`public`。
- `src/lib/posts.ts` 会规范化日期、标签、公开状态，并计算阅读时间。
- `src/lib/post-schema.ts` 提供后台草稿校验，包括标题、slug、日期、标签、内容、图片路径和本地 Markdown 链接检查。
- 图片建议放在 `public/images/`；在文章中引用时注意与 `basePath` 的关系。
- 修改文章结构、frontmatter、图片路径或内部链接后，优先运行文章校验和构建命令。

## `/admin` 后台规则

- `/admin` 使用客户端组件和浏览器存储；GitHub PAT 当前由用户在浏览器输入，并保存在 `sessionStorage`。
- `src/lib/github-admin.ts` 通过 GitHub Contents API 操作 `posts/` 和 `public/images/`。
- 保存已有文章时依赖 GitHub 返回的 `sha`，遇到 409 冲突应提示用户刷新后再编辑，不要静默覆盖。
- 后台编辑器有本地草稿自动保存、离开页面提醒、Ctrl/Cmd+S 保存、图片粘贴/拖拽上传、媒体库插入等行为。
- 修改后台时重点检查：token 暴露面、GitHub API 写入路径、删除确认、Markdown 预览 XSS、图片压缩和上传路径。
- 不要在仓库、文档、示例或测试输出中写入真实 token。

## 常用命令

- 安装依赖：`npm ci`
- 本地启动：`npm run dev`
- 同步远端 master：`npm run sync`
- 新建文章：`npm run new-post "文章标题"`
- 校验文章：`npm run validate-posts`
- 生成搜索索引和 RSS：`npm run generate`
- 代码检查：`npm run lint`
- 构建静态站点：`npm run build`

## 修改边界

- 不要直接编辑 `.next/` 和 `out/`；它们是生成产物。
- 不要删除用户文章、图片、历史记录、配置文件或密钥。
- 不要自动执行 `git push`、部署、发布或破坏性迁移。
- 修改范围尽量小，不做与当前任务无关的重构。
- 遇到用户已经修改过的文件，先理解现状再继续。
- 命令失败时先读错误信息，不要硬猜。

## 验收标准

- 修改代码后尽量运行 `npm run build`；至少根据改动范围运行 `npm run lint` 或 `npm run validate-posts`。
- 如果测试、检查或构建不能运行，说明原因和未验证风险。
- 交付时说明：改了什么、为什么这样改、验证了什么、仍有什么风险。

## 安全注意事项

- Markdown 渲染链路要防止 XSS，尤其关注 unsafe URL scheme、raw HTML 和 `dangerouslySetInnerHTML`。
- 搜索索引、RSS、sitemap 和静态导出不要泄露 `public: false` 内容。
- GitHub token 存储和使用逻辑要尽量降低被同源脚本读取后的影响，建议使用最小权限 token。
- 图片上传和文章保存逻辑要限制在预期目录，避免路径越界和意外覆盖。
