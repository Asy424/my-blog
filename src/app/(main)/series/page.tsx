import Link from "next/link";
import { getSeriesSummaries } from "@/lib/series";

const accentClasses = {
  blue: "border-blue-200 bg-blue-50/70 text-blue-700 dark:border-blue-900/70 dark:bg-blue-950/30 dark:text-blue-300",
  emerald: "border-emerald-200 bg-emerald-50/70 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300",
  violet: "border-violet-200 bg-violet-50/70 text-violet-700 dark:border-violet-900/70 dark:bg-violet-950/30 dark:text-violet-300",
  amber: "border-amber-200 bg-amber-50/70 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-300",
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
    <div className="max-w-6xl mx-auto px-4 py-12">
      <header className="max-w-3xl">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-300">
          阅读路线
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 dark:text-gray-50">
          系列
        </h1>
        <p className="mt-4 text-base leading-8 text-gray-600 dark:text-gray-400">
          标签适合检索，系列更适合连续阅读。这里把相关笔记整理成几条主题路线。
        </p>
      </header>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {series.map((item) => (
          <Link
            key={item.slug}
            href={`/series/${item.slug}`}
            className="group rounded-lg border border-gray-200 bg-white/80 p-6 shadow-sm shadow-gray-200/40 transition-colors hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-none dark:hover:border-blue-700"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${accentClasses[item.accent]}`}>
                  {item.postCount} 篇文章
                </span>
                <h2 className="mt-4 text-xl font-semibold text-gray-950 transition-colors group-hover:text-blue-600 dark:text-gray-50 dark:group-hover:text-blue-300">
                  {item.title}
                </h2>
              </div>
              {item.latestDate && (
                <time
                  dateTime={item.latestDate}
                  className="shrink-0 text-sm text-gray-400 dark:text-gray-500"
                >
                  {item.latestDate}
                </time>
              )}
            </div>
            <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
              {item.description}
            </p>
            {item.posts.length > 0 && (
              <div className="mt-5 space-y-2 border-t border-gray-100 pt-4 dark:border-slate-800">
                {item.posts.slice(0, 3).map((post) => (
                  <div
                    key={post.slug}
                    className="text-sm text-gray-500 dark:text-gray-400"
                  >
                    {post.title}
                  </div>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
