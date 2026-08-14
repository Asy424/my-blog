import { describe, it, expect } from "vitest";
import {
  isValidDateString,
  normalizeSlug,
  parseTagList,
  todayString,
  validatePostDraft,
} from "../post-schema";

describe("normalizeSlug", () => {
  it("把英文标题转为小写连字符 slug", () => {
    expect(normalizeSlug("Hello World!")).toBe("hello-world");
  });

  it("保留数字、点、下划线和连字符", () => {
    expect(normalizeSlug("Next.js_Guide-2026")).toBe("next.js_guide-2026");
  });

  it("纯中文返回空字符串", () => {
    expect(normalizeSlug("中文标题")).toBe("");
  });

  it("合并连续连字符并去掉首尾连字符", () => {
    expect(normalizeSlug("a---b--")).toBe("a-b");
  });
});

describe("parseTagList", () => {
  it("支持中英文逗号和空格分隔", () => {
    expect(parseTagList("a, b，c d")).toEqual(["a", "b", "c", "d"]);
  });

  it("支持去掉方括号后解析", () => {
    expect(parseTagList('["技术", "Next.js"]')).toEqual(["技术", "Next.js"]);
  });

  it("空字符串返回空数组", () => {
    expect(parseTagList("")).toEqual([]);
  });
});

describe("isValidDateString", () => {
  it("接受 ISO 日期字符串", () => {
    expect(isValidDateString("2026-01-01")).toBe(true);
  });

  it("拒绝非法字符串", () => {
    expect(isValidDateString("not-a-date")).toBe(false);
    expect(isValidDateString("")).toBe(false);
  });

  it("接受 Date 对象", () => {
    expect(isValidDateString(new Date())).toBe(true);
    expect(isValidDateString(new Date("invalid"))).toBe(false);
  });
});

describe("todayString", () => {
  it("返回 YYYY-MM-DD 格式", () => {
    expect(todayString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("validatePostDraft", () => {
  const base = {
    title: "标题",
    slug: "my-post",
    date: "2026-01-01",
    tags: "技术, Next.js",
    description: "描述",
    content: "正文内容",
    isPublic: true,
  };

  it("合法输入不报错", () => {
    expect(validatePostDraft(base)).toEqual([]);
  });

  it("标题、slug、正文不能为空", () => {
    const issues = validatePostDraft({ ...base, title: "", slug: "", content: "" });
    expect(issues).toContain("标题不能为空");
    expect(issues).toContain("slug 不能为空");
    expect(issues).toContain("正文不能为空");
  });

  it("日期必须合法", () => {
    const issues = validatePostDraft({ ...base, date: "abc" });
    expect(issues).toContain("发布日期必须是合法日期");
  });

  it("更新时间不能早于发布日期", () => {
    const issues = validatePostDraft({ ...base, updated: "2025-12-31" });
    expect(issues).toContain("更新时间不能早于发布日期");
  });

  it("至少需要一个标签", () => {
    const issues = validatePostDraft({ ...base, tags: "" });
    expect(issues).toContain("至少填写一个标签");
  });

  it("slug 重复时报错，编辑自身时放行", () => {
    const existing = ["my-post", "other-post"];
    const issues = validatePostDraft({ ...base, existingSlugs: existing });
    expect(issues).toContain("slug 已存在: my-post");

    const ownIssues = validatePostDraft({
      ...base,
      existingSlugs: existing,
      editingSlug: "my-post",
    });
    expect(ownIssues).not.toContain("slug 已存在: my-post");
  });

  it("本地图片路径建议用 /images/ 或 images/", () => {
    const issues = validatePostDraft({
      ...base,
      content: "![图](foo.jpg)",
    });
    expect(issues.some((i) => i.includes("图片路径建议使用"))).toBe(true);
  });

  it("http 图片和 /images/ 路径放行", () => {
    const httpIssues = validatePostDraft({
      ...base,
      content: "![图](https://example.com/a.png)",
    });
    expect(httpIssues.some((i) => i.includes("图片路径建议使用"))).toBe(false);

    const localIssues = validatePostDraft({
      ...base,
      content: "![图](/images/2026/01/a.png)",
    });
    expect(localIssues.some((i) => i.includes("图片路径建议使用"))).toBe(false);
  });

  it("站内 Markdown 链接目标不存在时报错", () => {
    const issues = validatePostDraft({
      ...base,
      content: "[看这篇](./missing-post.md)",
      existingSlugs: ["my-post"],
    });
    expect(issues.some((i) => i.includes("站内 Markdown 链接目标不存在"))).toBe(true);
  });
});
