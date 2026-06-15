import { getSortedPostsData } from "@/lib/posts";
import PostCard from "@/components/PostCard";
import Link from "next/link";
import { getAllTags } from "@/lib/posts";
import { getSeriesSummaries } from "@/lib/series";
import { siteConfig } from "@/site.config";

export const metadata = {
  alternates: {
    canonical: "/",
  },
};

/** 系列色辅助类映射（静态字符串，避免 Tailwind purge） */
const seriesClass: Record<string, string> = {
  codex: "s-codex",
  "windows-setup": "s-windows",
  "java-functional": "s-java",
  "blog-building": "s-blog",
};

export default function Home() {
  const posts = getSortedPostsData();
  const featuredPost = posts[0];
  const restPosts = posts.slice(1, 5);
  const series = getSeriesSummaries().filter((item) => item.postCount > 0);
  const tags = getAllTags();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Hero 区域 */}
      <section className="relative grid gap-10 border-b border-border pb-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)] lg:items-end">
        {/* 背景装饰 —— 调到可感知 */}
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full opacity-[0.12] dark:opacity-[0.09]"
          style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-10 -left-10 h-64 w-64 rounded-full opacity-[0.1] dark:opacity-[0.07]"
          style={{ background: "radial-gradient(circle, var(--s-codex) 0%, transparent 70%)" }}
        />

        <div className="animate-fade-in-up">
          <p className="text-sm font-medium tracking-wide text-accent">
            AI 工具 / 编程学习 / 系统配置
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-normal leading-tight tracking-tight text-foreground sm:text-5xl">
            把折腾过的工具、踩过的坑和学会的东西整理成可回看的笔记。
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-muted">
            {siteConfig.description} 这里更适合按文章、系列和时间线浏览，而不是在零散标签里找方向。
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/blog"
              className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-all hover:-translate-y-0.5 hover:bg-accent"
              style={{ boxShadow: "var(--shadow-soft)" }}
            >
              阅读文章
            </Link>
            <Link
              href="/series"
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:-translate-y-0.5 hover:border-accent hover:text-accent"
            >
              查看系列
            </Link>
          </div>
        </div>

        {/* 统计卡片 */}
        <div
          className="grid grid-cols-3 gap-3 rounded-xl border border-border bg-card/80 p-5 backdrop-blur-sm animate-fade-in-up animate-delay-2"
          style={{ boxShadow: "var(--shadow-soft)" }}
        >
          {[
            { label: "文章", value: posts.length },
            { label: "系列", value: series.length },
            { label: "标签", value: tags.length },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="font-display text-3xl font-semibold text-foreground">
                {item.value}
              </div>
              <div className="mt-1 text-xs uppercase tracking-wide text-muted">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 按系列阅读 —— 横向卡带 */}
      {series.length > 0 && (
        <section className="py-12 animate-fade-in-up animate-delay-2">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="font-display text-2xl font-normal tracking-tight text-foreground">
              按系列阅读
            </h2>
            <Link
              href="/series"
              className="text-sm font-medium text-accent transition-opacity hover:opacity-80"
            >
              全部系列 →
            </Link>
          </div>
          <div className="series-rail">
            {series.map((item) => {
              const cls = seriesClass[item.slug] ?? "";
              return (
                <Link
                  key={item.slug}
                  href={`/series/${item.slug}`}
                  className={[
                    "group flex flex-col overflow-hidden rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5",
                    cls,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{ boxShadow: "var(--shadow-soft)" }}
                >
                  <span
                    aria-hidden
                    className="mb-4 h-1.5 w-12 rounded-full"
                    style={{ background: "var(--series)" }}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-foreground transition-colors group-hover:text-accent">
                      {item.title}
                    </h3>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ background: "var(--series-soft)", color: "var(--series)" }}
                    >
                      {item.postCount} 篇
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                    {item.description}
                  </p>
                  {item.posts.length > 0 && (
                    <div className="mt-auto space-y-1.5 border-t border-border pt-3">
                      {item.posts.slice(0, 2).map((post) => (
                        <div key={post.slug} className="truncate text-xs text-muted">
                          · {post.title}
                        </div>
                      ))}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 最近更新 */}
      <section className="py-12">
        <div className="mb-6 flex items-center justify-between gap-4 animate-fade-in-up">
          <h2 className="font-display text-2xl font-normal tracking-tight text-foreground">
            最近更新
          </h2>
          <Link
            href="/blog"
            className="text-sm font-medium text-accent transition-opacity hover:opacity-80"
          >
            全部文章 →
          </Link>
        </div>
        {posts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-16 text-center text-muted">
            <p className="text-lg">还没有文章</p>
            <p className="mt-2">敬请期待。</p>
          </div>
        ) : (
          <div className="space-y-4">
            {featuredPost && (
              <div className="animate-fade-in-up">
                <PostCard post={featuredPost} featured />
              </div>
            )}
            {restPosts.map((post, i) => (
              <div key={post.slug} className={`animate-fade-in-up animate-delay-${Math.min(i + 1, 4)}`}>
                <PostCard post={post} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
