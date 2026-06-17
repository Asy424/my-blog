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
      <header className="max-w-3xl animate-fade-in-up">
        <p className="text-sm font-medium text-accent tracking-wide">
          时间线
        </p>
        <h1 className="mt-3 font-display text-3xl font-normal tracking-tight text-foreground">
          归档
        </h1>
        <p className="mt-4 text-base leading-8 text-muted">
          按发布时间整理全部公开文章，适合快速回看博客的更新脉络。
        </p>
      </header>

      {groups.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-border py-16 text-center text-muted">
          还没有公开文章。
        </div>
      ) : (
        <div className="mt-10 space-y-10">
          {groups.map((group, gi) => (
            <section
              key={group.key}
              className={`grid gap-4 border-t border-border pt-6 md:grid-cols-[10rem_minmax(0,1fr)] animate-fade-in-up animate-delay-${Math.min(gi + 1, 5)}`}
            >
              <h2 className="font-display text-lg font-normal text-foreground">
                {group.label}
              </h2>
              <div className="space-y-3">
                {group.posts.map((post) => (
                  <Link
                    suppressHydrationWarning
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-4 transition-all duration-300 hover:border-accent hover:-translate-y-0.5 sm:flex-row sm:items-start sm:justify-between"
                    style={{ boxShadow: "var(--shadow-soft)" }}
                  >
                    <div>
                      <h3 className="font-medium text-foreground group-hover:text-accent transition-colors">
                        {post.title}
                      </h3>
                      {post.description && (
                        <p className="mt-1 text-sm leading-6 text-muted">
                          {post.description}
                        </p>
                      )}
                    </div>
                    <time
                      dateTime={post.date}
                      className="shrink-0 text-sm text-muted"
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
