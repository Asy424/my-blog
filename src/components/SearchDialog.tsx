"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";

interface SearchIndex {
  slug: string;
  title: string;
  description: string;
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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/search-index.json`)
      .then((res) => res.json())
      .then((data: SearchIndex[]) => {
        setIndex(data);
        setFuse(
          new Fuse(data, {
            keys: ["title", "description", "tags"],
            threshold: 0.35,
          })
        );
      });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => inputRef.current?.focus(), 100);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

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

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-2xl mx-4 bg-card rounded-xl shadow-2xl border border-border overflow-hidden animate-fade-in-up"
        role="dialog"
        aria-modal="true"
        aria-label="搜索文章"
      >
        <div className="flex items-center border-b border-border px-4">
          <svg className="w-5 h-5 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

        {query && (
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
                              {item.title}
                            </div>
                            {item.description && (
                              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                                {item.description}
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
                                {tag}
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

        {!query && index.length > 0 && (
          <div className="px-4 py-3 text-sm text-muted">
            共 {index.length} 篇文章，输入关键词搜索
          </div>
        )}
      </div>
    </div>
  );
}
