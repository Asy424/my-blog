import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPostsBySeries,
  getSeriesBySlug,
  seriesList,
} from "@/lib/series";
import { siteConfig } from "@/site.config";

/** 系列色辅助类映射（静态字符串，避免 Tailwind purge） */
const seriesClass: Record<string, string> = {
  codex: "s-codex",
  "windows-setup": "s-windows",
  "java-functional": "s-java",
  "blog-building": "s-blog",
};

interface SeriesDetailPageProps {
  params: Promise<{ series: string }>;
}

export async function generateMetadata({ params }: SeriesDetailPageProps) {
  const { series: slug } = await params;
  const series = getSeriesBySlug(slug);
  if (!series) return { title: "系列未找到" };
  const path = `/series/${series.slug}`;

  return {
    title: series.title,
    description: series.description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: series.title,
      description: series.description || siteConfig.description,
      url: `${siteConfig.url}${path}`,
      siteName: siteConfig.name,
      type: "website",
    },
  };
}

export function generateStaticParams() {
  return seriesList.map((series) => ({
    series: series.slug,
  }));
}

export default async function SeriesDetailPage({ params }: SeriesDetailPageProps) {
  const { series: slug } = await params;
  const series = getSeriesBySlug(slug);

  if (!series) {
    notFound();
  }

  const posts = getPostsBySeries(series);
  const cls = seriesClass[series.slug] ?? "";

  return (
    <div className={["mx-auto max-w-5xl px-4 py-12", cls].filter(Boolean).join(" ")}>
      {/* 系列色 banner header */}
      <header
        className="overflow-hidden rounded-xl border border-border animate-fade-in-up"
        style={{
          boxShadow: "var(--shadow-soft)",
          background:
            "linear-gradient(120deg, var(--series-soft), color-mix(in srgb, var(--series) 18%, var(--card)))",
        }}
      >
        <div className="px-6 py-8 sm:px-8">
          <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--series)" }}>
            <span
              aria-hidden
              className="h-2 w-2 rounded-full"
              style={{ background: "var(--series)" }}
            />
            阅读路线
          </div>
          <h1 className="mt-3 font-display text-3xl font-normal tracking-tight text-foreground sm:text-4xl">
            {series.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-muted">
            {series.description}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-muted">
            <span
              className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
              style={{ background: "var(--card)", color: "var(--series)" }}
            >
              共 {posts.length} 篇
            </span>
            <Link href="/series" className="hover:text-accent transition-colors">
              ← 全部系列
            </Link>
          </div>
        </div>
      </header>

      {posts.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-border py-16 text-center text-muted">
          这个系列暂时没有公开文章。
        </div>
      ) : (
        /* 纵向时间线：每篇是一个带编号的步骤节点 */
        <ol className="mt-10 space-y-4">
          {posts.map((post, i) => (
            <li
              key={post.slug}
              className={`relative animate-fade-in-up animate-delay-${Math.min(i + 1, 5)}`}
            >
              <Link
                href={`/blog/${post.slug}`}
                className="group flex gap-4 rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent"
                style={{ boxShadow: "var(--shadow-soft)" }}
              >
                {/* 步骤编号 */}
                <div className="flex flex-col items-center">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-lg font-semibold"
                    style={{ background: "var(--series-soft)", color: "var(--series)" }}
                  >
                    {i + 1}
                  </span>
                  {/* 连接线（非最后一项） */}
                  {i < posts.length - 1 && (
                    <span
                      aria-hidden
                      className="mt-1 w-px flex-1"
                      style={{ background: "var(--series-soft)", minHeight: "1.5rem" }}
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    <time dateTime={post.date}>{post.date}</time>
                    {post.readingTime && <span>· {post.readingTime} 分钟</span>}
                  </div>
                  <h2 className="mt-1 text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">
                    {post.title}
                  </h2>
                  {post.description && (
                    <p className="mt-1.5 text-sm leading-6 text-muted line-clamp-2">
                      {post.description}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
