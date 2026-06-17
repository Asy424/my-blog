import Link from "next/link";
import type { PostData } from "@/lib/posts";

interface PostNavProps {
  prev: PostData | null;
  next: PostData | null;
  seriesPrev?: PostData | null;
  seriesNext?: PostData | null;
}

function NavCard({
  post,
  label,
  align = "left",
}: {
  post: PostData;
  label: string;
  align?: "left" | "right";
}) {
  return (
    <Link
      suppressHydrationWarning
      href={`/blog/${post.slug}`}
      className={[
        "group flex flex-col gap-1 rounded-xl border border-border bg-card p-4 transition-all hover:border-accent hover:-translate-y-0.5",
        align === "right" ? "items-end text-right" : "",
      ].join(" ")}
      style={{ boxShadow: "var(--shadow-soft)" }}
    >
      <span className="text-xs font-medium text-muted uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm font-medium text-foreground group-hover:text-accent transition-colors line-clamp-2">
        {post.title}
      </span>
    </Link>
  );
}

export default function PostNav({
  prev,
  next,
  seriesPrev,
  seriesNext,
}: PostNavProps) {
  if (!prev && !next && !seriesPrev && !seriesNext) return null;

  return (
    <nav className="mt-16 space-y-8 border-t border-border pt-8">
      {(seriesPrev || seriesNext) && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted">本系列继续阅读</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {seriesPrev ? <NavCard post={seriesPrev} label="← 系列上一篇" /> : <div />}
            {seriesNext ? <NavCard post={seriesNext} label="系列下一篇 →" align="right" /> : <div />}
          </div>
        </section>
      )}
      {(prev || next) && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted">按时间线阅读</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {prev ? <NavCard post={prev} label="← 上一篇" /> : <div />}
            {next ? <NavCard post={next} label="下一篇 →" align="right" /> : <div />}
          </div>
        </section>
      )}
    </nav>
  );
}
