import Link from "next/link";
import { getSeriesSummaries } from "@/lib/series";

/** 系列色辅助类映射（静态字符串，避免 Tailwind purge） */
const seriesClass: Record<string, string> = {
  codex: "s-codex",
  "windows-setup": "s-windows",
  "java-functional": "s-java",
  "blog-building": "s-blog",
};

export const metadata = {
  title: "系列",
  description: "按主题整理的博客阅读路线",
  alternates: {
    canonical: "/series",
  },
};

export default function SeriesPage() {
  const series = getSeriesSummaries().filter((item) => item.postCount > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <header className="max-w-3xl animate-fade-in-up">
        <p className="text-sm font-medium tracking-wide text-accent">
          阅读路线
        </p>
        <h1 className="mt-3 font-display text-3xl font-normal tracking-tight text-foreground">
          系列
        </h1>
        <p className="mt-4 text-base leading-8 text-muted">
          标签适合检索，系列更适合连续阅读。这里把相关笔记整理成几条主题路线。
        </p>
      </header>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {series.map((item, i) => {
          const cls = seriesClass[item.slug] ?? "";
          return (
            <Link
              key={item.slug}
              href={`/series/${item.slug}`}
              className={[
                "group overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-accent animate-fade-in-up",
                `animate-delay-${Math.min(i + 1, 5)}`,
                cls,
              ]
                .filter(Boolean)
                .join(" ")}
              style={{ boxShadow: "var(--shadow-soft)" }}
            >
              {/* 系列色渐变 banner */}
              <div
                className="relative h-20 px-6 py-4"
                style={{
                  background:
                    "linear-gradient(120deg, var(--series-soft), color-mix(in srgb, var(--series) 28%, var(--card)))",
                }}
              >
                <div className="flex h-full items-end justify-between gap-3">
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{ background: "var(--card)", color: "var(--series)" }}
                  >
                    {item.postCount} 篇文章
                  </span>
                  {item.latestDate && (
                    <time
                      dateTime={item.latestDate}
                      className="shrink-0 text-xs text-muted"
                    >
                      更新于 {item.latestDate}
                    </time>
                  )}
                </div>
              </div>

              <div className="p-6">
                <h2 className="text-xl font-semibold text-foreground transition-colors group-hover:text-accent">
                  {item.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {item.description}
                </p>
                {item.posts.length > 0 && (
                  <div className="mt-5 space-y-2 border-t border-border pt-4">
                    {item.posts.slice(0, 3).map((post) => (
                      <div
                        key={post.slug}
                        className="flex items-center gap-2 text-sm text-muted"
                      >
                        <span
                          aria-hidden
                          className="h-1 w-1 shrink-0 rounded-full"
                          style={{ background: "var(--series)" }}
                        />
                        <span className="truncate">{post.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
