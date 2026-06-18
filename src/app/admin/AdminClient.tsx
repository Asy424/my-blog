"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { GitHubFile } from "@/lib/github-admin";
import {
  listPosts,
  getPostContent,
  savePost,
  deletePost,
} from "@/lib/github-admin";
import { withBasePath } from "@/site.config";
import { createSeriesSlug, seriesDefinitions } from "@/lib/series-config";
import {
  normalizeSlug,
  parseTagList,
  todayString,
  validatePostDraft,
} from "@/lib/post-schema";
import { useAuth } from "./hooks/useAuth";
import { useImageUpload } from "./hooks/useImageUpload";
import PostSidebar from "./components/PostSidebar";
import TagInput from "./components/TagInput";
import MediaLibrary from "./components/MediaLibrary";
import StatusBar, { useToasts } from "./components/StatusBar";

const CUSTOM_SERIES_VALUE = "__custom";

interface PostMeta {
  title: string;
  date?: string;
  tags?: string;
  isPublic?: boolean;
  series?: string;
}

function parseFrontmatter(
  content: string
): { data: Record<string, string>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { data: {}, body: content };

  const data: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const sep = line.indexOf(": ");
    if (sep <= 0) continue;
    const key = line.slice(0, sep).trim();
    let val = line.slice(sep + 2).trim().replace(/^"|"$/g, "");
    if (val.startsWith("[") && val.endsWith("]")) {
      try {
        const arr = JSON.parse(val);
        if (Array.isArray(arr)) {
          val = arr.filter((v) => typeof v === "string").join(", ");
        }
      } catch {}
    }
    data[key] = val;
  }
  return { data, body: match[2].trimStart() };
}

function buildFrontmatter(
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
  const tagsStr = tagList.map((t) => `"${t}"`).join(", ");
  const lines = [
    "---",
    `title: "${title}"`,
    `date: "${dateStr}"`,
    updated && updated !== dateStr ? `updated: "${updated}"` : "",
    `tags: [${tagsStr}]`,
    seriesSlug ? `series: "${seriesSlug}"` : "",
    seriesTitle ? `seriesTitle: "${seriesTitle}"` : "",
    description ? `description: "${description}"` : "",
    `public: ${isPublic}`,
    "---",
  ].filter(Boolean);
  return lines.join("\n") + "\n\n";
}

/**
 * 从标题生成 slug：提取其中的英文/数字片段。
 * 纯中文标题返回空字符串，由调用方引导手动输入或用时间戳兜底。
 */
function slugify(title: string) {
  return normalizeSlug(
    title
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
  );
}

/** 纯中文/无英文标题的时间戳兜底 slug */
function fallbackSlug() {
  return `post-${Date.now().toString(36)}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safePreviewUrl(rawUrl: string): string {
  const url = rawUrl.trim();
  if (!url) return "#";
  if (
    url.startsWith("/") ||
    url.startsWith("./") ||
    url.startsWith("../") ||
    url.startsWith("#")
  ) {
    return escapeHtml(url);
  }

  try {
    const parsed = new URL(url);
    if (["http:", "https:", "mailto:"].includes(parsed.protocol)) {
      return escapeHtml(parsed.toString());
    }
  } catch {}

  return "#";
}

function renderInlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt: string, url: string) => {
      const safeUrl = safePreviewUrl(url);
      return safeUrl === "#" ? `<span>${alt}</span>` : `<img src="${safeUrl}" alt="${alt}" />`;
    })
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text: string, url: string) => (
      `<a href="${safePreviewUrl(url)}" rel="nofollow noopener noreferrer">${text}</a>`
    ))
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function renderMarkdownPreview(markdown: string) {
  const blocks: string[] = [];
  const lines = markdown.split("\n");
  let paragraph: string[] = [];
  let list: string[] = [];
  let code: string[] = [];
  let inCode = false;

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push(`<p>${renderInlineMarkdown(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      blocks.push(`<ul>${list.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join("")}</ul>`);
      list = [];
    }
  };
  const flushCode = () => {
    if (code.length) {
      blocks.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
      code = [];
    }
  };

  lines.forEach((line) => {
    if (line.trim().startsWith("```")) {
      if (inCode) {
        flushCode();
        inCode = false;
      } else {
        flushParagraph();
        flushList();
        inCode = true;
      }
      return;
    }
    if (inCode) {
      code.push(line);
      return;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      blocks.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
      return;
    }

    const item = line.match(/^\s*[-*]\s+(.+)$/);
    if (item) {
      flushParagraph();
      list.push(item[1]);
      return;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      return;
    }
    paragraph.push(line.trim());
  });

  flushParagraph();
  flushList();
  flushCode();
  return blocks.join("\n");
}

function MarkdownPreview({ content }: { content: string }) {
  return (
    <div
      className="admin-markdown-preview prose"
      dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(content || "预览会显示在这里。") }}
    />
  );
}

export default function AdminPage() {
  const { token, isAuthenticated, authLoading, authError, login, logout } = useAuth();
  const { uploading, uploadError, upload } = useImageUpload(token);
  const { toasts, addToast, dismissToast } = useToasts();

  const [posts, setPosts] = useState<GitHubFile[]>([]);
  const [postTitles, setPostTitles] = useState<Record<string, string>>({});
  const [postMeta, setPostMeta] = useState<Record<string, PostMeta>>({});
  const [loading, setLoading] = useState(false);

  // editor state
  const [title, setTitle] = useState("");
  const [slugInput, setSlugInput] = useState("");
  const [dateInput, setDateInput] = useState(todayString());
  const [updatedInput, setUpdatedInput] = useState("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [seriesMode, setSeriesMode] = useState("");
  const [customSeriesTitle, setCustomSeriesTitle] = useState("");
  const [content, setContent] = useState("");
  const [editorMode, setEditorMode] = useState<"live" | "edit" | "preview">("live");
  const [isPublic, setIsPublic] = useState(true);
  const [editingFile, setEditingFile] = useState<GitHubFile | null>(null);
  const [originalDate, setOriginalDate] = useState<string>("");
  const [publishIssues, setPublishIssues] = useState<string[]>([]);
  const [lastBackupKey, setLastBackupKey] = useState("");
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);

  const [tokenInput, setTokenInput] = useState("");

  const tagSuggestions = useMemo(() => {
    const set = new Set<string>();
    Object.values(postMeta).forEach((meta) => {
      if ("tags" in meta && typeof meta.tags === "string") {
        parseTagList(meta.tags).forEach((tag) => set.add(tag));
      }
    });
    parseTagList(tags).forEach((tag) => set.add(tag));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
  }, [postMeta, tags]);

  const currentSlug = editingFile?.path.replace(/^posts\//, "").replace(/\.md$/, "")
    || normalizeSlug(slugInput)
    || "new";
  const currentDraftKey = `admin-draft-${currentSlug}`;

  // load posts — 并发拉取所有文章内容
  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listPosts(token);
      setPosts(data);
      const titles: Record<string, string> = {};
      const meta: Record<string, PostMeta> = {};
      await Promise.all(
        data.map(async (file) => {
          try {
            const { content: raw } = await getPostContent(token, file.path);
            const { data: fm } = parseFrontmatter(raw);
            titles[file.path] = fm.title || file.name.replace(".md", "");
            meta[file.path] = {
              title: fm.title || "",
              date: fm.date || "",
              tags: fm.tags || "",
              isPublic: fm.public !== "false",
              series: fm.series || "",
            };
          } catch {
            titles[file.path] = file.name.replace(".md", "");
          }
        })
      );
      setPostTitles((prev) => ({ ...prev, ...titles }));
      setPostMeta((prev) => ({ ...prev, ...meta }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "加载失败";
      addToast("error", msg);
    } finally {
      setLoading(false);
    }
  }, [token, addToast]);

  useEffect(() => {
    if (isAuthenticated && token) {
      queueMicrotask(() => void loadPosts());
    }
  }, [isAuthenticated, token, loadPosts]);

  // draft management
  const editorRef = useRef({ title, slugInput, dateInput, updatedInput, tags, description, seriesMode, customSeriesTitle, content, draftKey: currentDraftKey });
  const hasUnsavedChanges = useRef(false);
  const publishRef = useRef<() => void>(() => {});

  // 在 effect 中同步 ref（不在 render 期间更新 ref，符合 react-hooks/refs 规则）
  useEffect(() => {
    editorRef.current = { title, slugInput, dateInput, updatedInput, tags, description, seriesMode, customSeriesTitle, content, draftKey: currentDraftKey };
    hasUnsavedChanges.current =
      title !== "" || content !== "" || tags !== "" || description !== "";
    publishRef.current = handlePublish;
  });

  useEffect(() => {
    const saved = localStorage.getItem(currentDraftKey);
    if (saved && !title && !content) {
      try {
        const draft = JSON.parse(saved);
        if (draft.title || draft.content) {
          queueMicrotask(() => {
            if (confirm("检测到未保存的草稿，是否恢复？")) {
              setTitle(draft.title || "");
              setSlugInput(draft.slugInput || "");
              setDateInput(draft.dateInput || todayString());
              setUpdatedInput(draft.updatedInput || "");
              setTags(draft.tags || "");
              setDescription(draft.description || "");
              setSeriesMode(draft.seriesMode || "");
              setCustomSeriesTitle(draft.customSeriesTitle || "");
              setContent(draft.content || "");
            } else {
              localStorage.removeItem(currentDraftKey);
            }
          });
        }
      } catch {}
    }
    const timer = setInterval(() => {
      const d = editorRef.current;
      if (d.title || d.content) {
        localStorage.setItem(d.draftKey, JSON.stringify(d));
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [currentDraftKey, content, title]);

  // beforeunload warning
  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (hasUnsavedChanges.current) {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // Ctrl+S shortcut — 监听只注册一次，通过 ref 调用最新 handlePublish
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        publishRef.current();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // show upload errors as toasts
  useEffect(() => {
    if (uploadError) addToast("error", uploadError);
  }, [uploadError, addToast]);

  function resetEditor() {
    setTitle("");
    setSlugInput("");
    setDateInput(todayString());
    setUpdatedInput("");
    setTags("");
    setDescription("");
    setSeriesMode("");
    setCustomSeriesTitle("");
    setContent("");
    setIsPublic(true);
    setEditingFile(null);
    setOriginalDate("");
    setPublishIssues([]);
    setLastBackupKey("");
    setEditorMode("live");
    setShowMediaLibrary(false);
  }

  function restoreLastBackup() {
    if (!lastBackupKey) return;
    const raw = localStorage.getItem(lastBackupKey);
    if (!raw) {
      addToast("info", "没有可恢复的保存前备份");
      return;
    }
    try {
      const backup = JSON.parse(raw) as { previousContent?: string };
      if (!backup.previousContent) {
        addToast("error", "备份内容不完整");
        return;
      }
      const { data, body } = parseFrontmatter(backup.previousContent);
      setTitle(data.title || "");
      setDateInput(data.date || todayString());
      setUpdatedInput(data.updated || "");
      setTags(data.tags || "");
      setDescription(data.description || "");
      setIsPublic(data.public !== "false");
      setContent(body.trimStart());
      addToast("success", "已恢复最近一次保存前的内容");
    } catch {
      addToast("error", "备份解析失败");
    }
  }

  async function handleSelectPost(file: GitHubFile) {
    setLoading(true);
    try {
      const { content: raw, sha } = await getPostContent(token, file.path);
      const { data, body } = parseFrontmatter(raw);
      const slug = file.path.replace(/^posts\//, "").replace(/\.md$/, "");
      setTitle(data.title || file.name.replace(".md", ""));
      setSlugInput(slug);
      setDateInput(data.date || todayString());
      setUpdatedInput(data.updated || "");
      setTags(Array.isArray(data.tags) ? data.tags.join(", ") : data.tags || "");
      setDescription(data.description || "");
      if (data.series) {
        const known = seriesDefinitions.find(
          (s) => s.slug === data.series || s.title === data.series
        );
        if (known) {
          setSeriesMode(known.slug);
          setCustomSeriesTitle("");
        } else {
          setSeriesMode(CUSTOM_SERIES_VALUE);
          setCustomSeriesTitle(data.seriesTitle || data.series);
        }
      } else {
        setSeriesMode("");
        setCustomSeriesTitle("");
      }
      setIsPublic(data.public !== "false");
      setContent(body.trimStart());
      setOriginalDate(data.date || "");
      setEditingFile({ ...file, sha });
      setPublishIssues([]);
      setLastBackupKey(`admin-last-content-${slug}`);

      const t = data.title || file.name.replace(".md", "");
      setPostTitles((prev) => {
        const next = { ...prev, [file.path]: t };
        return next;
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "加载文章失败";
      addToast("error", msg);
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish() {
    const editingSlug = editingFile?.path.replace(/^posts\//, "").replace(/\.md$/, "");
    const normalizedSlug = normalizeSlug(slugInput || slugify(title) || fallbackSlug());
    const existingSlugs = posts.map((post) => post.name.replace(/\.md$/, ""));
    const issues = validatePostDraft({
      title,
      slug: normalizedSlug,
      date: dateInput,
      updated: updatedInput,
      tags,
      description,
      content,
      isPublic,
      existingSlugs,
      editingSlug,
    });

    setPublishIssues(issues);
    if (issues.length > 0) {
      addToast("error", `发布前检查未通过：${issues[0]}`);
      return;
    }

    const summary = [
      editingFile ? "更新已有文章" : "发布新文章",
      `slug: ${editingSlug || normalizedSlug}`,
      `标签: ${parseTagList(tags).join(", ") || "无"}`,
      `正文: ${content.trim().length} 字符`,
      isPublic ? "状态: 公开" : "状态: 私密",
    ].join("\n");

    if (!confirm(`确认保存？\n\n${summary}`)) {
      return;
    }

    setLoading(true);

    let selectedSeriesSlug = "";
    let selectedSeriesTitle = "";
    if (seriesMode === CUSTOM_SERIES_VALUE) {
      const t = customSeriesTitle.trim();
      if (t) {
        selectedSeriesSlug = createSeriesSlug(t);
        selectedSeriesTitle = t;
      }
    } else if (seriesMode) {
      const s = seriesDefinitions.find((item) => item.slug === seriesMode);
      if (s) {
        selectedSeriesSlug = s.slug;
        selectedSeriesTitle = s.title;
      }
    }

    const frontmatter = buildFrontmatter(
      title.trim(),
      tags.trim(),
      description.trim(),
      isPublic,
      selectedSeriesSlug,
      selectedSeriesTitle,
      dateInput || originalDate || undefined,
      editingFile ? updatedInput || todayString() : updatedInput || undefined
    );
    const fullContent = frontmatter + content.trimStart();

    try {
      let path: string;
      if (editingFile) {
        // 编辑已有文章：沿用原路径（不改 slug，避免断链）
        path = editingFile.path;
      } else {
        path = `posts/${normalizedSlug}.md`;
      }
      if (editingFile) {
        localStorage.setItem(
          `admin-last-content-${editingSlug}`,
          JSON.stringify({
            path,
            content: frontmatter + content.trimStart(),
            previousContent: (await getPostContent(token, editingFile.path)).content,
            savedAt: new Date().toISOString(),
          })
        );
        setLastBackupKey(`admin-last-content-${editingSlug}`);
      }
      await savePost(token, path, fullContent, editingFile?.sha);
      addToast("success", editingFile ? "文章已更新" : "文章已发布");
      localStorage.removeItem(currentDraftKey);
      localStorage.removeItem("admin-draft");
      setPostTitles((prev) => ({ ...prev, [path]: title.trim() }));
      await loadPosts();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "保存失败";
      addToast("error", msg);
    } finally {
      setLoading(false);
    }
  }

  function insertMarkdown(markdown: string) {
    const textarea = document.querySelector(
      ".admin-editor-textarea"
    ) as HTMLTextAreaElement | null;
    const pos = textarea?.selectionStart;
    setContent((prev) => {
      if (pos != null) {
        return prev.slice(0, pos) + markdown + prev.slice(pos);
      }
      return prev + markdown;
    });
  }

  async function handleImageInsert(file: File) {
    const md = await upload(file);
    if (!md) return;
    insertMarkdown(md);
    addToast("success", "图片已上传");
  }

  function handlePaste(e: React.ClipboardEvent) {
    const image = Array.from(e.clipboardData.files || []).find((f) =>
      f.type.startsWith("image/")
    );
    if (image) {
      e.preventDefault();
      handleImageInsert(image);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const image = Array.from(e.dataTransfer.files || []).find((f) =>
      f.type.startsWith("image/")
    );
    if (image) handleImageInsert(image);
  }

  async function handleDelete() {
    if (!editingFile) return;
    if (!confirm(`确认删除「${title || editingFile.name}」？此操作不可撤销。`)) return;

    setLoading(true);
    try {
      await deletePost(token, editingFile.path, editingFile.sha);
      addToast("success", "文章已删除");
      resetEditor();
      await loadPosts();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "删除失败";
      addToast("error", msg);
    } finally {
      setLoading(false);
    }
  }

  // ── Login screen ──
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div
          className="relative bg-card rounded-xl border border-border p-8 w-full max-w-md animate-fade-in-up"
          style={{ boxShadow: "var(--shadow-lift)" }}
        >
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-1 rounded-t-xl"
            style={{
              background: "linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 50%, transparent))",
            }}
          />
          <div className="mb-2 flex items-center gap-2">
            <span className="text-2xl" aria-hidden>✎</span>
            <h1 className="text-2xl font-display font-normal text-foreground">管理员登录</h1>
          </div>
          <p className="text-sm text-muted mb-6">
            输入 GitHub Personal Access Token 以访问编辑器
          </p>
          <div
            suppressHydrationWarning
            className="text-xs mb-4 leading-relaxed rounded-lg p-3"
            style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}
          >
            建议使用只授予当前仓库 contents 权限的最小权限 Token；Token 仅保存在当前浏览器会话中。
          </div>
          <input
            type="password"
            placeholder="粘贴你的 GitHub Token..."
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login(tokenInput)}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-transparent outline-none focus:border-accent transition-colors text-foreground placeholder-muted mb-4"
          />
          {authError && (
            <p className="text-sm mb-4" style={{ color: "var(--accent)" }}>{authError}</p>
          )}
          <button
            onClick={() => login(tokenInput)}
            disabled={authLoading}
            className="w-full px-4 py-2.5 rounded-lg bg-foreground text-background font-medium hover:bg-accent transition-colors disabled:opacity-50 cursor-pointer"
          >
            {authLoading ? "验证中..." : "进入管理后台"}
          </button>
        </div>
      </div>
    );
  }

  // ── Main editor ──
  return (
    <div className="h-screen flex flex-col bg-background">
      <StatusBar toasts={toasts} onDismiss={dismissToast} />

      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-2.5 border-b border-border bg-card z-10 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-foreground">写文章</h1>
          {editingFile && (
            <span className="text-xs text-muted px-2 py-0.5 rounded bg-accent-soft">
              {editingFile.name}
            </span>
          )}
            {uploading && (
              <span className="text-xs text-accent animate-pulse">上传中...</span>
            )}
            <span className="text-xs text-muted">
              草稿键: {currentSlug}
            </span>
          </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetEditor}
            className="px-3 py-1.5 text-xs rounded-md border border-border hover:bg-card-hover text-foreground transition-colors cursor-pointer"
          >
            新建
          </button>
          {editingFile && (
            <button
              onClick={() => {
                if (!isPublic) {
                  addToast("info", "私密文章不会生成公开页面，先切换为公开并保存后再预览");
                  return;
                }
                const slug = editingFile.path.replace(/^posts\//, "").replace(/\.md$/, "");
                window.open(withBasePath(`/blog/${slug}`), "_blank");
              }}
              className="px-3 py-1.5 text-xs rounded-md border border-border hover:bg-card-hover text-foreground transition-colors cursor-pointer"
            >
              预览
            </button>
          )}
          {editingFile && (
            <button
              onClick={restoreLastBackup}
              className="px-3 py-1.5 text-xs rounded-md border border-border hover:bg-card-hover text-foreground transition-colors cursor-pointer"
            >
              恢复备份
            </button>
          )}
          <button
            onClick={() => setShowMediaLibrary((value) => !value)}
            className="px-3 py-1.5 text-xs rounded-md border border-border hover:bg-card-hover text-foreground transition-colors cursor-pointer"
          >
            媒体库
          </button>
          <button
            onClick={handlePublish}
            disabled={loading}
            className="px-4 py-1.5 text-xs rounded-md bg-foreground text-background font-medium hover:bg-accent disabled:opacity-50 transition-colors cursor-pointer"
          >
            {loading ? "处理中..." : editingFile ? "更新" : "发布"}
          </button>
          {editingFile && (
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 text-xs rounded-md border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
            >
              删除
            </button>
          )}
          <div className="w-px h-5 bg-border mx-1" />
          <button
            onClick={logout}
            className="px-3 py-1.5 text-xs rounded-md text-muted hover:text-foreground hover:bg-card-hover transition-colors cursor-pointer"
          >
            退出
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <PostSidebar
          posts={posts}
          postTitles={postTitles}
          postMeta={postMeta}
          activePath={editingFile?.path || null}
          onSelect={handleSelectPost}
          count={posts.length}
        />

        {/* Editor area */}
        <main
          className="flex-1 flex flex-col overflow-hidden"
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {/* Title */}
          <input
            type="text"
            placeholder="输入文章标题..."
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!editingFile && !slugInput) {
                setSlugInput(slugify(e.target.value));
              }
            }}
            className="w-full px-6 py-4 text-2xl font-display font-normal bg-transparent border-b border-border outline-none placeholder-muted/50 text-foreground"
          />

          {/* Meta bar —— 分两层：分类设置 / 内容元数据 */}
          <div className="px-6 py-3 border-b border-border space-y-2.5 text-sm">
            {/* 第一行：系列 + 公开开关 */}
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-muted">
                Slug
                <input
                  type="text"
                  value={slugInput}
                  disabled={Boolean(editingFile)}
                  onChange={(e) => setSlugInput(normalizeSlug(e.target.value))}
                  placeholder="post-slug"
                  className="w-40 rounded-md border border-border bg-card px-2 py-1.5 outline-none placeholder-muted text-foreground text-xs focus:border-accent disabled:opacity-60"
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-muted">
                发布
                <input
                  type="date"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  className="rounded-md border border-border bg-card px-2 py-1.5 outline-none text-foreground text-xs focus:border-accent"
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-muted">
                更新
                <input
                  type="date"
                  value={updatedInput}
                  onChange={(e) => setUpdatedInput(e.target.value)}
                  className="rounded-md border border-border bg-card px-2 py-1.5 outline-none text-foreground text-xs focus:border-accent"
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-muted">
                系列
                <select
                  value={seriesMode}
                  onChange={(e) => {
                    setSeriesMode(e.target.value);
                    if (e.target.value !== CUSTOM_SERIES_VALUE) {
                      setCustomSeriesTitle("");
                    }
                  }}
                  className="min-w-36 rounded-md border border-border bg-card px-2 py-1.5 text-foreground outline-none focus:border-accent text-xs"
                  aria-label="所属系列"
                >
                  <option value="">不加入系列</option>
                  {seriesDefinitions.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.title}
                    </option>
                  ))}
                  <option value={CUSTOM_SERIES_VALUE}>新建系列...</option>
                </select>
              </label>
              {seriesMode === CUSTOM_SERIES_VALUE && (
                <input
                  type="text"
                  placeholder="新系列名称"
                  value={customSeriesTitle}
                  onChange={(e) => setCustomSeriesTitle(e.target.value)}
                  className="min-w-36 rounded-md border border-border bg-card px-2 py-1.5 outline-none placeholder-muted text-foreground text-xs focus:border-accent"
                />
              )}
              <button
                onClick={() => setIsPublic(!isPublic)}
                className="shrink-0 ml-auto px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer border"
                style={
                  isPublic
                    ? { background: "var(--accent-soft)", color: "var(--accent)", borderColor: "transparent" }
                    : { background: "transparent", color: "var(--muted)", borderColor: "var(--border)" }
                }
              >
                {isPublic ? "● 公开" : "○ 私密"}
              </button>
            </div>

            {/* 第二行：标签 + 简介 */}
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-muted shrink-0">
                标签
                <div className="min-w-48 flex-1 rounded-md border border-border bg-card px-2.5 py-1 focus-within:border-accent">
                  <TagInput
                    value={tags}
                    onChange={setTags}
                    placeholder="回车添加"
                    suggestions={tagSuggestions}
                  />
                </div>
              </label>
              <label className="flex items-center gap-2 text-xs text-muted flex-1 min-w-56">
                简介
                <input
                  type="text"
                  placeholder="一句话摘要（可选）"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="flex-1 min-w-0 rounded-md border border-border bg-card px-2.5 py-1.5 outline-none placeholder-muted text-foreground text-xs focus:border-accent"
                />
              </label>
            </div>
          {publishIssues.length > 0 && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                {publishIssues.slice(0, 3).map((issue) => (
                  <div key={issue}>· {issue}</div>
                ))}
              </div>
            )}
          </div>

          {showMediaLibrary && (
            <MediaLibrary
              token={token}
              onInsert={(markdown) => {
                insertMarkdown(markdown);
                addToast("success", "已插入图片引用");
              }}
              onClose={() => setShowMediaLibrary(false)}
            />
          )}

          {/* Markdown editor */}
          <div className="flex items-center justify-between border-b border-border px-6 py-2">
            <div className="text-xs text-muted">
              {editorMode === "preview" ? "本地预览，不会发布私密内容" : "Markdown 编辑器"}
            </div>
            <div className="flex rounded-md border border-border bg-card p-0.5">
              {[
                ["live", "分屏"],
                ["edit", "编辑"],
                ["preview", "预览"],
              ].map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setEditorMode(mode as typeof editorMode)}
                  className={[
                    "rounded px-2.5 py-1 text-xs transition-colors",
                    editorMode === mode
                      ? "bg-foreground text-background"
                      : "text-muted hover:text-foreground",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div
            className={[
              "grid flex-1 overflow-hidden bg-background",
              editorMode === "live" ? "grid-cols-2" : "grid-cols-1",
            ].join(" ")}
          >
            {editorMode !== "preview" && (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                spellCheck={false}
                className="admin-editor-textarea h-full min-h-0 w-full resize-none border-0 bg-background p-6 font-mono text-sm leading-7 text-foreground outline-none placeholder-muted"
                placeholder="在这里写 Markdown..."
              />
            )}
            {editorMode !== "edit" && (
              <div className="h-full min-h-0 overflow-auto border-l border-border bg-card/40 p-6">
                <MarkdownPreview content={content} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
