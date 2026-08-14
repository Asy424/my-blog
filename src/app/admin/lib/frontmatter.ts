import matter from "gray-matter";
import { normalizeSlug, parseTagList, todayString } from "@/lib/post-schema";

export interface ParsedFrontmatter {
  data: Record<string, unknown>;
  body: string;
}

/**
 * 解析 frontmatter。
 * 注意 gray-matter 会把未加引号的 ISO 日期解析为 Date 对象，
 * 通过 dateField / stringField / tagListField 等辅助函数统一成字符串。
 */
export function parseFrontmatter(content: string): ParsedFrontmatter {
  const parsed = matter(content);
  return {
    data: (parsed.data ?? {}) as Record<string, unknown>,
    body: parsed.content.trimStart(),
  };
}

/** 日期字段：Date 或字符串 → YYYY-MM-DD；无效返回空字符串 */
export function dateField(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().split("T")[0];
  }
  return typeof value === "string" ? value.trim() : "";
}

export function stringField(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** 标签字段：数组 → "a, b" 逗号分隔字符串 */
export function tagListField(value: unknown): string {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string").join(", ");
  }
  return stringField(value);
}

export function booleanField(value: unknown, defaultValue: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value !== "false";
  return defaultValue;
}

/** JSON.stringify 的结果是合法 YAML 字符串，可安全包含引号等特殊字符 */
function yamlString(value: string): string {
  return JSON.stringify(value);
}

export function buildFrontmatter(
  title: string,
  tags: string,
  description: string,
  isPublic: boolean,
  seriesSlug: string,
  seriesTitle: string,
  date?: string,
  updated?: string
) {
  // 编辑已有文章时保留原发布日期；新建文章才用今天
  const dateStr = date || todayString();
  const tagList = parseTagList(tags);
  const tagsStr = tagList.map((t) => yamlString(t)).join(", ");
  const lines = [
    "---",
    `title: ${yamlString(title)}`,
    `date: ${yamlString(dateStr)}`,
    updated && updated !== dateStr ? `updated: ${yamlString(updated)}` : "",
    `tags: [${tagsStr}]`,
    seriesSlug ? `series: ${yamlString(seriesSlug)}` : "",
    seriesTitle ? `seriesTitle: ${yamlString(seriesTitle)}` : "",
    description ? `description: ${yamlString(description)}` : "",
    `public: ${isPublic}`,
    "---",
  ].filter(Boolean);
  return lines.join("\n") + "\n\n";
}

/** 从标题生成 slug：提取其中的英文/数字片段；纯中文返回空字符串 */
export function slugify(title: string) {
  return normalizeSlug(title.replace(/[^a-zA-Z0-9\s-]/g, " "));
}

/** 纯中文/无英文标题的时间戳兜底 slug */
export function fallbackSlug() {
  return `post-${Date.now().toString(36)}`;
}

export interface DraftSignatureInput {
  title: string;
  slugInput: string;
  dateInput: string;
  updatedInput: string;
  tags: string;
  description: string;
  seriesMode: string;
  customSeriesTitle: string;
  content: string;
  isPublic: boolean;
}

export function draftSignature(input: DraftSignatureInput) {
  return JSON.stringify(input);
}
