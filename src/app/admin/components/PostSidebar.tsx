"use client";

import { useState } from "react";
import type { GitHubFile } from "@/lib/github-admin";

interface PostMeta {
  title: string;
  date?: string;
  isPublic?: boolean;
  series?: string;
}

interface PostSidebarProps {
  posts: GitHubFile[];
  postTitles: Record<string, string>;
  postMeta: Record<string, PostMeta>;
  activePath: string | null;
  onSelect: (file: GitHubFile) => void;
  count: number;
}

export default function PostSidebar({
  posts,
  postTitles,
  postMeta,
  activePath,
  onSelect,
  count,
}: PostSidebarProps) {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? posts.filter((post) => {
        const title = postTitles[post.path] || post.name;
        const meta = postMeta[post.path];
        const q = search.toLowerCase();
        return (
          title.toLowerCase().includes(q) ||
          post.name.toLowerCase().includes(q) ||
          (meta?.series || "").toLowerCase().includes(q)
        );
      })
    : posts;

  return (
    <aside className="w-72 border-r border-border bg-card flex flex-col shrink-0">
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-medium text-muted uppercase tracking-wide">
            文章 ({count})
          </h2>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索文章..."
          className="w-full px-3 py-1.5 rounded-md bg-background border border-border text-sm text-foreground placeholder-muted outline-none focus:border-accent transition-colors"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {filtered.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted">
            {search ? "没有匹配的文章" : "暂无文章"}
          </p>
        ) : (
          filtered.map((post) => {
            const title = postTitles[post.path] || post.name.replace(".md", "");
            const meta = postMeta[post.path];
            const isActive = activePath === post.path;

            return (
              <button
                key={post.path}
                onClick={() => onSelect(post)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${
                  isActive
                    ? "bg-accent-soft text-accent"
                    : "hover:bg-card-hover text-foreground"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium truncate flex-1 leading-snug">
                    {title}
                  </span>
                  {meta?.isPublic === false && (
                    <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-muted/10 text-muted">
                      私密
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {meta?.date && (
                    <span className="text-xs text-muted">{meta.date}</span>
                  )}
                  {meta?.series && (
                    <span className="text-xs text-accent/70 truncate">
                      {meta.series}
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
