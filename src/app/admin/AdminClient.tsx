"use client";

import { useState, useEffect } from "react";
import { withBasePath } from "@/site.config";
import { normalizeSlug } from "@/lib/post-schema";
import { seriesDefinitions } from "@/lib/series-config";
import { slugify } from "./lib/frontmatter";
import { useAuth } from "./hooks/useAuth";
import { usePostEditor } from "./hooks/usePostEditor";
import PostSidebar from "./components/PostSidebar";
import TagInput from "./components/TagInput";
import MediaLibrary from "./components/MediaLibrary";
import MarkdownPreview from "./components/MarkdownPreview";
import StatusBar, { useToasts } from "./components/StatusBar";

const CUSTOM_SERIES_VALUE = "__custom";

export default function AdminPage() {
  const { token, isAuthenticated, authLoading, authError, tokenWarning, login, logout } = useAuth();
  const { toasts, addToast, dismissToast } = useToasts();
  const editor = usePostEditor(token, addToast);
  const [tokenInput, setTokenInput] = useState("");

  const { loadPosts, editingFile, isPublic } = editor;

  useEffect(() => {
    if (isAuthenticated && token) {
      queueMicrotask(() => void loadPosts());
    }
  }, [isAuthenticated, token, loadPosts]);

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
          {tokenWarning && (
            <div
              suppressHydrationWarning
              className="text-xs mb-4 leading-relaxed rounded-lg border p-3"
              style={{
                backgroundColor: "color-mix(in srgb, var(--s-blog) 12%, transparent)",
                borderColor: "color-mix(in srgb, var(--s-blog) 40%, transparent)",
                color: "var(--s-blog)",
              }}
            >
              ⚠ {tokenWarning}
            </div>
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
            {editor.uploading && (
              <span className="text-xs text-accent animate-pulse">上传中...</span>
            )}
            <span className="text-xs text-muted">
              草稿键: {editor.currentSlug}
            </span>
            <span
              className={[
                "rounded-full px-2 py-0.5 text-xs",
                editor.draftVisualStatus === "dirty"
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                  : editor.draftStatus === "published" && editor.draftVisualStatus === "clean"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "bg-accent-soft text-muted",
              ].join(" ")}
            >
              {editor.draftStatusText}
            </span>
          </div>
        <div className="flex items-center gap-2">
          <button
            onClick={editor.resetEditor}
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
              onClick={editor.restoreLastBackup}
              className="px-3 py-1.5 text-xs rounded-md border border-border hover:bg-card-hover text-foreground transition-colors cursor-pointer"
            >
              恢复备份
            </button>
          )}
          <button
            onClick={() => editor.setShowMediaLibrary((value) => !value)}
            className="px-3 py-1.5 text-xs rounded-md border border-border hover:bg-card-hover text-foreground transition-colors cursor-pointer"
          >
            媒体库
          </button>
          <button
            onClick={editor.handlePublish}
            disabled={editor.loading}
            className="px-4 py-1.5 text-xs rounded-md bg-foreground text-background font-medium hover:bg-accent disabled:opacity-50 transition-colors cursor-pointer"
          >
            {editor.loading ? "处理中..." : editingFile ? "更新" : "发布"}
          </button>
          {editingFile && (
            <button
              onClick={editor.handleDelete}
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
          posts={editor.posts}
          postTitles={editor.postTitles}
          postMeta={editor.postMeta}
          activePath={editingFile?.path || null}
          onSelect={editor.handleSelectPost}
          count={editor.posts.length}
        />

        {/* Editor area */}
        <main
          className="flex-1 flex flex-col overflow-hidden"
          onPaste={editor.handlePaste}
          onDrop={editor.handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {/* Title */}
          <input
            type="text"
            placeholder="输入文章标题..."
            value={editor.title}
            onChange={(e) => {
              editor.setTitle(e.target.value);
              if (!editingFile && !editor.slugInput) {
                editor.setSlugInput(slugify(e.target.value));
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
                  value={editor.slugInput}
                  disabled={Boolean(editingFile)}
                  onChange={(e) => editor.setSlugInput(normalizeSlug(e.target.value))}
                  placeholder="post-slug"
                  className="w-40 rounded-md border border-border bg-card px-2 py-1.5 outline-none placeholder-muted text-foreground text-xs focus:border-accent disabled:opacity-60"
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-muted">
                发布
                <input
                  type="date"
                  value={editor.dateInput}
                  onChange={(e) => editor.setDateInput(e.target.value)}
                  className="rounded-md border border-border bg-card px-2 py-1.5 outline-none text-foreground text-xs focus:border-accent"
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-muted">
                更新
                <input
                  type="date"
                  value={editor.updatedInput}
                  onChange={(e) => editor.setUpdatedInput(e.target.value)}
                  className="rounded-md border border-border bg-card px-2 py-1.5 outline-none text-foreground text-xs focus:border-accent"
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-muted">
                系列
                <select
                  value={editor.seriesMode}
                  onChange={(e) => {
                    editor.setSeriesMode(e.target.value);
                    if (e.target.value !== CUSTOM_SERIES_VALUE) {
                      editor.setCustomSeriesTitle("");
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
              {editor.seriesMode === CUSTOM_SERIES_VALUE && (
                <input
                  type="text"
                  placeholder="新系列名称"
                  value={editor.customSeriesTitle}
                  onChange={(e) => editor.setCustomSeriesTitle(e.target.value)}
                  className="min-w-36 rounded-md border border-border bg-card px-2 py-1.5 outline-none placeholder-muted text-foreground text-xs focus:border-accent"
                />
              )}
              <button
                onClick={() => editor.setIsPublic(!isPublic)}
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
                    value={editor.tags}
                    onChange={editor.setTags}
                    placeholder="回车添加"
                    suggestions={editor.tagSuggestions}
                  />
                </div>
              </label>
              <label className="flex items-center gap-2 text-xs text-muted flex-1 min-w-56">
                简介
                <input
                  type="text"
                  placeholder="一句话摘要（可选）"
                  value={editor.description}
                  onChange={(e) => editor.setDescription(e.target.value)}
                  className="flex-1 min-w-0 rounded-md border border-border bg-card px-2.5 py-1.5 outline-none placeholder-muted text-foreground text-xs focus:border-accent"
                />
              </label>
            </div>
            <div
              className={[
                "rounded-md border px-3 py-2 text-xs",
                editor.draftIssues.length > 0
                  ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200",
              ].join(" ")}
            >
              <div className="font-medium">
                {editor.draftIssues.length > 0
                  ? `发布前检查：${editor.draftIssues.length} 个问题`
                  : "发布前检查：可以保存"}
              </div>
              {editor.draftIssues.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {editor.draftIssues.slice(0, 4).map((issue) => (
                    <div key={issue}>· {issue}</div>
                  ))}
                  {editor.draftIssues.length > 4 && (
                    <div>· 还有 {editor.draftIssues.length - 4} 个问题</div>
                  )}
                </div>
              )}
              {editor.publishIssues.length > 0 && editor.draftIssues.length === 0 && (
                <div className="mt-1">上一次检查问题已修复。</div>
              )}
            </div>
          </div>

          {editor.showMediaLibrary && (
            <MediaLibrary
              token={token}
              onInsert={(markdown) => {
                editor.insertMarkdown(markdown);
                addToast("success", "已插入图片引用");
              }}
              onClose={() => editor.setShowMediaLibrary(false)}
            />
          )}

          {/* Markdown editor */}
          <div className="flex items-center justify-between border-b border-border px-6 py-2">
            <div className="text-xs text-muted">
              {editor.editorMode === "preview" ? "本地预览，不会发布私密内容" : "Markdown 编辑器"}
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
                  onClick={() => editor.setEditorMode(mode as typeof editor.editorMode)}
                  className={[
                    "rounded px-2.5 py-1 text-xs transition-colors",
                    editor.editorMode === mode
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
              editor.editorMode === "live" ? "grid-cols-2" : "grid-cols-1",
            ].join(" ")}
          >
            {editor.editorMode !== "preview" && (
              <textarea
                value={editor.content}
                onChange={(e) => editor.setContent(e.target.value)}
                spellCheck={false}
                className="admin-editor-textarea h-full min-h-0 w-full resize-none border-0 bg-background p-6 font-mono text-sm leading-7 text-foreground outline-none placeholder-muted"
                placeholder="在这里写 Markdown..."
              />
            )}
            {editor.editorMode !== "edit" && (
              <div className="h-full min-h-0 overflow-auto border-l border-border bg-card/40 p-6">
                <MarkdownPreview content={editor.content} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
