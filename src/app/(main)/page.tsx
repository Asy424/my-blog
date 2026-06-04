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

export default function Home() {
  const posts = getSortedPostsData();
  const recentPosts = posts.slice(0, 5);
  const series = getSeriesSummaries().filter((item) => item.postCount > 0);
  const tags = getAllTags();

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Hero 区域 */}
      <section className="relative grid gap-10 border-b border-border pb-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)] lg:items-end">
        {/* 背景装饰 */}
        <div className="pointer-events-none absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-[0.04] dark:opacity-[0.03]"
          style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
        />
        <div className="pointer-events-none absolute -bottom-10 -left-10 w-64 h-64 rounded-full opacity-[0.03] dark:opacity-[0.02]"
          style={{ background: "radial-gradient(circle, #60a5fa 0%, transparent 70%)" }}
        />

        <div className="animate-fade-in-up">
          <p className="text-sm font-medium text-accent tracking-wide">
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
              className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-all hover:bg-accent hover:shadow-lg hover:-translate-y-0.5"
            >
              阅读文章
            </Link>
            <Link
              href="/series"
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:border-accent hover:text-accent hover:-translate-y-0.5"
            >
              查看系列
            </Link>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-3 rounded-xl border border-border bg-card/70 backdrop-blur-sm p-5 animate-fade-in-up animate-delay-2">
          {[
            { label: "文章", value: posts.length },
            { label: "系列", value: series.length },
            { label: "标签", value: tags.length },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-3xl font-semibold text-foreground font-display">
                {item.value}
              </div>
              <div className="mt-1 text-xs text-muted tracking-wide uppercase">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 最近更新 + 侧栏 */}
      <section className="grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          <div className="mb-6 flex items-center justify-between gap-4 animate-fade-in-up">
            <h2 className="font-display text-2xl font-normal tracking-tight text-foreground">
              最近更新
            </h2>
            <Link
              href="/blog"
              className="text-sm font-medium text-accent hover:opacity-80 transition-opacity"
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
              {recentPosts.map((post, i) => (
                <div key={post.slug} className={`animate-fade-in-up animate-delay-${Math.min(i + 1, 5)}`}>
                  <PostCard post={post} />
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="animate-fade-in-up animate-delay-3">
            <h2 className="font-display text-lg font-normal text-foreground">
              推荐系列
            </h2>
            <div className="mt-4 space-y-3">
              {series.slice(0, 4).map((item) => (
                <Link
                  key={item.slug}
                  href={`/series/${item.slug}`}
                  className="block rounded-lg border border-border bg-card/70 p-4 transition-all duration-300 hover:border-accent hover:shadow-sm hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-medium text-foreground text-sm">
                      {item.title}
                    </h3>
                    <span className="text-xs text-muted shrink-0">
                      {item.postCount} 篇
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {item.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card/70 backdrop-blur-sm p-5 animate-fade-in-up animate-delay-4">
            <h2 className="font-medium text-foreground text-sm">
              快速入口
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <Link className="rounded-md bg-accent-soft px-3 py-2 text-foreground/80 hover:text-accent transition-colors" href="/archive">
                时间归档
              </Link>
              <Link className="rounded-md bg-accent-soft px-3 py-2 text-foreground/80 hover:text-accent transition-colors" href="/tags">
                标签索引
              </Link>
              <Link className="rounded-md bg-accent-soft px-3 py-2 text-foreground/80 hover:text-accent transition-colors" href="/about">
                关于博客
              </Link>
              <Link className="rounded-md bg-accent-soft px-3 py-2 text-foreground/80 hover:text-accent transition-colors" href="/admin">
                写作管理
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
