export interface SeriesDefinition {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  slugs: string[];
  accent: "blue" | "emerald" | "violet" | "amber";
}

export const seriesDefinitions: SeriesDefinition[] = [
  {
    slug: "codex",
    title: "Codex 使用教程",
    description: "从准备环境、安装登录到界面设置和宠物玩法，整理成一条可连续阅读的路线。",
    tags: ["Codex", "AI", "教程", "安装", "使用指南", "宠物"],
    slugs: [
      "codex-prep-clash-chrome-setup",
      "codex-install-login-guide",
      "codex-usage-guide-interface-settings",
      "codex-pet-creation-guide",
    ],
    accent: "blue",
  },
  {
    slug: "windows-setup",
    title: "Windows 配置",
    description: "记录 Windows 下查找程序、配置环境变量、处理 PowerShell 和工具链的实用笔记。",
    tags: ["Windows", "环境变量", "PowerShell"],
    slugs: ["Windows_Program_Search_and_Environment_Variable_Guide"],
    accent: "emerald",
  },
  {
    slug: "java-functional",
    title: "Java 函数式编程",
    description: "围绕 Lambda、方法引用和 Stream API，逐步梳理 Java 8 的函数式写法。",
    tags: ["Lambda"],
    slugs: ["lambda", "post-mpou6s96", "stream-api"],
    accent: "violet",
  },
  {
    slug: "blog-building",
    title: "博客搭建记录",
    description: "关于这个博客本身的搭建、部署、内容组织和写作系统演进。",
    tags: ["博客", "技术"],
    slugs: ["building-this-blog", "post-mpjs9zwr"],
    accent: "amber",
  },
];

const seriesClassByAccent: Record<SeriesDefinition["accent"], string> = {
  blue: "s-codex",
  emerald: "s-windows",
  violet: "s-java",
  amber: "s-blog",
};

export function getSeriesClassName(
  series: Pick<SeriesDefinition, "accent"> | null | undefined
): string {
  return series ? seriesClassByAccent[series.accent] : "";
}

export function createSeriesSlug(title: string): string {
  const ascii = title
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();

  if (ascii) return ascii;

  let hash = 0;
  for (let i = 0; i < title.length; i += 1) {
    hash = (hash * 31 + title.charCodeAt(i)) >>> 0;
  }
  return `series-${hash.toString(36)}`;
}
