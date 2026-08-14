"use client";

import { useMemo } from "react";
import { seriesDefinitions } from "@/lib/series-config";
import TagInput from "./TagInput";

const CUSTOM_SERIES_VALUE = "__custom";

interface EditorSidebarProps {
  open: boolean;
  onToggle: () => void;
  editing: boolean;
  slug: string;
  onSlugChange: (value: string) => void;
  date: string;
  onDateChange: (value: string) => void;
  updated: string;
  onUpdatedChange: (value: string) => void;
  seriesMode: string;
  onSeriesModeChange: (value: string) => void;
  customSeriesTitle: string;
  onCustomSeriesTitleChange: (value: string) => void;
  isPublic: boolean;
  onIsPublicChange: (value: boolean) => void;
  tags: string;
  onTagsChange: (value: string) => void;
  tagSuggestions: string[];
  description: string;
  onDescriptionChange: (value: string) => void;
  draftIssues: string[];
  content: string;
}

interface OutlineItem {
  level: number;
  text: string;
}

/** 从 markdown 中提取标题大纲（与编辑器内容实时同步） */
function extractOutline(markdown: string): OutlineItem[] {
  const items: OutlineItem[] = [];
  for (const line of markdown.split("\n")) {
    const match = line.match(/^(#{1,4})\s+(.+)$/);
    if (match) {
      items.push({ level: match[1].length, text: match[2].trim() });
    }
  }
  return items;
}

export default function EditorSidebar(props: EditorSidebarProps) {
  const {
    open, onToggle, editing, slug, onSlugChange,
    date, onDateChange, updated, onUpdatedChange,
    seriesMode, onSeriesModeChange, customSeriesTitle, onCustomSeriesTitleChange,
    isPublic, onIsPublicChange, tags, onTagsChange, tagSuggestions,
    description, onDescriptionChange, draftIssues, content,
  } = props;

  const outline = useMemo(() => extractOutline(content), [content]);

  const inputCls =
    "w-full rounded-md border border-border bg-card px-2.5 py-1.5 outline-none placeholder-muted text-foreground text-xs focus:border-accent disabled:opacity-60";

  return (
    <aside
      className={[
        "shrink-0 border-l border-border bg-card transition-all duration-200",
        open ? "w-72" : "w-0 border-l-0",
      ].join(" ")}
      aria-hidden={!open}
    >
      <div className="flex h-full flex-col overflow-hidden">
        {/* 面板头 */}
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
            文章设置
          </h2>
          <button
            type="button"
            onClick={onToggle}
            className="rounded p-1 text-muted transition-colors hover:bg-card-hover hover:text-foreground cursor-pointer"
            aria-label="收起面板"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-3">
          {/* 元数据 */}
          <section className="space-y-2.5">
            <label className="flex items-center gap-2 text-xs text-muted">
              Slug
              <input
                type="text"
                value={slug}
                disabled={editing}
                onChange={(e) => onSlugChange(e.target.value)}
                placeholder="post-slug"
                className={inputCls}
              />
            </label>
            <div className="flex gap-2">
              <label className="flex-1 space-y-1 text-xs text-muted">
                <span>发布</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => onDateChange(e.target.value)}
                  className={inputCls}
                />
              </label>
              <label className="flex-1 space-y-1 text-xs text-muted">
                <span>更新</span>
                <input
                  type="date"
                  value={updated}
                  onChange={(e) => onUpdatedChange(e.target.value)}
                  className={inputCls}
                />
              </label>
            </div>
            <label className="space-y-1 text-xs text-muted">
              <span>系列</span>
              <select
                value={seriesMode}
                onChange={(e) => {
                  onSeriesModeChange(e.target.value);
                  if (e.target.value !== CUSTOM_SERIES_VALUE) {
                    onCustomSeriesTitleChange("");
                  }
                }}
                className={inputCls}
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
                onChange={(e) => onCustomSeriesTitleChange(e.target.value)}
                className={inputCls}
              />
            )}
            <label className="space-y-1 text-xs text-muted">
              <span>标签</span>
              <div className="rounded-md border border-border bg-card px-2.5 py-1.5 focus-within:border-accent">
                <TagInput
                  value={tags}
                  onChange={onTagsChange}
                  placeholder="回车添加"
                  suggestions={tagSuggestions}
                />
              </div>
            </label>
            <label className="space-y-1 text-xs text-muted">
              <span>简介</span>
              <input
                type="text"
                placeholder="一句话摘要（可选）"
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                className={inputCls}
              />
            </label>
            <button
              type="button"
              onClick={() => onIsPublicChange(!isPublic)}
              className="w-full rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer"
              style={
                isPublic
                  ? { background: "var(--accent-soft)", color: "var(--accent)", borderColor: "transparent" }
                  : { background: "transparent", color: "var(--muted)", borderColor: "var(--border)" }
              }
            >
              {isPublic ? "● 公开" : "○ 私密"}
            </button>
          </section>

          {/* 发布前检查 */}
          <section
            className={[
              "rounded-md border px-3 py-2 text-xs",
              draftIssues.length > 0
                ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
                : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200",
            ].join(" ")}
          >
            <div className="font-medium">
              {draftIssues.length > 0
                ? `发布前检查：${draftIssues.length} 个问题`
                : "发布前检查：可以保存"}
            </div>
            {draftIssues.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {draftIssues.slice(0, 6).map((issue) => (
                  <li key={issue}>· {issue}</li>
                ))}
                {draftIssues.length > 6 && (
                  <li>· 还有 {draftIssues.length - 6} 个问题</li>
                )}
              </ul>
            )}
          </section>

          {/* 大纲 */}
          {outline.length > 0 && (
            <section className="space-y-1">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted">
                大纲
              </h3>
              <ol className="space-y-1">
                {outline.map((item, index) => (
                  <li
                    key={`${item.level}-${item.text}-${index}`}
                    className="truncate text-xs text-muted"
                    style={{ paddingLeft: `${(item.level - 1) * 0.75}rem` }}
                  >
                    {item.text}
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      </div>
    </aside>
  );
}
