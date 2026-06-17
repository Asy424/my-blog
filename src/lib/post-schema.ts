export interface PostDraftInput {
  title: string;
  slug: string;
  date: string;
  updated?: string;
  tags: string;
  description?: string;
  content: string;
  isPublic: boolean;
  existingSlugs?: string[];
  editingSlug?: string;
}

export function todayString() {
  return new Date().toISOString().split("T")[0];
}

export function parseTagList(value: string): string[] {
  return value
    .replace(/[\[\]"']+/g, "")
    .split(/[,，\s]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function isValidDateString(value: unknown): value is string {
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  if (typeof value !== "string" || !value.trim()) return false;
  return !Number.isNaN(new Date(value).getTime());
}

export function normalizeSlug(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
    .replace(/^-|-$/g, "");
}

export function validatePostDraft(input: PostDraftInput): string[] {
  const issues: string[] = [];
  const title = input.title.trim();
  const slug = normalizeSlug(input.slug);
  const tags = parseTagList(input.tags);
  const body = input.content.trim();

  if (!title) issues.push("标题不能为空");
  if (!slug) issues.push("slug 不能为空");
  if (!isValidDateString(input.date)) issues.push("发布日期必须是合法日期");
  if (input.updated && !isValidDateString(input.updated)) {
    issues.push("更新时间必须是合法日期");
  }
  if (input.updated && input.date && new Date(input.updated) < new Date(input.date)) {
    issues.push("更新时间不能早于发布日期");
  }
  if (tags.length === 0) issues.push("至少填写一个标签");
  if (!body) issues.push("正文不能为空");

  if (
    input.existingSlugs?.includes(slug) &&
    slug !== input.editingSlug
  ) {
    issues.push(`slug 已存在: ${slug}`);
  }

  const imageMatches = body.matchAll(/!\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g);
  for (const match of imageMatches) {
    const src = match[1].trim();
    if (!src || src.startsWith("#")) {
      issues.push("图片地址不能为空");
      continue;
    }
    if (
      src.startsWith("http://") ||
      src.startsWith("https://") ||
      src.startsWith("data:") ||
      src.startsWith("/") ||
      src.startsWith("images/")
    ) {
      continue;
    }
    issues.push(`图片路径建议使用 /images/... 或 images/...: ${src}`);
  }

  const mdLinks = body.matchAll(/\[[^\]]+\]\((\.\/[^)\s]+\.md)(?:#[^)]*)?\)/g);
  for (const match of mdLinks) {
    const linkedSlug = match[1].replace(/^\.\//, "").replace(/\.md$/, "");
    if (input.existingSlugs && !input.existingSlugs.includes(linkedSlug)) {
      issues.push(`站内 Markdown 链接目标不存在: ${match[1]}`);
    }
  }

  return Array.from(new Set(issues));
}
