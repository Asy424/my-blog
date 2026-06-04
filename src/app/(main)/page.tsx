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
      <section className="grid gap-10 border-b border-gray-200/80 pb-12 dark:border-slate-800/80 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)] lg:items-end">
        <div>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-300">
            AI 工具 / 编程学习 / 系统配置
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-gray-950 dark:text-gray-50 sm:text-5xl">
            把折腾过的工具、踩过的坑和学会的东西整理成可回看的笔记。
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-gray-600 dark:text-gray-400">
            {siteConfig.description} 这里更适合按文章、系列和时间线浏览，而不是在零散标签里找方向。
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/blog"
              className="rounded-lg bg-gray-950 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600 dark:bg-gray-100 dark:text-slate-950 dark:hover:bg-blue-200"
            >
              阅读文章
            </Link>
            <Link
              href="/series"
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:text-gray-300 dark:hover:border-blue-500 dark:hover:text-blue-300"
            >
              查看系列
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 rounded-lg border border-gray-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/60">
          {[
            { label: "文章", value: posts.length },
            { label: "系列", value: series.length },
            { label: "标签", value: tags.length },
          ].map((item) => (
            <div key={item.label}>
              <div className="text-2xl font-semibold text-gray-950 dark:text-gray-50">
                {item.value}
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-950 dark:text-gray-50">
              最近更新
            </h2>
            <Link
              href="/blog"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
            >
              全部文章
            </Link>
          </div>
          {posts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 py-16 text-center text-gray-500 dark:border-slate-700 dark:text-gray-400">
              <p className="text-lg">还没有文章</p>
              <p className="mt-2">敬请期待。</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </div>
        <aside className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-950 dark:text-gray-50">
              推荐系列
            </h2>
            <div className="mt-4 space-y-3">
              {series.slice(0, 4).map((item) => (
                <Link
                  key={item.slug}
                  href={`/series/${item.slug}`}
                  className="block rounded-lg border border-gray-200 bg-white/70 p-4 transition-colors hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-blue-700"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-medium text-gray-950 dark:text-gray-50">
                      {item.title}
                    </h3>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {item.postCount} 篇
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                    {item.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/60">
            <h2 className="font-semibold text-gray-950 dark:text-gray-50">
              快速入口
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <Link className="rounded-md bg-gray-100 px-3 py-2 text-gray-700 hover:text-blue-600 dark:bg-slate-800 dark:text-gray-300 dark:hover:text-blue-300" href="/archive">
                时间归档
              </Link>
              <Link className="rounded-md bg-gray-100 px-3 py-2 text-gray-700 hover:text-blue-600 dark:bg-slate-800 dark:text-gray-300 dark:hover:text-blue-300" href="/tags">
                标签索引
              </Link>
              <Link className="rounded-md bg-gray-100 px-3 py-2 text-gray-700 hover:text-blue-600 dark:bg-slate-800 dark:text-gray-300 dark:hover:text-blue-300" href="/about">
                关于博客
              </Link>
              <Link className="rounded-md bg-gray-100 px-3 py-2 text-gray-700 hover:text-blue-600 dark:bg-slate-800 dark:text-gray-300 dark:hover:text-blue-300" href="/admin">
                写作管理
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
