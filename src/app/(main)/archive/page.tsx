import Link from "next/link";
import { getSortedPostsData, type PostData } from "@/lib/posts";

interface ArchiveGroup {
  key: string;
  label: string;
  posts: PostData[];
}

export const metadata = {
  title: "归档",
  description: "按时间浏览全部公开文章",
  alternates: {
    canonical: "/archive",
  },
};

function formatMonthLabel(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return `${parsed.getFullYear()} 年 ${parsed.getMonth() + 1} 月`;
}

function groupPostsByMonth(posts: PostData[]): ArchiveGroup[] {
  const groups = new Map<string, ArchiveGroup>();

  posts.forEach((post) => {
    const key = post.date.slice(0, 7);
    const existing = groups.get(key);
    if (existing) {
      existing.posts.push(post);
      return;
    }
    groups.set(key, {
      key,
      label: formatMonthLabel(post.date),
      posts: [post],
    });
  });

  return Array.from(groups.values());
}

export default function ArchivePage() {
  const posts = getSortedPostsData();
  const groups = groupPostsByMonth(posts);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <header className="max-w-3xl">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-300">
          时间线
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 dark:text-gray-50">
          归档
        </h1>
        <p className="mt-4 text-base leading-8 text-gray-600 dark:text-gray-400">
          按发布时间整理全部公开文章，适合快速回看博客的更新脉络。
        </p>
      </header>

      {groups.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-gray-300 py-16 text-center text-gray-500 dark:border-slate-700 dark:text-gray-400">
          还没有公开文章。
        </div>
      ) : (
        <div className="mt-10 space-y-10">
          {groups.map((group) => (
            <section
              key={group.key}
              className="grid gap-4 border-t border-gray-200 pt-6 dark:border-slate-800 md:grid-cols-[10rem_minmax(0,1fr)]"
            >
              <h2 className="text-lg font-semibold text-gray-950 dark:text-gray-50">
                {group.label}
              </h2>
              <div className="space-y-3">
                {group.posts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group flex flex-col gap-2 rounded-lg border border-gray-200 bg-white/70 p-4 transition-colors hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-blue-700 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div>
                      <h3 className="font-medium text-gray-950 group-hover:text-blue-600 dark:text-gray-50 dark:group-hover:text-blue-300">
                        {post.title}
                      </h3>
                      {post.description && (
                        <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                          {post.description}
                        </p>
                      )}
                    </div>
                    <time
                      dateTime={post.date}
                      className="shrink-0 text-sm text-gray-400 dark:text-gray-500"
                    >
                      {post.date}
                    </time>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
