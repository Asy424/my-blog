"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
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
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<SearchIndex[]>([]);
  const [fuse, setFuse] = useState<Fuse<SearchIndex> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/search-index.json`)
      .then((res) => res.json())
      .then((data: SearchIndex[]) => {
        setIndex(data);
        setFuse(
          new Fuse(data, {
            keys: ["title", "description", "tags"],
            threshold: 0.4,
          })
        );
      });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => inputRef.current?.focus(), 100);
    return () => window.clearTimeout(timer);
  }, []);

  const results = useMemo(() => {
    if (!query.trim() || !fuse) {
      return [];
    }
    const fuseResults = fuse.search(query);
    return fuseResults.map((r) => r.item);
  }, [fuse, query]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4">
          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索文章..."
            className="flex-1 px-3 py-4 bg-transparent outline-none text-base text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />
          <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 rounded">
            ESC
          </kbd>
        </div>
        {query && (
          <div className="max-h-80 overflow-y-auto">
            {results.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                未找到相关文章
              </div>
            ) : (
              <ul className="py-2">
                {results.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/blog/${item.slug}`}
                      onClick={onClose}
                      className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {item.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {item.date}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {!query && index.length > 0 && (
          <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
            共 {index.length} 篇文章，输入关键词搜索
          </div>
        )}
      </div>
    </div>
  );
}
