"use client";

import { useEffect, useState } from "react";

interface ReadingStatsProps {
  slug: string;
}

interface ReadingStat {
  count: number;
  lastReadAt: string;
}

const STORAGE_KEY = "blog-reading-stats";

function readStats(): Record<string, ReadingStat> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export default function ReadingStats({ slug }: ReadingStatsProps) {
  const [stat, setStat] = useState<ReadingStat | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      const stats = readStats();
      const current = stats[slug] || { count: 0, lastReadAt: "" };
      const next = {
        count: current.count + 1,
        lastReadAt: new Date().toISOString(),
      };
      stats[slug] = next;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
      setStat(next);
    });
  }, [slug]);

  if (!stat) return null;

  return (
    <span className="inline-flex items-center gap-1.5">
      <svg suppressHydrationWarning className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M3 3v18h18M7 15l3-3 3 2 5-7"
        />
      </svg>
      <span>本机第 {stat.count} 次阅读</span>
    </span>
  );
}
