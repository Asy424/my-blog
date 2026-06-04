export const siteConfig = {
  name: "我的博客",
  description: "记录 AI 工具、编程学习、系统配置与折腾笔记。",
  language: "zh-CN",
  basePath: "/my-blog",
  url: "https://asy424.github.io/my-blog",
  github: {
    owner: "Asy424",
    repo: "my-blog",
  },
} as const;

export function withBasePath(pathname: string): string {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${siteConfig.basePath}${normalized}`;
}
