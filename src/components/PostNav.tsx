import Link from "next/link";
import type { PostData } from "@/lib/posts";

interface PostNavProps {
  prev: PostData | null;
  next: PostData | null;
}

export default function PostNav({ prev, next }: PostNavProps) {
  if (!prev && !next) return null;

  return (
    <nav className="mt-16 pt-8 border-t border-border grid gap-4 sm:grid-cols-2">
      {prev ? (
        <Link
          href={`/blog/${prev.slug}`}
          className="group flex flex-col gap-1 rounded-xl border border-border bg-card p-4 transition-all hover:border-accent hover:-translate-y-0.5"
          style={{ boxShadow: "var(--shadow-soft)" }}
        >
          <span className="text-xs font-medium text-muted uppercase tracking-wide">
            &larr; 上一篇
          </span>
          <span className="text-sm font-medium text-foreground group-hover:text-accent transition-colors line-clamp-2">
            {prev.title}
          </span>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={`/blog/${next.slug}`}
          className="group flex flex-col gap-1 items-end text-right rounded-xl border border-border bg-card p-4 transition-all hover:border-accent hover:-translate-y-0.5"
          style={{ boxShadow: "var(--shadow-soft)" }}
        >
          <span className="text-xs font-medium text-muted uppercase tracking-wide">
            下一篇 &rarr;
          </span>
          <span className="text-sm font-medium text-foreground group-hover:text-accent transition-colors line-clamp-2">
            {next.title}
          </span>
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}
