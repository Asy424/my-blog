export const siteConfig = {
  name: "我的博客",
  description: "个人技术博客，分享编程心得与技术思考。",
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
