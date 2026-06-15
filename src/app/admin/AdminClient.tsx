"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import type { GitHubFile } from "@/lib/github-admin";
import {
  listPosts,
  getPostContent,
  savePost,
  deletePost,
} from "@/lib/github-admin";
import { withBasePath } from "@/site.config";
import { createSeriesSlug, seriesDefinitions } from "@/lib/series-config";
import { useAuth } from "./hooks/useAuth";
import { useImageUpload } from "./hooks/useImageUpload";
import PostSidebar from "./components/PostSidebar";
import TagInput from "./components/TagInput";
import StatusBar, { useToasts } from "./components/StatusBar";

const MDEditor = dynamic(
  async () => {
    const [mod, cn] = await Promise.all([
      import("@uiw/react-md-editor"),
      import("@uiw/react-md-editor/commands-cn"),
    ]);
    const Editor = mod.default;
    const { getCommands, getExtraCommands } = cn;
    const commands = getCommands();
    const extraCommands = getExtraCommands();

    // 图片和链接命令在组件内通过 hooks 处理，这里保留默认行为
    commands.push({
      name: "center",
      keyCommand: "center",
      buttonProps: { "aria-label": "居中文字", title: "居中文字" },
      icon: (
        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
          <path d="M4 3h12v2H4V3zm2 4h8v2H6V7zm-2 4h12v2H4v-2zm2 4h8v2H6v-2z" />
        </svg>
      ),
      execute: (_state: { selectedText: string }, api: { replaceSelection: (s: string) => void }) => {
        const selected = _state.selectedText || "";
        if (selected) {
          api.replaceSelection(`<center>\n\n${selected}\n\n</center>`);
        } else {
          api.replaceSelection(`<center>\n\n\n\n</center>`);
        }
      },
    });

    return {
      default: (props: Record<string, unknown>) => (
        <Editor {...props} commands={commands} extraCommands={extraCommands} />
      ),
    };
  },
  { ssr: false }
);

const CUSTOM_SERIES_VALUE = "__custom";

interface PostMeta {
  title: string;
  date?: string;
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
  date?: string
) {
  // 编辑已有文章时保留原发布日期；新建文章才用今天
  const dateStr = date || new Date().toISOString().split("T")[0];
  const clean = tags.replace(/[\[\]"']+/g, "");
  const tagList = clean.split(/[,\s]+/).filter(Boolean);
  const tagsStr = tagList.map((t) => `"${t}"`).join(", ");
  const lines = [
    "---",
    `title: "${title}"`,
    `date: "${dateStr}"`,
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
  const cleaned = title
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
    .replace(/^-|-$/g, "");
  return cleaned;
}

/** 纯中文/无英文标题的时间戳兜底 slug */
function fallbackSlug() {
  return `post-${Date.now().toString(36)}`;
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
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [seriesMode, setSeriesMode] = useState("");
  const [customSeriesTitle, setCustomSeriesTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [editingFile, setEditingFile] = useState<GitHubFile | null>(null);
  const [originalDate, setOriginalDate] = useState<string>("");

  const [tokenInput, setTokenInput] = useState("");
  const [darkEditor, setDarkEditor] = useState(false);

  // detect theme for editor — subscribe to DOM class changes
  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const getDark = () => root.classList.contains("dark") || mq.matches;

    // deferred initial sync to avoid set-state-in-effect
    queueMicrotask(() => setDarkEditor(getDark()));

    const observer = new MutationObserver(() => setDarkEditor(getDark()));
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    const mqHandler = () => setDarkEditor(getDark());
    mq.addEventListener("change", mqHandler);
    return () => {
      observer.disconnect();
      mq.removeEventListener("change", mqHandler);
    };
  }, []);

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
  const editorRef = useRef({ title, tags, description, seriesMode, customSeriesTitle, content });
  const hasUnsavedChanges = useRef(false);
  const publishRef = useRef<() => void>(() => {});

  // 在 effect 中同步 ref（不在 render 期间更新 ref，符合 react-hooks/refs 规则）
  useEffect(() => {
    editorRef.current = { title, tags, description, seriesMode, customSeriesTitle, content };
    hasUnsavedChanges.current =
      title !== "" || content !== "" || tags !== "" || description !== "";
    publishRef.current = handlePublish;
  });

  useEffect(() => {
    const DRAFT_KEY = "admin-draft";
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved && !title && !content) {
      try {
        const draft = JSON.parse(saved);
        if (draft.title || draft.content) {
          queueMicrotask(() => {
            if (confirm("检测到未保存的草稿，是否恢复？")) {
              setTitle(draft.title || "");
              setTags(draft.tags || "");
              setDescription(draft.description || "");
              setSeriesMode(draft.seriesMode || "");
              setCustomSeriesTitle(draft.customSeriesTitle || "");
              setContent(draft.content || "");
            } else {
              localStorage.removeItem(DRAFT_KEY);
            }
          });
        }
      } catch {}
    }
    const timer = setInterval(() => {
      const d = editorRef.current;
      if (d.title || d.content) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
      }
    }, 30000);
    return () => clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    setTags("");
    setDescription("");
    setSeriesMode("");
    setCustomSeriesTitle("");
    setContent("");
    setIsPublic(true);
    setEditingFile(null);
    setOriginalDate("");
  }

  async function handleSelectPost(file: GitHubFile) {
    setLoading(true);
    try {
      const { content: raw, sha } = await getPostContent(token, file.path);
      const { data, body } = parseFrontmatter(raw);
      setTitle(data.title || file.name.replace(".md", ""));
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
    if (!title.trim()) {
      addToast("error", "请输入文章标题");
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
      originalDate || undefined
    );
    const fullContent = frontmatter + content.trimStart();

    try {
      let path: string;
      if (editingFile) {
        // 编辑已有文章：沿用原路径（不改 slug，避免断链）
        path = editingFile.path;
      } else {
        // 新建文章：英文提取 → 手动输入 → 时间戳兜底
        let slug = slugify(title);
        if (!slug) {
          const input = window.prompt(
            "标题中没有可用的英文片段，请输入一个简短的英文 slug（如 stream-basics）：\n留空则使用系统自动生成的名称。"
          );
          slug = (input || "").trim().replace(/[^a-zA-Z0-9-]/g, "-").replace(/-+/g, "-").toLowerCase();
        }
        path = `posts/${slug || fallbackSlug()}.md`;
      }
      await savePost(token, path, fullContent, editingFile?.sha);
      addToast("success", editingFile ? "文章已更新" : "文章已发布");
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

  async function handleImageInsert(file: File) {
    const md = await upload(file);
    if (!md) return;
    const textarea = document.querySelector(
      ".w-md-editor-text-input"
    ) as HTMLTextAreaElement | null;
    const pos = textarea?.selectionStart;
    setContent((prev) => {
      if (pos != null) {
        return prev.slice(0, pos) + md + prev.slice(pos);
      }
      return prev + md;
    });
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
            className="text-xs mb-4 leading-relaxed rounded-lg p-3"
            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
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
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-6 py-4 text-2xl font-display font-normal bg-transparent border-b border-border outline-none placeholder-muted/50 text-foreground"
          />

          {/* Meta bar —— 分两层：分类设置 / 内容元数据 */}
          <div className="px-6 py-3 border-b border-border space-y-2.5 text-sm">
            {/* 第一行：系列 + 公开开关 */}
            <div className="flex flex-wrap items-center gap-3">
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
          </div>

          {/* Markdown editor */}
          <div
            className="flex-1 overflow-hidden"
            data-color-mode={darkEditor ? "dark" : "light"}
          >
            <MDEditor
              value={content}
              onChange={(val: string) => setContent(val || "")}
              height="100%"
              preview="live"
            />
          </div>
        </main>
      </div>
    </div>
  );
}
