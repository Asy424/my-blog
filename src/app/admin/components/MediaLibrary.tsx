"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { GitHubImageFile } from "@/lib/github-admin";
import { getPostContent, listImages, listPosts } from "@/lib/github-admin";

interface MediaLibraryProps {
  token: string;
  onInsert: (markdown: string) => void;
  onClose: () => void;
}

function formatSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function toMarkdown(image: GitHubImageFile) {
  const alt = image.name.replace(/\.[^.]+$/, "");
  return `![${alt}](${image.url})`;
}

export default function MediaLibrary({ token, onInsert, onClose }: MediaLibraryProps) {
  const [images, setImages] = useState<GitHubImageFile[]>([]);
  const [references, setReferences] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadMedia = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [imageFiles, postFiles] = await Promise.all([listImages(token), listPosts(token)]);
      const contents = await Promise.all(
        postFiles.map(async (post) => {
          try {
            return (await getPostContent(token, post.path)).content;
          } catch {
            return "";
          }
        })
      );
      const allContent = contents.join("\n");
      const counts: Record<string, number> = {};

      imageFiles.forEach((image) => {
        const publicPath = image.path.replace(/^public\//, "");
        const escaped = publicPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        counts[image.path] = (allContent.match(new RegExp(escaped, "g")) || []).length;
      });

      setImages(imageFiles);
      setReferences(counts);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "媒体库加载失败");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    queueMicrotask(() => void loadMedia());
  }, [loadMedia]);

  const filteredImages = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return images;
    return images.filter((image) => image.path.toLowerCase().includes(keyword));
  }, [images, query]);

  return (
    <section className="border-b border-border bg-card px-6 py-3">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-sm font-medium text-foreground">媒体库</h2>
          <p className="text-xs text-muted">
            {loading ? "正在扫描图片..." : `${images.length} 张图片`}
          </p>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索文件路径"
          className="ml-auto min-w-48 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none placeholder-muted focus:border-accent"
        />
        <button
          type="button"
          onClick={loadMedia}
          disabled={loading}
          className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-card-hover disabled:opacity-50"
        >
          刷新
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:bg-card-hover hover:text-foreground"
        >
          关闭
        </button>
      </div>

      {error && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid max-h-56 gap-2 overflow-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
        {filteredImages.map((image) => (
          <div
            key={image.path}
            className="flex min-w-0 items-center gap-3 rounded-md border border-border bg-background p-2"
          >
            <Image
              src={image.url}
              alt=""
              width={64}
              height={48}
              className="h-12 w-16 shrink-0 rounded object-cover"
              loading="lazy"
              unoptimized
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-foreground" title={image.path}>
                {image.path.replace(/^public\//, "")}
              </div>
              <div className="mt-0.5 text-[11px] text-muted">
                {formatSize(image.size)} · 引用 {references[image.path] || 0}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onInsert(toMarkdown(image))}
              className="rounded-md bg-foreground px-2.5 py-1 text-xs text-background transition-colors hover:bg-accent"
            >
              插入
            </button>
          </div>
        ))}
        {!loading && filteredImages.length === 0 && (
          <div className="col-span-full rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted">
            没有匹配的图片
          </div>
        )}
      </div>
    </section>
  );
}
