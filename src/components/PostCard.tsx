import Link from "next/link";
import type { PostData } from "@/lib/posts";
import { getSeriesForPost } from "@/lib/series";
import TagBadge from "./TagBadge";

interface PostCardProps {
  post: PostData;
  /** 特色大卡：更大标题、更宽 padding、顶部 accent 渐变条 */
  featured?: boolean;
}

/** 系列色辅助类映射（静态字符串，避免 Tailwind purge） */
const seriesClass: Record<string, string> = {
  codex: "s-codex",
  "windows-setup": "s-windows",
  "java-functional": "s-java",
  "blog-building": "s-blog",
};

export default function PostCard({ post, featured = false }: PostCardProps) {
  const series = getSeriesForPost(post);
  const seriesClassName = series ? seriesClass[series.slug] ?? "" : "";

  return (
    <article
      className={[
        "group relative overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-accent animate-fade-in-up",
        featured ? "p-7 sm:p-8" : "p-5",
        seriesClassName,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ boxShadow: "var(--shadow-soft)" }}
    >
      {/* 系列色条：普通卡左侧细条；特色卡顶部渐变条 */}
      {series && seriesClassName && (
        featured ? (
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-1"
            style={{
              background: `linear-gradient(90deg, var(--series), color-mix(in srgb, var(--series) 50%, transparent))`,
            }}
          />
        ) : (
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 w-[3px]"
            style={{ background: "var(--series)" }}
          />
        )
      )}

      {/* hover 暖色光晕 */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--accent) 18%, transparent), transparent 70%)",
        }}
      />

      <div className={featured ? "relative flex flex-col gap-3" : "relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"}>
        <div className="min-w-0">
          {series && (
            <Link
              href={`/series/${series.slug}`}
              className="mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-opacity hover:opacity-80"
              style={{ background: "var(--series-soft)", color: "var(--series)" }}
            >
              {series.title}
            </Link>
          )}
          <Link href={`/blog/${post.slug}`} className="block">
            <h2
              className={[
                "leading-snug text-foreground transition-colors group-hover:text-accent",
                featured
                  ? "font-display text-2xl font-normal tracking-tight sm:text-3xl"
                  : "text-lg font-semibold",
              ].join(" ")}
            >
              {post.title}
            </h2>
          </Link>
          <p
            className={[
              "mt-2 text-muted",
              featured ? "text-base leading-7" : "text-sm leading-6",
            ].join(" ")}
          >
            {post.description || "这篇文章还没有摘要。"}
          </p>
        </div>

        {/* 元信息：图标化 */}
        <div className="flex shrink-0 items-center gap-3 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <time dateTime={post.date}>{post.date}</time>
          </span>
          {post.readingTime && (
            <span className="inline-flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{post.readingTime} 分钟</span>
            </span>
          )}
        </div>
      </div>

      {post.tags.length > 0 && (
        <div className="relative mt-4 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>
      )}
    </article>
  );
}
