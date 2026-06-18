"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { useScrollLock } from "@/hooks/useScrollLock";

interface SearchIndex {
  slug: string;
  title: string;
  description: string;
  body?: string;
  tags: string;
  date: string;
}

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchDialog({ open, onClose }: SearchDialogProps) {
  if (!open) return null;

  return <SearchDialogContent onClose={onClose} />;
}

function SearchDialogContent({ onClose }: Pick<SearchDialogProps, "onClose">) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<SearchIndex[]>([]);
  const [fuse, setFuse] = useState<Fuse<SearchIndex> | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let ignore = false;

    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/search-index.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`搜索索引加载失败: ${res.status}`);
        return res.json();
      })
      .then((data: SearchIndex[]) => {
        if (ignore) return;
        setIndex(data);
        setFuse(
          new Fuse(data, {
            keys: [
              { name: "title", weight: 0.5 },
              { name: "tags", weight: 0.25 },
              { name: "description", weight: 0.15 },
              { name: "body", weight: 0.1 },
            ],
            threshold: 0.35,
          })
        );
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (ignore) return;
        setError(e instanceof Error ? e.message : "搜索索引加载失败");
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => inputRef.current?.focus(), 100);
    return () => window.clearTimeout(timer);
  }, []);

  useScrollLock(true);

  const results = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed || !fuse) {
      return [];
    }
    return fuse.search(trimmed).slice(0, 8).map((result) => result.item);
  }, [fuse, query]);

  const activeIndex = results.length > 0
    ? Math.min(selectedIndex, results.length - 1)
    : 0;

  function openResult(item: SearchIndex) {
    onClose();
    router.push(`/blog/${item.slug}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      onClose();
      return;
    }

    if (results.length === 0) {
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((current) => (current + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((current) => (current - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      openResult(results[activeIndex]);
    }
  }

  function handleDialogKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      onClose();
      return;
    }

    if (e.key !== "Tab") return;

    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) ?? []
    ).filter((el) => el.offsetParent !== null);

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function highlightText(text: string) {
    const trimmed = query.trim();
    if (!trimmed) return text;

    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escaped})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === trimmed.toLowerCase() ? (
        <mark
          key={`${part}-${index}`}
          className="rounded bg-accent-soft px-0.5 text-accent"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  }

  function resultExcerpt(item: SearchIndex) {
    return item.description || item.body || "";
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={dialogRef}
        className="relative w-full max-w-2xl mx-4 bg-card rounded-xl shadow-2xl border border-border overflow-hidden animate-fade-in-up"
        role="dialog"
        aria-modal="true"
        aria-label="搜索文章"
        onKeyDown={handleDialogKeyDown}
      >
        <div className="flex items-center border-b border-border px-4">
          <svg suppressHydrationWarning className="w-5 h-5 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="搜索文章..."
            className="flex-1 px-3 py-4 bg-transparent outline-none text-base text-foreground placeholder-muted"
          />
          <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs text-muted bg-accent-soft rounded font-mono">
            ESC
          </kbd>
        </div>

        {loading && (
          <div className="px-4 py-8 text-center text-sm text-muted">
            正在加载搜索索引...
          </div>
        )}

        {!loading && error && (
          <div className="px-4 py-8 text-center text-sm text-muted">
            {error}
          </div>
        )}

        {!loading && !error && query && (
          <div className="max-h-[28rem] overflow-y-auto">
            {results.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted">
                未找到相关文章
              </div>
            ) : (
              <ul className="py-2">
                {results.map((item, index) => {
                  const tags = item.tags.split(",").map((tag) => tag.trim()).filter(Boolean);
                  const selected = index === activeIndex;

                  return (
                    <li key={item.slug}>
                      <Link
                        href={`/blog/${item.slug}`}
                        onClick={onClose}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`block px-4 py-3 transition-colors ${
                          selected
                            ? "bg-accent-soft"
                            : "hover:bg-card-hover"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-foreground">
                              {highlightText(item.title)}
                            </div>
                            {resultExcerpt(item) && (
                              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                                {highlightText(resultExcerpt(item))}
                              </p>
                            )}
                          </div>
                          <time className="shrink-0 text-xs text-muted" dateTime={item.date}>
                            {item.date}
                          </time>
                        </div>
                        {tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent"
                              >
                                {highlightText(tag)}
                              </span>
                            ))}
                          </div>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {!loading && !error && !query && index.length > 0 && (
          <div className="px-4 py-3 text-sm text-muted">
            共 {index.length} 篇文章，输入关键词搜索
          </div>
        )}
      </div>
    </div>
  );
}
